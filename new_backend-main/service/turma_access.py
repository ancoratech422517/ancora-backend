from sqlalchemy import or_

from models.database import Turma_Aula


def user_is_turma_member(user_id: int, admin_id: int, turma_name: str) -> bool:
    return Turma_Aula.query.filter(
        Turma_Aula.id_admin_Turma == admin_id,
        Turma_Aula.nome_Turma == turma_name,
        or_(
            Turma_Aula.id_admin_Turma == user_id,
            Turma_Aula.id_aluno_Turma == str(user_id),
        ),
    ).first() is not None


def user_is_turma_admin(user_id: int, admin_id: int, turma_name: str) -> bool:
    if user_id != admin_id:
        return False
    return Turma_Aula.query.filter_by(
        id_admin_Turma=admin_id,
        id_aluno_Turma=str(user_id),
        nome_Turma=turma_name,
        tipo_usuario_Turma="admin",
    ).first() is not None
