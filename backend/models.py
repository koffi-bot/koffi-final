from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "customer"  # customer or admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime

# Product Models
class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category_id: str
    images: List[str] = []
    sizes: List[str] = []
    colors: List[str] = []
    stock: int = 0
    is_featured: bool = False
    is_new: bool = False
    discount_percentage: Optional[int] = 0

class ProductCreate(ProductBase):
    # Validations appliquées uniquement à la création/modification
    # (le modèle Product utilisé pour les réponses reste permissif).
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    discount_percentage: Optional[int] = Field(default=0, ge=0, le=100)

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str = ""
    rating: float = 0.0
    reviews_count: int = 0
    sold_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Category Models
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str = ""
    products_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Review Models
class ReviewBase(BaseModel):
    product_id: str
    rating: int  # 1-5
    comment: str
    user_name: str

class ReviewCreate(ReviewBase):
    user_id: str

class Review(ReviewBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Cart Models
class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None

class CartItem(CartItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Wishlist Models
class WishlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Order Models
class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    quantity: int
    price: float
    size: Optional[str] = None
    color: Optional[str] = None

class OrderBase(BaseModel):
    items: List[OrderItemBase]
    subtotal: float
    shipping: float
    total: float
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str
    phone: str
    payment_method: str  # orange_money, mpesa, airtel_money, card
    payment_phone: Optional[str] = None

class OrderCreate(OrderBase):
    user_id: str
    user_email: str
    user_name: str

class Order(OrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = ""
    user_id: str
    user_email: str
    user_name: str
    status: str = "pending"  # pending, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Newsletter Models
class NewsletterSubscribe(BaseModel):
    email: EmailStr

class Newsletter(NewsletterSubscribe):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subscribed_at: datetime = Field(default_factory=datetime.utcnow)

# Contact Message Models
class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactMessage(ContactMessageCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "unread"  # unread, read, replied
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Response Models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MessageResponse(BaseModel):
    message: str

class StatsResponse(BaseModel):
    total_products: int
    total_orders: int
    total_customers: int
    total_revenue: float
    pending_orders: int
    recent_orders: List[Order] = []
