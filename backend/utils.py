import re
from datetime import datetime
import secrets

def create_slug(text: str) -> str:
    """Create a URL-friendly slug from text."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def generate_order_number() -> str:
    """Generate a unique order number."""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = secrets.token_hex(3).upper()
    return f"KS-{timestamp}-{random_suffix}"

def calculate_discount_price(price: float, discount_percentage: int) -> float:
    """Calculate discounted price."""
    if discount_percentage > 0:
        return price * (1 - discount_percentage / 100)
    return price

def serialize_datetime(obj):
    """Serialize datetime objects to ISO format strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj
