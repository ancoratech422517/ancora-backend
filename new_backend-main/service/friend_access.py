from sqlalchemy import and_, or_

from models.database import Amigo


def users_are_unblocked_friends(user_id: int, friend_id: int) -> bool:
    if user_id == friend_id:
        return False

    relationships = Amigo.query.filter(
        or_(
            and_(Amigo.id_usuario == user_id, Amigo.id_amigo == friend_id),
            and_(Amigo.id_usuario == friend_id, Amigo.id_amigo == user_id),
        )
    ).all()
    if not relationships:
        return False

    blocked_markers = {
        f"bloquear_usuario_{user_id}",
        f"bloquear_usuario_{friend_id}",
    }
    return not any(
        relationship.condicao_estado_Bloqueado1 in blocked_markers
        or relationship.condicao_estado_Bloqueado2 in blocked_markers
        for relationship in relationships
    )


def user_can_view_friend_status(viewer_id: int, target_id: int) -> bool:
    return viewer_id == target_id or users_are_unblocked_friends(viewer_id, target_id)
