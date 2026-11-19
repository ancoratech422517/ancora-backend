import hashlib
import hmac
import json
import tempfile
import unittest
from unittest.mock import Mock, patch

from flask import Flask

from models.database import Usuario, WalletDeposit, WalletLedgerEntry, WalletMovement, db
from routes.api_wallet import wallet_bp
from service.security_tokens import ACCESS_TOKEN_MANAGER_KEY, protect_private_routes
from tests.security_test_utils import configure_test_security


class WalletApiTests(unittest.TestCase):
    def setUp(self):
        self.audit_directory = tempfile.TemporaryDirectory()
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="wallet-test-secret-with-at-least-32-bytes",
            TESTING=True,
            BITPAY_SK="sk_test_test-key",
            BITPAY_WHSEC="whsec_test-gpay-webhook-secret",
            BITPAY_API_BASE_URL="https://api-sandbox.bitpay.ao/v1",
        )
        configure_test_security(
            self.app,
            f"{self.audit_directory.name}/audit.jsonl",
        )
        db.init_app(self.app)
        self.app.register_blueprint(wallet_bp)
        protect_private_routes(self.app)
        with self.app.app_context():
            db.create_all()
            db.session.add(Usuario(
                nome="Pessoa Um",
                telefone="+244923000000",
                senha_hash="hash",
                email="um@example.test",
                data_nascimento="1990-01-01",
                codigo_convite="TEST0001",
            ))
            db.session.add(Usuario(
                nome="Pessoa Dois",
                telefone="+244923000001",
                senha_hash="hash",
                email="dois@example.test",
                data_nascimento="1990-01-01",
                codigo_convite="TEST0002",
            ))
            db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.audit_directory.cleanup()

    def authenticate(self, user_id=1):
        token = self.app.extensions[ACCESS_TOKEN_MANAGER_KEY].issue(
            str(user_id),
            roles=("user",),
            claims={"token_type": "access"},
        )
        self.client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    def _create_pending_deposit(self):
        def create_payment(url, **kwargs):
            self.assertEqual(url, "https://api-sandbox.bitpay.ao/v1/payment_intents")
            payload = kwargs["json"]
            provider_response = {
                "id": "pay_bitpay-1",
                "merchant_reference": payload["merchant_reference"],
                "amount": payload["amount"],
                "currency": payload["currency"],
                "status": "PENDING",
            }
            response = Mock(ok=True, status_code=200)
            response.json.return_value = provider_response
            return response

        with patch("routes.api_wallet.requests.post", side_effect=create_payment) as gateway:
            response = self.client.post(
                "/api/wallet/deposits",
                json={"amount": "15000.00", "payment_method": "multicaixa_express"},
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            gateway.call_args.kwargs["headers"]["Authorization"],
            "Bearer sk_test_test-key",
        )
        merchant_reference = gateway.call_args.kwargs["json"]["merchant_reference"]
        self.assertTrue(merchant_reference.startswith("ANCORA-DEP-"))
        return response.get_json()

    def _post_signed_webhook(self, event, signature=None):
        raw_body = json.dumps(event, separators=(",", ":")).encode("utf-8")
        timestamp = str(int(__import__("time").time()))
        if signature is None:
            signature = hmac.new(
                b"whsec_test-gpay-webhook-secret",
                f"{timestamp}.".encode("utf-8") + raw_body,
                hashlib.sha256,
            ).hexdigest()
        return self.app.test_client().post(
            "/webhooks/bitpay",
            data=raw_body,
            content_type="application/json",
            headers={"BitPay-Signature": f"t={timestamp},v1={signature}"},
        )

    def test_wallet_starts_at_zero_and_withdrawals_are_available(self):
        self.authenticate()

        summary = self.client.get("/api/wallet")
        withdrawal = self.client.post(
            "/api/wallet/withdrawals",
            json={"amount": 100, "account_phone": "923000000"},
        )

        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.get_json()["balance"], "0.00")
        self.assertEqual(summary.get_json()["transactions"], [])
        self.assertTrue(summary.get_json()["withdrawals_enabled"])
        self.assertEqual(withdrawal.status_code, 409)

    def test_deposit_is_credited_only_by_valid_matching_webhook_and_is_idempotent(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        event = {
            "type": "payment.succeeded",
            "data": {
                "id": deposit["transaction_id"],
                "merchant_reference": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "SUCCEEDED",
            },
        }
        mismatch = self._post_signed_webhook({
            **event,
            "data": {**event["data"], "amount": 15001},
        })
        self.assertEqual(mismatch.status_code, 409)
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "0.00")

        accepted = self._post_signed_webhook(event)
        duplicate = self._post_signed_webhook(event)
        summary = self.client.get("/api/wallet").get_json()

        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.get_json(), {"received": True})
        self.assertEqual(duplicate.status_code, 200)
        self.assertTrue(duplicate.get_json()["duplicate"])
        self.assertEqual(summary["balance"], "15000.00")
        self.assertEqual(summary["total_incoming"], "15000.00")
        self.assertEqual(len(summary["transactions"]), 1)
        with self.app.app_context():
            self.assertEqual(WalletDeposit.query.count(), 1)
            self.assertEqual(WalletLedgerEntry.query.count(), 1)
        self.authenticate(user_id=2)
        other_wallet = self.client.get("/api/wallet").get_json()
        self.assertEqual(other_wallet["balance"], "0.00")
        self.assertEqual(other_wallet["transactions"], [])

    def test_invalid_signature_and_unknown_reference_do_not_credit(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        event = {
            "type": "payment.succeeded",
            "data": {
                "id": deposit["transaction_id"],
                "merchant_reference": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "SUCCEEDED",
            },
        }

        invalid_signature = self._post_signed_webhook(event, signature="invalid")
        unknown_reference = self._post_signed_webhook(
            {**event, "data": {**event["data"], "merchant_reference": "ANCORA-DEP-UNKNOWN"}}
        )

        self.assertEqual(invalid_signature.status_code, 403)
        self.assertEqual(unknown_reference.status_code, 200)
        self.assertTrue(unknown_reference.get_json()["ignored"])
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "0.00")

    def test_transfer_uses_multicaixa_phone_and_updates_both_balances(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        event = {
            "type": "payment.succeeded",
            "data": {
                "id": deposit["transaction_id"],
                "merchant_reference": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "SUCCEEDED",
            },
        }
        accepted = self._post_signed_webhook(event)
        self.assertEqual(accepted.status_code, 200)

        transfer = self.client.post(
            "/api/wallet/transfers",
            json={"amount": "5000", "account_phone": "923000001"},
        )
        self.assertEqual(transfer.status_code, 201)
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "10000.00")

        self.authenticate(user_id=2)
        recipient_wallet = self.client.get("/api/wallet").get_json()
        self.assertEqual(recipient_wallet["balance"], "5000.00")
        with self.app.app_context():
            self.assertEqual(WalletMovement.query.count(), 1)

    def test_deposit_rejects_invalid_amount_before_calling_gateway(self):
        self.authenticate()
        with patch("routes.api_wallet.requests.post") as gateway:
            response = self.client.post(
                "/api/wallet/deposits",
                json={"amount": -50, "payment_method": "multicaixa_express"},
            )
        self.assertEqual(response.status_code, 400)
        gateway.assert_not_called()


if __name__ == "__main__":
    unittest.main()
