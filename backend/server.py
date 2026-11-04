from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import re
import secrets
import hashlib
from collections import Counter
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import shutil
import uuid
from pymongo.errors import DuplicateKeyError

# Load .env before auth.py reads SECRET_KEY.
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import local modules
from models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    Product, ProductCreate, Category, CategoryCreate,
    Review, ReviewCreate, CartItem, CartItemBase,
    WishlistItem, Order, OrderCreate,
    Newsletter, NewsletterSubscribe,
    ContactMessage, ContactMessageCreate,
    MessageResponse, StatsResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user
)
from utils import create_slug, generate_order_number, serialize_datetime

# Setup paths and environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'koffi_shop')]

# Create the main app
app = FastAPI(title="KOFFI SHOP API")

# Create upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def normalize_email(value: str) -> str:
    """Return the canonical form used to identify an email account."""
    return value.strip().casefold()


def normalize_phone(value: Optional[str]) -> Optional[str]:
    """Normalize phone formatting without guessing a country code."""
    if not value:
        return None
    digits = re.sub(r"\D", "", value)
    return digits or None


async def find_user_by_email(email_key: str):
    """Find an account across migrated and legacy records."""
    return await db.users.find_one({
        "$or": [
            {"normalized_email": email_key},
            {"email": {"$regex": f"^{re.escape(email_key)}$", "$options": "i"}},
        ]
    })


async def ensure_user_identity_indexes():
    """Backfill canonical identifiers and enforce email uniqueness when safe.

    Phone numbers are normalized for lookup/diagnostics but are not unique:
    family members may legitimately share one contact number.
    """
    email_values = []
    phone_values = []
    async for item in db.users.find({}, {"email": 1, "phone": 1}):
        email_key = normalize_email(item.get("email") or "")
        phone_key = normalize_phone(item.get("phone"))
        if email_key:
            email_values.append(email_key)
        if phone_key:
            phone_values.append(phone_key)

        identity_update = {"$set": {}}
        if email_key:
            identity_update["$set"]["normalized_email"] = email_key
        else:
            identity_update["$unset"] = {"normalized_email": ""}
        if phone_key:
            identity_update["$set"]["normalized_phone"] = phone_key
        else:
            identity_update.setdefault("$unset", {})["normalized_phone"] = ""

        await db.users.update_one({"_id": item["_id"]}, identity_update)

    duplicate_emails = [key for key, count in Counter(email_values).items() if count > 1]
    duplicate_phones = [key for key, count in Counter(phone_values).items() if count > 1]
    if duplicate_emails:
        logger.error(
            "duplicate legacy accounts require manual review (%s groups); email unique index not created. No accounts were merged or deleted.",
            len(duplicate_emails),
        )
    else:
        await db.users.create_index(
            "normalized_email",
            unique=True,
            sparse=True,
            name="uniq_users_normalized_email",
        )

    if duplicate_phones:
        logger.warning(
            "Shared/duplicate phone numbers detected (%s groups). Phone numbers are not treated as unique account identifiers.",
            len(duplicate_phones),
        )

# Password recovery: short-lived, single-use, hashed tokens.
PASSWORD_RESET_TTL_MINUTES = 30
PASSWORD_RESET_COOLDOWN_SECONDS = 60


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def send_password_reset_email(recipient: str, reset_url: str) -> None:
    """Send recovery email using explicitly configured SMTP credentials."""
    import smtplib
    from email.message import EmailMessage

    required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM"]
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise RuntimeError("Password recovery email is not configured: " + ", ".join(missing))

    message = EmailMessage()
    message["Subject"] = "Réinitialisation de votre mot de passe KOFFI SHOP"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = recipient
    message.set_content(
        "Vous avez demandé à réinitialiser votre mot de passe KOFFI SHOP.\n\n"
        f"Utilisez ce lien dans les 30 minutes : {reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
    )
    port = int(os.environ["SMTP_PORT"])
    if os.environ.get("SMTP_USE_SSL", "false").lower() == "true":
        with smtplib.SMTP_SSL(os.environ["SMTP_HOST"], port, timeout=15) as smtp:
            smtp.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
            smtp.send_message(message)
    else:
        with smtplib.SMTP(os.environ["SMTP_HOST"], port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
            smtp.send_message(message)


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Always return the same public response to avoid account enumeration."""
    generic = {"message": "Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé."}
    email_key = normalize_email(str(request.email))
    account = await find_user_by_email(email_key)
    if not account:
        return generic

    now = datetime.utcnow()
    last_request = account.get("password_reset_requested_at")
    if isinstance(last_request, str):
        try:
            last_request = datetime.fromisoformat(last_request)
        except ValueError:
            last_request = None
    if last_request and (now - last_request).total_seconds() < PASSWORD_RESET_COOLDOWN_SECONDS:
        return generic

    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_reset_token(raw_token)
    expires_at = now + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES)
    await db.password_reset_tokens.delete_many({"user_id": account["id"]})
    await db.password_reset_tokens.insert_one({
        "token_hash": token_hash,
        "user_id": account["id"],
        "created_at": now,
        "expires_at": expires_at,
        "used": False,
    })
    await db.users.update_one(
        {"id": account["id"]},
        {"$set": {"password_reset_requested_at": now.isoformat()}}
    )

    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
    if not frontend_url.startswith("https://"):
        await db.password_reset_tokens.delete_one({"token_hash": token_hash})
        logger.error("Password recovery disabled: FRONTEND_URL must be configured with HTTPS.")
        return generic

    reset_url = f"{frontend_url}/reset-password?token={raw_token}"
    try:
        await asyncio.to_thread(send_password_reset_email, account["email"], reset_url)
    except Exception:
        await db.password_reset_tokens.delete_one({"token_hash": token_hash})
        logger.exception("Could not send password recovery email.")
    return generic


@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Consume a valid reset token exactly once and replace the password hash."""
    token_hash = hash_reset_token(request.token)
    now = datetime.utcnow()
    reset_record = await db.password_reset_tokens.find_one_and_delete({
        "token_hash": token_hash,
        "used": False,
        "expires_at": {"$gt": now},
    })
    if not reset_record:
        raise HTTPException(status_code=400, detail="Ce lien est invalide ou expiré. Demandez un nouveau lien.")

    account = await db.users.find_one({"id": reset_record["user_id"]})
    if not account:
        raise HTTPException(status_code=400, detail="Ce lien est invalide ou expiré. Demandez un nouveau lien.")

    await db.users.update_one(
        {"id": account["id"]},
        {"$set": {
            "password": get_password_hash(request.new_password),
            "updated_at": now.isoformat(),
        }, "$inc": {"token_version": 1}}
    )
    await db.password_reset_tokens.delete_many({"user_id": account["id"]})
    return {"message": "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter."}



async def require_current_admin(current_user: dict = Depends(get_current_user)):
    """Revalide le rôle administrateur depuis MongoDB à chaque requête."""
    user_doc = await db.users.find_one(
        {"id": current_user["id"]},
        {"_id": 0, "role": 1, "email": 1}
    )
    if not user_doc or user_doc.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès administrateur refusé"
        )
    return {"id": current_user["id"], "email": user_doc.get("email"), "role": "admin"}

async def require_current_admin_or_collaborator(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "role": 1, "email": 1, "is_active": 1})
    if not user_doc or user_doc.get("is_active", True) is False or user_doc.get("role") not in {"admin", "collaborator"}:
        raise HTTPException(status_code=403, detail="Accès réservé à l'équipe KOFFI SHOP")
    return {"id": current_user["id"], "email": user_doc.get("email"), "role": user_doc["role"]}



async def create_user_notification(user_id: str, kind: str, title: str, message: str, link: str = "/"):
    now = datetime.utcnow().isoformat()
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "type": kind,
        "title": title, "message": message, "link": link,
        "is_read": False, "created_at": now
    })

async def notify_all_admins(kind: str, title: str, message: str, link: str = "/admin/orders"):
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).to_list(500)
    for admin in admins:
        await create_user_notification(admin["id"], kind, title, message, link)

# ============================================
# NOTIFICATION ROUTES
# ============================================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    items = await db.notifications.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    unread = await db.notifications.count_documents({"user_id": current_user["id"], "is_read": False})
    return {"items": items, "unread_count": unread}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return {"message": "Notification marquée comme lue"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notifications marquées comme lues"}

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@api_router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user."""
    email_key = normalize_email(str(user_data.email))
    phone_key = normalize_phone(user_data.phone)

    if await find_user_by_email(email_key):
        raise HTTPException(status_code=409, detail="Cette adresse e-mail possède déjà un compte. Connectez-vous plutôt que de créer un doublon.")
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict["email"] = email_key
    user = User(**user_dict)
    doc = user.model_dump()
    doc["normalized_email"] = email_key
    doc["normalized_phone"] = phone_key
    doc["token_version"] = 0
    doc["password"] = get_password_hash(user_data.password)
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()

    try:
        await db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cette adresse e-mail ou ce numéro de téléphone. Connectez-vous.")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "ver": 0}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user."""
    # Find the account using the same canonical email used at registration.
    email_key = normalize_email(str(credentials.email))
    user_doc = await find_user_by_email(email_key)
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Convert datetime strings back to datetime objects
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc['updated_at'], str):
        user_doc['updated_at'] = datetime.fromisoformat(user_doc['updated_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password' and k != '_id'})
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "ver": int(user_doc.get("token_version", 0))}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user.model_dump())
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    user_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert datetime strings
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return UserResponse(**user_doc)

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    city: Optional[str] = None,
    postal_code: Optional[str] = None,
    country: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile."""
    update_data = {}
    if full_name: update_data["full_name"] = full_name
    if phone is not None:
        phone_key = normalize_phone(phone)
        update_data["phone"] = phone.strip() or None
        if phone_key:
            update_data["normalized_phone"] = phone_key
        else:
            update_data["normalized_phone"] = None
    if address: update_data["address"] = address
    if city: update_data["city"] = city
    if postal_code: update_data["postal_code"] = postal_code
    if country: update_data["country"] = country
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_operations = {"$set": update_data}
        if phone is not None and not normalize_phone(phone):
            update_operations["$unset"] = {"normalized_phone": ""}
        await db.users.update_one(
            {"id": current_user["id"]},
            update_operations
        )
    
    user_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return UserResponse(**user_doc)

# ============================================
# CATEGORY ROUTES
# ============================================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Get all categories."""
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category, dependencies=[Depends(require_current_admin)])
async def create_category(category_data: CategoryCreate):
    """Create a new category (Admin only)."""
    category = Category(**category_data.model_dump())
    category.slug = create_slug(category.name)
    
    doc = category.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.categories.insert_one(doc)
    return category

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    """Get a single category."""
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if isinstance(category.get('created_at'), str):
        category['created_at'] = datetime.fromisoformat(category['created_at'])
    return category

# ============================================
# PRODUCT ROUTES
    
@api_router.put("/categories/{category_id}", dependencies=[Depends(require_current_admin)])
async def update_category(category_id: str, category_data: CategoryCreate):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    update = category_data.model_dump()
    update["slug"] = create_slug(category_data.name)
    await db.categories.update_one({"id": category_id}, {"$set": update})
    return await db.categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/categories/{category_id}", dependencies=[Depends(require_current_admin)])
async def delete_category(category_id: str):
    if not await db.categories.find_one({"id": category_id}):
        raise HTTPException(status_code=404, detail="Catégorie introuvable")
    if await db.products.count_documents({"category_id": category_id}) > 0:
        raise HTTPException(status_code=409, detail="Impossible de supprimer une catégorie qui contient des produits")
    await db.categories.delete_one({"id": category_id})
    return {"message": "Catégorie supprimée"}

# ============================================

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all products with filters."""
    query = {}
    
    if category:
        query["category_id"] = category
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    if min_price != None or max_price != None:
        query["price"] = {}
        if min_price != None:
            query["price"]["$gte"] = min_price
        if max_price != None:
            query["price"]["$lte"] = max_price
    
    if is_featured != None:
        query["is_featured"] = is_featured
    
    # Sorting
    sort_options = {
        "newest": [("created_at", -1)],
        "oldest": [("created_at", 1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "popular": [("sold_count", -1)],
        "rating": [("rating", -1)]
    }
    
    sort_by = sort_options.get(sort, [("created_at", -1)])
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_by).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a single product."""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product.get('updated_at'), str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return product

@api_router.post("/products", response_model=Product, dependencies=[Depends(require_current_admin)])
async def create_product(product_data: ProductCreate):
    """Create a new product (Admin only)."""
    category = await db.categories.find_one({"id": product_data.category_id})
    if not category:
        raise HTTPException(
            status_code=400,
            detail="Catégorie introuvable : choisissez une catégorie existante"
        )

    product = Product(**product_data.model_dump())
    product.slug = create_slug(product.name)
    
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.products.insert_one(doc)
    customers = await db.users.find({"role": "customer"}, {"_id": 0, "id": 1}).to_list(5000)
    for customer in customers:
        await create_user_notification(customer["id"], "new_product", "Nouveau produit disponible", f"{product.name} vient d’être ajouté à KOFFI SHOP.", "/shop")
    
    # Update category product count
    await db.categories.update_one(
        {"id": product.category_id},
        {"$inc": {"products_count": 1}}
    )
    
    return product

@api_router.put("/products/{product_id}", response_model=Product, dependencies=[Depends(require_current_admin)])
async def update_product(product_id: str, product_data: ProductCreate):
    """Update a product (Admin only)."""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    update_data["slug"] = create_slug(product_data.name)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product.get('updated_at'), str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return product

@api_router.delete("/products/{product_id}", dependencies=[Depends(require_current_admin)])
async def delete_product(product_id: str):
    """Delete a product (Admin only)."""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.delete_one({"id": product_id})
    
    # Update category product count
    await db.categories.update_one(
        {"id": product["category_id"]},
        {"$inc": {"products_count": -1}}
    )
    
    return {"message": "Product deleted successfully"}

# ============================================
# REVIEW ROUTES
# ============================================

@api_router.get("/products/{product_id}/reviews", response_model=List[Review])
async def get_product_reviews(product_id: str):
    """Get all reviews for a product."""
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    return reviews

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """Create a new review."""
    # Check if product exists
    product = await db.products.find_one({"id": review_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed this product
    existing_review = await db.reviews.find_one({
        "user_id": current_user["id"],
        "product_id": review_data.product_id
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    account = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    if not account:
        raise HTTPException(status_code=401, detail="Compte introuvable. Veuillez vous reconnecter.")
    trusted_review_data = review_data.model_dump()
    trusted_review_data.update({
        "user_id": account["id"],
        "user_name": account["full_name"],
    })
    review = Review(**trusted_review_data)
    
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.reviews.insert_one(doc)
    
    # Update product rating
    all_reviews = await db.reviews.find({"product_id": review_data.product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.products.update_one(
        {"id": review_data.product_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(all_reviews)}}
    )
    
    return review

# ============================================
# CART ROUTES
# ============================================

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart items with enriched product data."""
    cart_items = await db.cart.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    
    # Enrich cart items with product data
    enriched_items = []
    for item in cart_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        
        # Fetch product details
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            if isinstance(product.get('updated_at'), str):
                product['updated_at'] = datetime.fromisoformat(product['updated_at'])
            item['product'] = product
        
        enriched_items.append(item)
    
    return enriched_items

@api_router.post("/cart")
async def add_to_cart(item_data: CartItemBase, current_user: dict = Depends(get_current_user)):
    """Add item to cart with product enrichment."""
    # Check if product exists
    product = await db.products.find_one({"id": item_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    requested_quantity = item_data.quantity
    if requested_quantity > int(product.get("stock", 0)):
        raise HTTPException(status_code=409, detail="Stock insuffisant pour ce produit")

    # Check if item already in cart
    existing_item = await db.cart.find_one({
        "user_id": current_user["id"],
        "product_id": item_data.product_id,
        "size": item_data.size,
        "color": item_data.color
    })
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + requested_quantity
        if new_quantity > min(99, int(product.get("stock", 0))):
            raise HTTPException(status_code=409, detail="Quantité supérieure au stock disponible")
        await db.cart.update_one(
            {"id": existing_item["id"]},
            {"$set": {"quantity": new_quantity}}
        )
        existing_item["quantity"] = new_quantity
        if isinstance(existing_item.get('created_at'), str):
            existing_item['created_at'] = datetime.fromisoformat(existing_item['created_at'])
        
        # Enrich with product data
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
        existing_item['product'] = {k: v for k, v in product.items() if k != '_id'}
        
        return existing_item
    else:
        # Create new cart item
        cart_item = CartItem(**item_data.model_dump(), user_id=current_user["id"])
        doc = cart_item.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.cart.insert_one(doc)
        
        # Enrich with product data
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
        doc['product'] = {k: v for k, v in product.items() if k != '_id'}
        
        return doc

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int, current_user: dict = Depends(get_current_user)):
    """Update cart item quantity after checking current stock."""
    if quantity < 1 or quantity > 99:
        raise HTTPException(status_code=422, detail="La quantité doit être comprise entre 1 et 99")
    cart_item = await db.cart.find_one({"id": item_id, "user_id": current_user["id"]})
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    product = await db.products.find_one({"id": cart_item["product_id"]})
    if not product or quantity > int(product.get("stock", 0)):
        raise HTTPException(status_code=409, detail="Stock insuffisant pour cette quantité")
    result = await db.cart.update_one(
        {"id": item_id, "user_id": current_user["id"]},
        {"$set": {"quantity": quantity}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Cart updated"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove item from cart."""
    result = await db.cart.delete_one({"id": item_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear user's cart."""
    await db.cart.delete_many({"user_id": current_user["id"]})
    return {"message": "Cart cleared"}


# ============================================
# WISHLIST ROUTES
# ============================================

@api_router.get("/wishlist", response_model=List[WishlistItem])
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    """Get user's wishlist."""
    wishlist = await db.wishlist.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    for item in wishlist:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return wishlist

@api_router.post("/wishlist/{product_id}", response_model=WishlistItem)
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    """Add product to wishlist."""
    # Check if already in wishlist
    existing = await db.wishlist.find_one({
        "user_id": current_user["id"],
        "product_id": product_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Product already in wishlist")
    
    wishlist_item = WishlistItem(user_id=current_user["id"], product_id=product_id)
    doc = wishlist_item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.wishlist.insert_one(doc)
    return wishlist_item

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    """Remove product from wishlist."""
    result = await db.wishlist.delete_one({
        "user_id": current_user["id"],
        "product_id": product_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not in wishlist")
    return {"message": "Product removed from wishlist"}

# ============================================
# ORDER ROUTES
# ============================================

@api_router.post("/orders", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Create an order using authoritative prices, identity and stock from MongoDB."""
    user_doc = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    # Regrouper les lignes identiques pour éviter de contourner le contrôle de stock.
    requested = {}
    for line in order_data.items:
        key = (line.product_id, line.size, line.color)
        requested[key] = requested.get(key, 0) + line.quantity
    if not requested:
        raise HTTPException(status_code=400, detail="Le panier est vide")

    order_items = []
    subtotal_cents = 0
    stock_decrements = []
    try:
        for (product_id, size, color), quantity in requested.items():
            if quantity < 1 or quantity > 99:
                raise HTTPException(status_code=422, detail="Quantité invalide")
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if not product:
                raise HTTPException(status_code=404, detail=f"Produit introuvable: {product_id}")
            price = float(product.get("price", 0))
            if price < 0:
                raise HTTPException(status_code=409, detail="Prix produit invalide")
            price_cents = round(price * 100)
            line_total_cents = price_cents * quantity
            subtotal_cents += line_total_cents

            # Mise à jour atomique : deux clients ne peuvent pas acheter le dernier article.
            reserve = await db.products.update_one(
                {"id": product_id, "stock": {"$gte": quantity}},
                {"$inc": {"stock": -quantity}}
            )
            if reserve.modified_count != 1:
                raise HTTPException(status_code=409, detail=f"Stock insuffisant pour {product.get('name', 'ce produit')}")
            stock_decrements.append((product_id, quantity))
            order_items.append({
                "product_id": product_id,
                "product_name": product.get("name", ""),
                "product_image": (product.get("images") or [""])[0],
                "quantity": quantity,
                "price": price_cents / 100,
                "size": size,
                "color": color,
            })

        subtotal = subtotal_cents / 100
        # Conserver la règle de livraison actuelle, mais calculée côté serveur.
        shipping = 0 if subtotal >= 100 else 10
        total = round(subtotal + shipping, 2)
        order = Order(
            items=order_items,
            subtotal=subtotal,
            shipping=shipping,
            total=total,
            shipping_address=order_data.shipping_address,
            shipping_city=order_data.shipping_city,
            shipping_postal_code=order_data.shipping_postal_code,
            shipping_country=order_data.shipping_country,
            phone=order_data.phone,
            payment_method=order_data.payment_method,
            payment_phone=order_data.payment_phone,
            user_id=current_user["id"],
            user_email=user_doc["email"],
            user_name=user_doc["full_name"],
            status="pending",
            payment_status="pending",
        )
        order.order_number = generate_order_number()
        doc = order.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        doc["stock_reserved"] = True
        await db.orders.insert_one(doc)
        try:
            await notify_all_admins("new_order", "Nouvelle commande reçue", f"Commande #{order.order_number} de {user_doc.get('full_name', 'un client')}", "/admin/orders")
        except Exception:
            logger.exception("Order was created, but administrator notification failed.")
        try:
            await db.cart.delete_many({"user_id": current_user["id"]})
        except Exception:
            logger.exception("Order was created, but the customer's cart could not be cleared.")
        return order
    except Exception:
        # Annuler les réservations si la création de la commande échoue.
        for product_id, quantity in reversed(stock_decrements):
            await db.products.update_one(
                {"id": product_id},
                {"$inc": {"stock": quantity}}
            )
        raise

@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    """Get user's orders."""
    orders = await db.orders.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single order."""
    order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order

# ============================================
# ADMIN ORDER ROUTES
# ============================================

@api_router.get(
    "/admin/orders",
    response_model=List[Order],
    dependencies=[Depends(require_current_admin_or_collaborator)]
)
async def get_all_orders():
    """Liste de consultation des commandes pour l’administrateur et le collaborateur observateur."""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("updated_at"), str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return orders


@api_router.get("/admin/collaborators", dependencies=[Depends(require_current_admin)])
async def get_collaborators():
    """Liste des comptes collaborateurs, réservée à l’administrateur."""
    return await db.users.find(
        {"role": "collaborator"}, {"_id": 0, "password": 0}
    ).sort("created_at", -1).to_list(500)


@api_router.post("/admin/collaborators", dependencies=[Depends(require_current_admin)])
async def create_collaborator(payload: dict):
    """Création d’un compte observateur par l’administrateur."""
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    full_name = str(payload.get("full_name", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    if not email or "@" not in email or len(password) < 8 or not full_name:
        raise HTTPException(status_code=422, detail="Nom, email valide et mot de passe d’au moins 8 caractères requis")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")
    now = datetime.utcnow().isoformat()
    user = {
        "id": str(uuid.uuid4()), "email": email, "full_name": full_name,
        "phone": phone or None, "role": "collaborator", "password": get_password_hash(password),
        "is_active": True, "created_at": now, "updated_at": now
    }
    await db.users.insert_one(user)
    return {"id": user["id"], "email": email, "full_name": full_name, "role": "collaborator", "is_active": True}


@api_router.put("/admin/collaborators/{collaborator_id}/active", dependencies=[Depends(require_current_admin)])
async def set_collaborator_active(collaborator_id: str, payload: dict):
    """Active ou désactive un compte observateur, sans système de mission."""
    active = payload.get("is_active")
    if not isinstance(active, bool):
        raise HTTPException(status_code=422, detail="is_active doit être booléen")
    result = await db.users.update_one(
        {"id": collaborator_id, "role": "collaborator"},
        {"$set": {"is_active": active, "updated_at": datetime.utcnow().isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collaborateur introuvable")
    return {"message": "Accès collaborateur mis à jour"}


@api_router.put("/admin/orders/{order_id}/status", dependencies=[Depends(require_current_admin)])
async def update_order_status(order_id: str, status: str, payment_status: Optional[str] = None):
    """Update order status with validated transitions and one-time stock release."""
    allowed_statuses = {"pending", "processing", "shipped", "delivered", "cancelled"}
    allowed_payment_statuses = {"pending", "paid", "failed"}
    if status not in allowed_statuses:
        raise HTTPException(status_code=422, detail="Statut de commande invalide")
    if payment_status is not None and payment_status not in allowed_payment_statuses:
        raise HTTPException(status_code=422, detail="Statut de paiement invalide")

    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    current_status = order.get("status", "pending")
    transitions = {
        "pending": {"processing", "cancelled"},
        "processing": {"shipped", "cancelled"},
        "shipped": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
    }
    if status != current_status and status not in transitions.get(current_status, set()):
        raise HTTPException(status_code=409, detail=f"Transition impossible: {current_status} -> {status}")
    if payment_status == "paid":
        raise HTTPException(
            status_code=409,
            detail="Le statut payé doit provenir d'une confirmation vérifiée du prestataire de paiement"
        )
    if status in {"processing", "shipped", "delivered"} and order.get("payment_status") != "paid":
        raise HTTPException(status_code=409, detail="La commande doit être payée avant son traitement")
    if order.get("payment_status") == "paid" and status == "cancelled":
        raise HTTPException(status_code=409, detail="Une commande payée nécessite un remboursement avant annulation")

    update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}
    if payment_status is not None:
        update_data["payment_status"] = payment_status

    # Réserver atomiquement le droit de libérer le stock : une seule annulation gagne.
    release_stock = status == "cancelled" and order.get("stock_reserved", False)
    if release_stock:
        update_data["stock_reserved"] = False

    result = await db.orders.update_one(
        {"id": order_id, "status": current_status,
         **({"stock_reserved": {"$ne": False}} if release_stock else {})},
        {"$set": update_data}
    )
    if result.modified_count != 1:
        raise HTTPException(status_code=409, detail="La commande a été modifiée simultanément; rechargez-la")

    if status != current_status:
        await create_user_notification(order["user_id"], "order_update", "Mise à jour de votre commande", f"Votre commande #{order.get('order_number', order_id)} est maintenant : {status}.", "/orders")

    if release_stock:
        for item in order.get("items", []):
            await db.products.update_one(
                {"id": item["product_id"]},
                {"$inc": {"stock": item["quantity"]}}
            )
    return {"message": "Order status updated"}

# ============================================
# ADMIN STATS
# ============================================

@api_router.get("/admin/stats", response_model=StatsResponse, dependencies=[Depends(require_current_admin)])
async def get_admin_stats():
    """Get admin dashboard statistics."""
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({"role": "customer"})
    
    # Calculate total revenue
    all_orders = await db.orders.find({"payment_status": "paid"}).to_list(10000)
    total_revenue = sum(order["total"] for order in all_orders)
    
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Get recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    for order in recent_orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return StatsResponse(
        total_products=total_products,
        total_orders=total_orders,
        total_customers=total_customers,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        recent_orders=recent_orders
    )

# ============================================
# ADMIN USERS
# ============================================

@api_router.get("/admin/users", response_model=List[UserResponse], dependencies=[Depends(require_current_admin)])
async def get_all_users():
    """Get all users (Admin only)."""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

# ============================================
# NEWSLETTER ROUTES
# ============================================

@api_router.post("/newsletter/subscribe", response_model=Newsletter)
async def subscribe_newsletter(email_data: NewsletterSubscribe):
    """Subscribe to newsletter."""
    # Check if already subscribed
    existing = await db.newsletter.find_one({"email": email_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    newsletter = Newsletter(**email_data.model_dump())
    doc = newsletter.model_dump()
    doc["subscribed_at"] = doc["subscribed_at"].isoformat()
    await db.newsletter.insert_one(doc)
    return newsletter

# ============================================
# CONTACT ROUTES
# ============================================

@api_router.post("/contact", response_model=ContactMessage)
async def send_contact_message(message_data: ContactMessageCreate):
    """Send a contact message."""
    contact_message = ContactMessage(**message_data.model_dump())
    doc = contact_message.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.messages.insert_one(doc)
    return contact_message

@api_router.get("/admin/messages", response_model=List[ContactMessage], dependencies=[Depends(require_current_admin)])
async def get_contact_messages():
    """Get all contact messages (Admin only)."""
    messages = await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    return messages

# ============================================
# FILE UPLOAD ROUTES
# ============================================

@api_router.post("/upload", dependencies=[Depends(require_current_admin)])
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (Admin only)."""
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return file URL
    file_url = f"/uploads/{unique_filename}"
    return {"url": file_url}

# ============================================
# ROOT ROUTE
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Welcome to KOFFI SHOP API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)


@app.on_event("startup")
async def startup_user_identity_indexes():
    try:
        await ensure_user_identity_indexes()
        await db.password_reset_tokens.create_index(
            "token_hash", unique=True, name="uniq_password_reset_token_hash"
        )
        await db.password_reset_tokens.create_index(
            "expires_at", expireAfterSeconds=0, name="ttl_password_reset_expiry"
        )
        await db.password_reset_tokens.create_index(
            "user_id", name="password_reset_user_lookup"
        )
    except Exception:
        # Do not prevent the storefront from starting; surface the issue for operator review.
        logger.exception("Could not prepare account identity or password recovery indexes.")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip()],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
