from ancorashield import PasswordHasher
from ancorashield.exceptions import PasswordHashError
from werkzeug.security import check_password_hash

from models.database import db


_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password_and_upgrade(user, password: str) -> bool:
    stored_hash = user.senha_hash
    if not isinstance(password, str) or not isinstance(stored_hash, str):
        return False

    if stored_hash.startswith("$argon2id$"):
        try:
            is_valid = _password_hasher.verify(password, stored_hash)
        except PasswordHashError:
            return False
        if is_valid and _password_hasher.needs_rehash(stored_hash):
            user.senha_hash = hash_password(password)
            db.session.commit()
        return is_valid

    if not check_password_hash(stored_hash, password):
        return False

    user.senha_hash = hash_password(password)
    db.session.commit()
    return True
