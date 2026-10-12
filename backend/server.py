from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import shutil
import uuid

# Import local modules
from models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse,
    Product, ProductCreate, Category, CategoryCreate,
    Review, ReviewCreate, CartItem, CartItemBase,
    WishlistItem, Order, OrderCreate,
    Newsletter, NewsletterSubscribe,
    ContactMessage, ContactMessageCreate,
    MessageResponse, StatsResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin
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

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@api_router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password"})
    user = User(**user_dict)
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Prepare document
    doc = user.model_dump()
    doc["password"] = hashed_password
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    # Insert into database
    await db.users.insert_one(doc)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user."""
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
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
        data={"sub": user.id, "email": user.email, "role": user.role}
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
    if phone: update_data["phone"] = phone
    if address: update_data["address"] = address
    if city: update_data["city"] = city
    if postal_code: update_data["postal_code"] = postal_code
    if country: update_data["country"] = country
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
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

@api_router.post("/categories", response_model=Category, dependencies=[Depends(get_current_admin)])
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

@api_router.post("/products", response_model=Product, dependencies=[Depends(get_current_admin)])
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
    
    # Update category product count
    await db.categories.update_one(
        {"id": product.category_id},
        {"$inc": {"products_count": 1}}
    )
    
    return product

@api_router.put("/products/{product_id}", response_model=Product, dependencies=[Depends(get_current_admin)])
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

@api_router.delete("/products/{product_id}", dependencies=[Depends(get_current_admin)])
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
    
    review = Review(**review_data.model_dump())
    
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
    
    # Check if item already in cart
    existing_item = await db.cart.find_one({
        "user_id": current_user["id"],
        "product_id": item_data.product_id,
        "size": item_data.size,
        "color": item_data.color
    })
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + item_data.quantity
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
    """Update cart item quantity."""
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

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Create a new order."""
    order = Order(**order_data.model_dump())
    order.order_number = generate_order_number()
    
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Update product sold_count
    for item in order.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"sold_count": item.quantity}}
        )
    
    # Clear user's cart
    await db.cart.delete_many({"user_id": current_user["id"]})
    
    return order

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

@api_router.get("/admin/orders", response_model=List[Order], dependencies=[Depends(get_current_admin)])
async def get_all_orders():
    """Get all orders (Admin only)."""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.put("/admin/orders/{order_id}/status", dependencies=[Depends(get_current_admin)])
async def update_order_status(order_id: str, status: str, payment_status: Optional[str] = None):
    """Update order status (Admin only)."""
    update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}
    if payment_status:
        update_data["payment_status"] = payment_status
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ============================================
# ADMIN STATS
# ============================================

@api_router.get("/admin/stats", response_model=StatsResponse, dependencies=[Depends(get_current_admin)])
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

@api_router.get("/admin/users", response_model=List[UserResponse], dependencies=[Depends(get_current_admin)])
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

@api_router.get("/admin/messages", response_model=List[ContactMessage], dependencies=[Depends(get_current_admin)])
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

@api_router.post("/upload", dependencies=[Depends(get_current_admin)])
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
