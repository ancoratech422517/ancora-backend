from datetime import datetime, timezone

from ancorashield.exceptions import AuthenticationError

from models.database import RefreshSession, db
from service.security_tokens import issue_refresh_token, refresh_token_manager


def _session_from_token(token: str, user_id: int) -> RefreshSession:
    claims = refresh_token_manager().verify(token)
    roles = claims.get("roles")
    if (
        claims.get("token_type") != "refresh"
        or not isinstance(roles, (list, tuple, set, frozenset))
        or "refresh" not in roles
        or claims.get("sub") != str(user_id)
        or not isinstance(claims.get("jti"), str)
        or not claims.get("jti")
    ):
        raise AuthenticationError("Refresh token inválido.")
    try:
        expires_at = datetime.fromtimestamp(int(claims["exp"]), timezone.utc).replace(tzinfo=None)
    except (KeyError, TypeError, ValueError, OverflowError):
        raise AuthenticationError("Refresh token inválido.") from None
    return RefreshSession(
        jti=claims["jti"],
        user_id=user_id,
        expires_at=expires_at,
    )


def issue_and_store_refresh_token(user_id: int) -> str:
    token = issue_refresh_token(user_id)
    db.session.add(_session_from_token(token, user_id))
    db.session.query(RefreshSession).filter(
        RefreshSession.expires_at <= datetime.now(timezone.utc).replace(tzinfo=None)
    ).delete(synchronize_session=False)
    db.session.commit()
    return token


def rotate_refresh_token(token: str, user_id: int) -> str | None:
    try:
        old_session = _session_from_token(token, user_id)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        updated = db.session.query(RefreshSession).filter(
            RefreshSession.jti == old_session.jti,
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
            RefreshSession.expires_at > now,
        ).update(
            {RefreshSession.revoked_at: now},
            synchronize_session=False,
        )
        if updated != 1:
            db.session.rollback()
            return None

        new_token = issue_refresh_token(user_id)
        db.session.add(_session_from_token(new_token, user_id))
        db.session.query(RefreshSession).filter(
            RefreshSession.expires_at <= now
        ).delete(synchronize_session=False)
        db.session.commit()
        return new_token
    except AuthenticationError:
        db.session.rollback()
        return None
    except Exception:
        db.session.rollback()
        raise


def revoke_refresh_token(token: str, user_id: int) -> bool:
    try:
        old_session = _session_from_token(token, user_id)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        updated = db.session.query(RefreshSession).filter(
            RefreshSession.jti == old_session.jti,
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        ).update(
            {RefreshSession.revoked_at: now},
            synchronize_session=False,
        )
        db.session.commit()
        return updated == 1
    except AuthenticationError:
        db.session.rollback()
        return False
    except Exception:
        db.session.rollback()
        raise
