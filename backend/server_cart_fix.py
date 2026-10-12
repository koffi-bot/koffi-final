# CART ROUTES - CORRECTED VERSION
# Replace lines 398-460 in server.py with this code

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
