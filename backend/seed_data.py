"""
Script to seed initial data for KOFFI SHOP
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import get_password_hash
from datetime import datetime
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'koffi_shop')]

async def seed_data():
    """Seed initial data"""
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@koffishop.com"})
    if not admin_exists:
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@koffishop.com",
            "password": get_password_hash("admin123"),
            "full_name": "Admin KOFFI",
            "role": "admin",
            "phone": "+243 999 999 999",
            "address": "123 Admin Street",
            "city": "Kinshasa",
            "postal_code": "12345",
            "country": "RDC",
            "avatar": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await db.users.insert_one(admin)
        print("✅ Admin user created: admin@koffishop.com / admin123")
    
    # Create categories
    categories_data = [
        {
            "id": "cat-1",
            "name": "Vêtements",
            "slug": "vetements",
            "description": "Découvrez notre collection de vêtements tendance",
            "icon": "👕",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "cat-2",
            "name": "Chaussures",
            "slug": "chaussures",
            "description": "Des chaussures pour tous les styles",
            "icon": "👟",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "cat-3",
            "name": "Montres",
            "slug": "montres",
            "description": "Montres élégantes et modernes",
            "icon": "⌚",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "cat-4",
            "name": "Sacs",
            "slug": "sacs",
            "description": "Sacs à main et sacs à dos de qualité",
            "icon": "👜",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "cat-5",
            "name": "Casquettes",
            "slug": "casquettes",
            "description": "Casquettes et chapeaux stylés",
            "icon": "🧢",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "cat-6",
            "name": "Accessoires",
            "slug": "accessoires",
            "description": "Accessoires de mode variés",
            "icon": "💍",
            "products_count": 0,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    for category in categories_data:
        exists = await db.categories.find_one({"id": category["id"]})
        if not exists:
            await db.categories.insert_one(category)
            print(f"✅ Category created: {category['name']}")
    
    # Create sample products
    products_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "T-Shirt Premium Noir",
            "slug": "t-shirt-premium-noir",
            "description": "T-shirt en coton premium avec finition soignée. Parfait pour un look décontracté et élégant.",
            "price": 35.00,
            "compare_price": 50.00,
            "category_id": "cat-1",
            "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Noir", "Blanc", "Gris"],
            "stock": 50,
            "is_featured": True,
            "is_new": True,
            "discount_percentage": 30,
            "rating": 4.5,
            "reviews_count": 12,
            "sold_count": 45,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sneakers Sport Blanc",
            "slug": "sneakers-sport-blanc",
            "description": "Sneakers confortables et stylées, parfaites pour le sport et la vie quotidienne.",
            "price": 85.00,
            "compare_price": 120.00,
            "category_id": "cat-2",
            "images": ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800"],
            "sizes": ["38", "39", "40", "41", "42", "43", "44"],
            "colors": ["Blanc", "Noir", "Bleu"],
            "stock": 30,
            "is_featured": True,
            "is_new": True,
            "discount_percentage": 29,
            "rating": 4.8,
            "reviews_count": 28,
            "sold_count": 67,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Montre Élégante Or",
            "slug": "montre-elegante-or",
            "description": "Montre de luxe avec bracelet en acier doré. Élégance et précision.",
            "price": 150.00,
            "compare_price": 250.00,
            "category_id": "cat-3",
            "images": ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800"],
            "sizes": [],
            "colors": ["Or", "Argent", "Noir"],
            "stock": 20,
            "is_featured": True,
            "is_new": False,
            "discount_percentage": 40,
            "rating": 4.9,
            "reviews_count": 35,
            "sold_count": 89,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sac à Dos Moderne",
            "slug": "sac-a-dos-moderne",
            "description": "Sac à dos spacieux et pratique avec compartiment ordinateur. Idéal pour le travail et les voyages.",
            "price": 65.00,
            "compare_price": 90.00,
            "category_id": "cat-4",
            "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
            "sizes": [],
            "colors": ["Noir", "Gris", "Marron"],
            "stock": 40,
            "is_featured": True,
            "is_new": True,
            "discount_percentage": 28,
            "rating": 4.6,
            "reviews_count": 18,
            "sold_count": 52,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Casquette Street Style",
            "slug": "casquette-street-style",
            "description": "Casquette snapback au style urbain. Parfaite pour compléter votre look streetwear.",
            "price": 25.00,
            "compare_price": 35.00,
            "category_id": "cat-5",
            "images": ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800"],
            "sizes": ["Unique"],
            "colors": ["Noir", "Blanc", "Rouge", "Vert"],
            "stock": 60,
            "is_featured": False,
            "is_new": True,
            "discount_percentage": 29,
            "rating": 4.3,
            "reviews_count": 9,
            "sold_count": 34,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lunettes de Soleil Premium",
            "slug": "lunettes-soleil-premium",
            "description": "Lunettes de soleil UV400 avec monture moderne. Protection et style garantis.",
            "price": 45.00,
            "compare_price": 75.00,
            "category_id": "cat-6",
            "images": ["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"],
            "sizes": [],
            "colors": ["Noir", "Marron", "Bleu"],
            "stock": 35,
            "is_featured": True,
            "is_new": False,
            "discount_percentage": 40,
            "rating": 4.7,
            "reviews_count": 22,
            "sold_count": 78,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    for product in products_data:
        exists = await db.products.find_one({"slug": product["slug"]})
        if not exists:
            await db.products.insert_one(product)
            # Update category count
            await db.categories.update_one(
                {"id": product["category_id"]},
                {"$inc": {"products_count": 1}}
            )
            print(f"✅ Product created: {product['name']}")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📝 Admin credentials:")
    print("   Email: admin@koffishop.com")
    print("   Password: admin123")

if __name__ == "__main__":
    asyncio.run(seed_data())
    client.close()
