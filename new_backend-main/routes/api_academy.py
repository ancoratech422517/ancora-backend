from datetime import datetime
from urllib.parse import urlparse
import uuid

from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy import or_

from models.database import (
    Adicionar_Nova_Aula,
    Agendar_Live_Turma,
    Turma_Aula,
    Usuario,
    db,
)


academy_bp = Blueprint("academy", __name__, url_prefix="/api/academy")


def _authenticated_user():
    try:
        user_id = int(g.principal["sub"])
    except (AttributeError, KeyError, TypeError, ValueError):
        return None
    return db.session.get(Usuario, user_id)


def _class_summary(class_row):
    teacher = db.session.get(Usuario, class_row.id_admin_Turma)
    memberships = Turma_Aula.query.filter(
        Turma_Aula.id_admin_Turma == class_row.id_admin_Turma,
        Turma_Aula.sala_Turma == class_row.sala_Turma,
        Turma_Aula.tipo_usuario_Turma == "aluno",
    ).all()
    members = {}
    for membership in memberships:
        member_id = str(membership.id_aluno_Turma)
        if member_id in members:
            continue
        member = db.session.get(Usuario, member_id) if member_id.isdigit() else None
        members[member_id] = {
            "id": member_id,
            "name": member.nome if member else "Aluno",
        }

    return {
        "id": class_row.id,
        "admin_id": class_row.id_admin_Turma,
        "teacher_name": teacher.nome if teacher else "Professor",
        "name": class_row.nome_Turma or "Turma",
        "room": class_row.sala_Turma or "",
        "image": class_row.imagem_perfil_Turma or "",
        "student_count": len(members),
        "students": list(members.values()),
    }


def _lesson_summary(lesson, class_row):
    return {
        "id": lesson.id,
        "class_id": class_row.id,
        "class_name": class_row.nome_Turma or "Turma",
        "teacher_id": class_row.id_admin_Turma,
        "title": lesson.tema_video or "Aula",
        "video_url": lesson.video or "",
    }


@academy_bp.get("")
def academy_data():
    user = _authenticated_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada"}), 401

    user_id = user.id
    teacher_rows = Turma_Aula.query.filter(
        Turma_Aula.id_admin_Turma == user_id,
        Turma_Aula.tipo_usuario_Turma == "admin",
    ).order_by(Turma_Aula.id.desc()).all()
    student_rows = Turma_Aula.query.filter(
        Turma_Aula.id_aluno_Turma == str(user_id),
        Turma_Aula.tipo_usuario_Turma == "aluno",
    ).order_by(Turma_Aula.id.desc()).all()

    teacher_classes = []
    seen_teacher_classes = set()
    for row in teacher_rows:
        key = (row.id_admin_Turma, row.sala_Turma)
        if key not in seen_teacher_classes:
            teacher_classes.append(_class_summary(row))
            seen_teacher_classes.add(key)

    student_classes = []
    seen_student_classes = set()
    for membership in student_rows:
        class_row = Turma_Aula.query.filter(
            Turma_Aula.id_admin_Turma == membership.id_admin_Turma,
            Turma_Aula.sala_Turma == membership.sala_Turma,
            Turma_Aula.tipo_usuario_Turma == "admin",
        ).first()
        if class_row is None:
            continue
        key = (class_row.id_admin_Turma, class_row.sala_Turma)
        if key not in seen_student_classes:
            student_classes.append(_class_summary(class_row))
            seen_student_classes.add(key)

    accessible_classes = teacher_classes + student_classes
    class_keys = {
        (item["admin_id"], item["name"], item["room"])
        for item in accessible_classes
    }
    schedules = []
    schedule_rows = Agendar_Live_Turma.query.filter(
        or_(
            Agendar_Live_Turma.live_vazia_em.is_(None),
            Agendar_Live_Turma.live_vazia_em > datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10),
        )
    ).order_by(
        Agendar_Live_Turma.data_hora_agenda_live.asc()
    ).all()
    for item in schedule_rows:
        key = (
            int(item.id_aluno_turma_agenda_live)
            if str(item.id_aluno_turma_agenda_live).isdigit()
            else None,
            item.nome_turma_agenda,
            item.sala_turma_agenda,
        )
        if key not in class_keys:
            continue
        starts_at = item.data_hora_agenda_live or ""
        try:
            starts_at_datetime = datetime.fromisoformat(starts_at)
            current_datetime = datetime.now(starts_at_datetime.tzinfo)
            is_upcoming = starts_at_datetime >= current_datetime
        except (TypeError, ValueError):
            is_upcoming = False
        schedules.append({
            "id": item.id,
            "class_name": item.nome_turma_agenda or "Turma",
            "room": item.sala_turma_agenda or "",
            "teacher_id": key[0],
            "starts_at": starts_at,
            "is_upcoming": is_upcoming,
            "title": item.tema_agenda_live or "Aula ao vivo",
            "status": "ativo",
        })

    lessons = []
    lesson_rows = Adicionar_Nova_Aula.query.order_by(
        Adicionar_Nova_Aula.id.desc()
    ).all()
    for lesson in lesson_rows:
        for class_row in accessible_classes:
            if (
                str(lesson.id_admin_Turma) == str(class_row["admin_id"])
                and lesson.nome_Turma == class_row["name"]
            ):
                canonical_class = Turma_Aula.query.filter(
                    Turma_Aula.id_admin_Turma == class_row["admin_id"],
                    Turma_Aula.sala_Turma == class_row["room"],
                    Turma_Aula.tipo_usuario_Turma == "admin",
                ).first()
                if canonical_class is not None:
                    lessons.append(_lesson_summary(lesson, canonical_class))
                break

    return jsonify({
        "profile": {"name": user.nome, "photo": user.foto_usuario or ""},
        "roles": {
            "student": bool(student_classes),
            "teacher": bool(teacher_classes),
        },
        "classes": {
            "student": student_classes,
            "teacher": teacher_classes,
        },
        "schedules": schedules,
        "lessons": lessons,
    })


@academy_bp.post("/classes")
def create_class():
    user = _authenticated_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "O corpo do pedido deve ser um objeto JSON"}), 400
    name = data.get("name")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        return jsonify({"error": "O nome da turma deve ter entre 1 e 120 caracteres"}), 400

    if Turma_Aula.query.filter(
        Turma_Aula.id_admin_Turma == user.id,
        Turma_Aula.tipo_usuario_Turma == "admin",
        Turma_Aula.nome_Turma == name.strip(),
    ).first():
        return jsonify({"error": "Já existe uma turma com este nome"}), 409

    room = f"Academy_{user.id}_{uuid.uuid4().hex}"
    class_row = Turma_Aula(
        id_admin_Turma=user.id,
        nome_Turma=name.strip(),
        tipo_usuario_Turma="admin",
        id_aluno_Turma=str(user.id),
        sala_Turma=room,
        imagem_perfil_Turma="none",
    )
    try:
        db.session.add(class_row)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao criar turma da Academy")
        return jsonify({"error": "Não foi possível criar a turma"}), 500

    return jsonify({"item": _class_summary(class_row)}), 201


@academy_bp.post("/schedules")
def create_schedule():
    user = _authenticated_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "O corpo do pedido deve ser um objeto JSON"}), 400
    try:
        class_id = int(data.get("class_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Turma inválida"}), 400

    class_row = Turma_Aula.query.filter(
        Turma_Aula.id == class_id,
        Turma_Aula.id_admin_Turma == user.id,
        Turma_Aula.tipo_usuario_Turma == "admin",
    ).first()
    if class_row is None:
        return jsonify({"error": "A turma não existe ou não pertence à sua conta"}), 404

    title = data.get("title")
    starts_at = data.get("starts_at")
    if not isinstance(title, str) or not title.strip() or len(title.strip()) > 120:
        return jsonify({"error": "O título deve ter entre 1 e 120 caracteres"}), 400
    if not isinstance(starts_at, str) or len(starts_at) > 80:
        return jsonify({"error": "Data e hora inválidas"}), 400
    try:
        datetime.fromisoformat(starts_at)
    except ValueError:
        return jsonify({"error": "Data e hora inválidas"}), 400

    schedule = Agendar_Live_Turma(
        nome_turma_agenda=class_row.nome_Turma,
        sala_turma_agenda=class_row.sala_Turma,
        data_hora_agenda_live=starts_at,
        id_aluno_turma_agenda_live=str(user.id),
        tema_agenda_live=title.strip(),
            status_agenda_live="ativo",
    )
    try:
        db.session.add(schedule)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao agendar aula da Academy")
        return jsonify({"error": "Não foi possível agendar a aula"}), 500

    return jsonify({
        "item": {
            "id": schedule.id,
            "class_name": schedule.nome_turma_agenda,
            "room": schedule.sala_turma_agenda,
            "teacher_id": user.id,
            "starts_at": schedule.data_hora_agenda_live,
            "title": schedule.tema_agenda_live,
            "status": schedule.status_agenda_live,
        },
    }), 201


@academy_bp.post("/lessons")
def create_lesson():
    user = _authenticated_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "O corpo do pedido deve ser um objeto JSON"}), 400
    try:
        class_id = int(data.get("class_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Turma inválida"}), 400

    class_row = Turma_Aula.query.filter(
        Turma_Aula.id == class_id,
        Turma_Aula.id_admin_Turma == user.id,
        Turma_Aula.tipo_usuario_Turma == "admin",
    ).first()
    if class_row is None:
        return jsonify({"error": "A turma não existe ou não pertence à sua conta"}), 404

    title = data.get("title")
    video_url = data.get("video_url")
    try:
        parsed_url = urlparse(video_url) if isinstance(video_url, str) else None
    except ValueError:
        parsed_url = None
    if not isinstance(title, str) or not title.strip() or len(title.strip()) > 120:
        return jsonify({"error": "O título deve ter entre 1 e 120 caracteres"}), 400
    if (
        parsed_url is None
        or parsed_url.scheme not in {"http", "https"}
        or not parsed_url.netloc
        or len(video_url) > 2048
    ):
        return jsonify({"error": "O endereço do vídeo deve ser uma URL válida"}), 400

    lesson = Adicionar_Nova_Aula(
        nome_Turma=class_row.nome_Turma,
        id_admin_Turma=str(user.id),
        tema_video=title.strip(),
        video=video_url,
    )
    try:
        db.session.add(lesson)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar aula da Academy")
        return jsonify({"error": "Não foi possível registar a aula"}), 500

    return jsonify({"item": _lesson_summary(lesson, class_row)}), 201
