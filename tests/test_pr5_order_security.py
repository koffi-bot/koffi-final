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

    def test_admin_access_is_checked_against_database(self):
        self.assertIn("require_current_admin", SERVER)
        self.assertIn('user_doc.get("role") != "admin"', SERVER)
        self.assertIn("require_current_admin_or_collaborator", SERVER)

    def test_frontend_uses_order_and_notification_apis(self):
        self.assertIn("createOrder: (data)", API)
        self.assertIn("notificationAPI", API)


if __name__ == "__main__":
    unittest.main()
