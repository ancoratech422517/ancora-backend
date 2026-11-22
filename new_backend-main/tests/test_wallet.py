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
            DIZANPAY_API_KEY="pk_live_test-key",
            DIZANPAY_WEBHOOK_SECRET="whsec_test-dizanpay-webhook-secret",
            DIZANPAY_WEBHOOK_URL="https://ancora.example/webhooks/dizanpay",
            FRONTEND_URL="https://ancora.example",
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
            self.assertEqual(url, "https://dizanpay.com/api/v1/payments")
            payload = kwargs["json"]
            provider_response = {
                "id": "API-DIZANPAY-1",
                "transaction_id": "API-DIZANPAY-1",
                "external_id": payload["external_id"],
                "amount": payload["amount"],
                "currency": payload["currency"],
                "status": "pending",
                "redirect_url": "https://pay.wiza.ao/?id=test&nonce=test",
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
            "Bearer pk_live_test-key",
        )
        provider_payload = gateway.call_args.kwargs["json"]
        self.assertTrue(provider_payload["external_id"].startswith("ANCORA-DEP-"))
        self.assertEqual(provider_payload["method"], "GPO")
        self.assertEqual(
            provider_payload["webhook_url"],
            "https://ancora.example/webhooks/dizanpay",
        )
        return response.get_json()

    def _post_signed_webhook(self, event, signature=None):
        raw_body = json.dumps(event, separators=(",", ":")).encode("utf-8")
        if signature is None:
            signature = hmac.new(
                b"whsec_test-dizanpay-webhook-secret",
                raw_body,
                hashlib.sha256,
            ).hexdigest()
        return self.app.test_client().post(
            "/webhooks/dizanpay",
            data=raw_body,
            content_type="application/json",
            headers={"X-Dizanpay-Signature": signature},
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

    def test_withdrawal_reserves_balance_until_admin_confirms_or_rejects(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        self._post_signed_webhook({
            "event": "payment.paid",
            "data": {
                "id": deposit["transaction_id"],
                "external_id": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "paid",
            },
        })

        pending = self.client.post(
            "/api/wallet/withdrawals",
            json={"amount": 5000, "account_phone": "923000000"},
        )
        self.assertEqual(pending.status_code, 201)
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "10000.00")

        forbidden = self.client.get("/api/admin/wallet/withdrawals")
        self.assertEqual(forbidden.status_code, 403)

        self.app.config["WALLET_ADMIN_USER_IDS"] = {1}
        self.authenticate(user_id=2)
        other_user_forbidden = self.client.get("/api/admin/wallet/withdrawals")
        self.assertEqual(other_user_forbidden.status_code, 403)

        self.authenticate(user_id=1)
        admin_queue = self.client.get("/api/admin/wallet/withdrawals")
        self.assertEqual(admin_queue.status_code, 200)
        self.assertEqual(len(admin_queue.get_json()["withdrawals"]), 1)

        completed = self.client.post(
            f"/api/admin/wallet/withdrawals/{pending.get_json()['reference_id']}/process",
            json={"action": "complete", "payout_reference": "MCX-RECIBO-01"},
        )
        self.assertEqual(completed.status_code, 200)
        duplicate_completion = self.client.post(
            f"/api/admin/wallet/withdrawals/{pending.get_json()['reference_id']}/process",
            json={"action": "complete", "payout_reference": "MCX-RECIBO-01"},
        )
        self.assertEqual(duplicate_completion.status_code, 409)
        summary = self.client.get("/api/wallet").get_json()
        self.assertEqual(summary["balance"], "10000.00")
        self.assertEqual(summary["total_outgoing"], "5000.00")
        completed_transaction = next(
            transaction
            for transaction in summary["transactions"]
            if transaction["reference_id"] == pending.get_json()["reference_id"]
        )
        self.assertEqual(completed_transaction["payout_reference"], "MCX-RECIBO-01")

        rejected = self.client.post(
            "/api/wallet/withdrawals",
            json={"amount": 3000, "account_phone": "923000000"},
        )
        self.assertEqual(rejected.status_code, 201)
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "7000.00")
        rejected_by_admin = self.client.post(
            f"/api/admin/wallet/withdrawals/{rejected.get_json()['reference_id']}/process",
            json={"action": "reject", "reason": "Número de conta não confirmado."},
        )
        self.assertEqual(rejected_by_admin.status_code, 200)
        summary = self.client.get("/api/wallet").get_json()
        self.assertEqual(summary["balance"], "10000.00")
        rejected_transaction = next(
            transaction
            for transaction in summary["transactions"]
            if transaction["reference_id"] == rejected.get_json()["reference_id"]
        )
        self.assertEqual(rejected_transaction["status_message"], "Número de conta não confirmado.")

    def test_admin_cannot_complete_withdrawal_without_payout_reference(self):
        self.authenticate()
        self.app.config["WALLET_ADMIN_USER_IDS"] = {1}
        pending = self.client.post(
            "/api/wallet/withdrawals",
            json={"amount": 100, "account_phone": "923000000"},
        )
        self.assertEqual(pending.status_code, 409)

        self._create_pending_deposit()
        with self.app.app_context():
            deposit = WalletDeposit.query.one()
            db.session.add(WalletLedgerEntry(
                user_id=1,
                deposit_id=deposit.id,
                entry_type="DEPOSIT",
                amount=100,
                currency="AOA",
            ))
            db.session.commit()
        pending = self.client.post(
            "/api/wallet/withdrawals",
            json={"amount": 100, "account_phone": "923000000"},
        )
        self.assertEqual(pending.status_code, 201)
        response = self.client.post(
            f"/api/admin/wallet/withdrawals/{pending.get_json()['reference_id']}/process",
            json={"action": "complete", "payout_reference": ""},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "0.00")

    def test_deposit_is_credited_only_by_valid_matching_webhook_and_is_idempotent(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        event = {
            "event": "payment.paid",
            "data": {
                "id": deposit["transaction_id"],
                "external_id": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "paid",
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
            "event": "payment.paid",
            "data": {
                "id": deposit["transaction_id"],
                "external_id": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "paid",
            },
        }

        invalid_signature = self._post_signed_webhook(event, signature="invalid")
        unknown_reference = self._post_signed_webhook(
            {**event, "data": {**event["data"], "external_id": "ANCORA-DEP-UNKNOWN"}}
        )

        self.assertEqual(invalid_signature.status_code, 403)
        self.assertEqual(unknown_reference.status_code, 200)
        self.assertTrue(unknown_reference.get_json()["ignored"])
        self.assertEqual(self.client.get("/api/wallet").get_json()["balance"], "0.00")

    def test_transfer_uses_multicaixa_phone_and_updates_both_balances(self):
        self.authenticate()
        deposit = self._create_pending_deposit()
        event = {
            "event": "payment.paid",
            "data": {
                "id": deposit["transaction_id"],
                "external_id": deposit["reference_id"],
                "amount": 15000,
                "currency": "AOA",
                "status": "paid",
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
