import ast
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SERVER = (ROOT / "backend" / "server.py").read_text(encoding="utf-8-sig")
MODELS = (ROOT / "backend" / "models.py").read_text(encoding="utf-8-sig")
AUTH = (ROOT / "backend" / "auth.py").read_text(encoding="utf-8-sig")
APP = (ROOT / "frontend" / "src" / "App.js").read_text(encoding="utf-8")
API = (ROOT / "frontend" / "src" / "services" / "api.js").read_text(encoding="utf-8")
LOGIN = (ROOT / "frontend" / "src" / "pages" / "Login.js").read_text(encoding="utf-8")
FORGOT = (ROOT / "frontend" / "src" / "pages" / "ForgotPassword.js").read_text(encoding="utf-8")
RESET = (ROOT / "frontend" / "src" / "pages" / "ResetPassword.js").read_text(encoding="utf-8")


class SecurityContractTests(unittest.TestCase):
    def test_python_files_parse(self):
        for path in (ROOT / "backend").glob("*.py"):
            ast.parse(path.read_text(encoding="utf-8-sig"), filename=str(path))

    def test_password_recovery_backend_contract(self):
        self.assertIn('@api_router.post("/auth/forgot-password")', SERVER)
        self.assertIn('@api_router.post("/auth/reset-password")', SERVER)
        self.assertIn("secrets.token_urlsafe(32)", SERVER)
        self.assertIn("hashlib.sha256", SERVER)
        self.assertIn("PASSWORD_RESET_TTL_MINUTES = 30", SERVER)
        self.assertIn("find_one_and_delete", SERVER)
        self.assertIn("SMTP_HOST", SERVER)
        self.assertIn('expires_at', SERVER)

    def test_password_recovery_validation(self):
        self.assertIn("token: str = Field(min_length=32, max_length=256)", MODELS)
        self.assertIn("new_password: str = Field(min_length=8, max_length=72)", MODELS)
        self.assertIn("len(value.encode(\"utf-8\")) > 72", MODELS)

    def test_password_recovery_frontend_wiring(self):
        self.assertIn('path="/forgot-password"', APP)
        self.assertIn('path="/reset-password"', APP)
        self.assertIn("forgotPassword:", API)
        self.assertIn("resetPassword:", API)
        self.assertIn("Mot de passe oublié ?", LOGIN)
        self.assertIn("Vérifiez votre boîte e-mail", FORGOT)
        self.assertIn("Modifier mon mot de passe", RESET)

    def test_email_identity_and_legacy_compatibility(self):
        self.assertIn("normalize_email", SERVER)
        self.assertIn("find_user_by_email", SERVER)
        self.assertIn('"$options": "i"', SERVER)
        self.assertIn("uniq_users_normalized_email", SERVER)
        self.assertNotIn("uniq_users_normalized_phone", SERVER)

    def test_order_and_review_identity_from_session(self):
        self.assertIn('"user_id": account["id"]', SERVER)
        self.assertIn('"user_email": account["email"]', SERVER)
        self.assertIn('"user_name": account["full_name"]', SERVER)

    def test_no_demo_admin_password_seed(self):
        seed = (ROOT / "backend" / "seed_data.py").read_text(encoding="utf-8-sig")
        self.assertNotIn('admin@koffishop.com', seed)
        self.assertNotIn('admin123', seed)


if __name__ == "__main__":
    unittest.main()
