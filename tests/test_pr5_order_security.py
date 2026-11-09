import ast
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SERVER = (ROOT / "backend" / "server.py").read_text(encoding="utf-8-sig")
MODELS = (ROOT / "backend" / "models.py").read_text(encoding="utf-8-sig")
CHECKOUT = (ROOT / "frontend" / "src" / "pages" / "Checkout.js").read_text(encoding="utf-8")
API = (ROOT / "frontend" / "src" / "services" / "api.js").read_text(encoding="utf-8")
AUTH = (ROOT / "backend" / "auth.py").read_text(encoding="utf-8-sig")


class OrderSecurityContractTests(unittest.TestCase):
    def test_backend_python_syntax(self):
        for path in (ROOT / "backend").glob("*.py"):
            ast.parse(path.read_text(encoding="utf-8-sig"), filename=str(path))

    def test_checkout_sends_only_client_owned_order_fields(self):
        for field in ("product_id", "quantity", "shipping_address", "shipping_city",
                      "shipping_postal_code", "shipping_country", "payment_method"):
            self.assertIn(field, CHECKOUT)
        self.assertIn("items: cart.map", CHECKOUT)
        self.assertNotIn("user_id: user.id", CHECKOUT)
        self.assertNotIn("total: getCartTotal()", CHECKOUT)

    def test_order_model_rejects_client_identity_and_prices(self):
        self.assertIn("class OrderCreate(BaseModel)", MODELS)
        self.assertIn("items: List[CartItemBase]", MODELS)
        self.assertNotIn("user_id: str", MODELS[MODELS.index("class OrderCreate"):MODELS.index("class Order(")])

    def test_server_derives_identity_and_price_and_reserves_stock(self):
        self.assertIn('user_doc = await db.users.find_one({"id": current_user["id"]}', SERVER)
        self.assertIn('price_cents = round(price * 100)', SERVER)
        self.assertIn('"stock": {"$gte": quantity}', SERVER)
        self.assertIn('"$inc": {"stock": -quantity}', SERVER)
        self.assertIn('"user_id": current_user["id"]', SERVER)
        self.assertIn('doc["stock_reserved"] = True', SERVER)

    def test_order_state_and_payment_transitions_are_restricted(self):
        self.assertIn("allowed_statuses", SERVER)
        self.assertIn("allowed_payment_statuses", SERVER)
        self.assertIn("Le statut payé doit provenir", SERVER)
        self.assertIn("La commande doit être payée avant son traitement", SERVER)
        self.assertIn('update_data["stock_reserved"] = False', SERVER)

    def test_cart_stock_limits_and_ownership(self):
        self.assertIn("quantity < 1 or quantity > 99", SERVER)
        self.assertIn('"user_id": current_user["id"]', SERVER)
        self.assertIn("Stock insuffisant pour cette quantité", SERVER)

    def test_legacy_duplicate_emails_do_not_block_startup(self):
        self.assertIn("except DuplicateKeyError:", SERVER)
        self.assertIn("duplicate legacy accounts require manual review", SERVER)

    def test_order_persists_even_if_notifications_fail(self):
        self.assertIn("Order was created, but administrator notification failed.", SERVER)
        self.assertIn("Order was created, but the customer's cart could not be cleared.", SERVER)

    def test_admin_access_is_checked_against_database(self):
        self.assertIn("require_current_admin", SERVER)
        self.assertIn('user_doc.get("role") != "admin"', SERVER)
        self.assertIn("require_current_admin_or_collaborator", SERVER)

    def test_admin_order_deletion_is_restricted_and_restores_reserved_stock(self):
        self.assertIn('@api_router.delete("/admin/orders/{order_id}")', SERVER)
        self.assertIn('current_admin: dict = Depends(require_current_admin)', SERVER)
        self.assertIn('confirm_order_number.strip() != order_number', SERVER)
        self.assertIn('current_status not in {"pending", "confirmed", "cancelled"}', SERVER)
        self.assertIn('order.get("payment_status") == "paid"', SERVER)
        self.assertIn('{"$inc": {"stock": int(item.get("quantity", 0))}}', SERVER)
        self.assertIn('"action": "delete_order"', SERVER)

    def test_admin_dashboard_exposes_confirmed_delete_action(self):
        orders_page = (ROOT / "frontend" / "src" / "pages" / "admin" / "Orders.js").read_text(encoding="utf-8")
        self.assertIn("handleDeleteOrder", orders_page)
        self.assertIn("adminOrderAPI.deleteOrder", orders_page)
        self.assertIn("Supprimer la commande et sa facture", orders_page)
        self.assertIn("deleteOrder: (id, confirmOrderNumber)", API)

    def test_frontend_uses_order_and_notification_apis(self):
        self.assertIn("createOrder: (data)", API)
        self.assertIn("notificationAPI", API)


if __name__ == "__main__":
    unittest.main()
