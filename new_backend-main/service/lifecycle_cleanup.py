from datetime import datetime, timedelta, timezone

from flask import current_app
from models.database import (
    Agendar_Live_Turma,
    Adicionar_dados_estado,
    SocialStory,
    SocialStoryView,
    db,
)
from routes.websocket import socketio


LIVE_ROOM_PREFIX = "live_turma:"
_live_agenda_by_sid = {}


def _now_utc_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_agenda(room_name, agenda_id=None):
    query = Agendar_Live_Turma.query.filter_by(sala_turma_agenda=room_name)
    if agenda_id is not None:
        query = query.filter(Agendar_Live_Turma.id == agenda_id)
        return query.first()
    return query.order_by(Agendar_Live_Turma.id.desc()).first()


def registrar_entrada_live(sid, room_name, agenda_id=None):
    if agenda_id is not None:
        try:
            agenda_id = int(agenda_id)
        except (TypeError, ValueError):
            return False

    agenda = _get_agenda(room_name, agenda_id)
    if agenda_id is not None and agenda is None:
        return False
    if agenda is not None and agenda.live_vazia_em is not None:
        try:
            agenda.live_vazia_em = None
            db.session.commit()
        except Exception:
            db.session.rollback()
            current_app.logger.exception("Não foi possível reabrir o agendamento da live")
            return False
    _live_agenda_by_sid[sid] = (room_name, agenda.id if agenda else None)
    return True


def _room_has_other_participants(room_name, excluded_sid=None):
    room = f"{LIVE_ROOM_PREFIX}{room_name}"
    participants = socketio.server.manager.get_participants("/", room)
    return any(sid != excluded_sid for sid, _ in participants)


def _mark_live_empty(room_name, agenda_id=None, excluded_sid=None):
    if _room_has_other_participants(room_name, excluded_sid):
        return False

    agenda = _get_agenda(room_name, agenda_id)
    if agenda is None:
        return False
    if agenda.live_vazia_em is None:
        agenda.live_vazia_em = _now_utc_naive()
        db.session.commit()
    return True


def registrar_saida_live(sid, room_name, was_member=False, agenda_id=None):
    active_live = _live_agenda_by_sid.pop(sid, None)
    if active_live:
        room_name, agenda_id = active_live
    else:
        if not was_member:
            return False
        try:
            agenda_id = int(agenda_id) if agenda_id is not None else None
        except (TypeError, ValueError):
            agenda_id = None
    try:
        return _mark_live_empty(room_name, agenda_id)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Não foi possível marcar a live como vazia")
        return False


def registrar_saida_socket(sid):
    active_live = _live_agenda_by_sid.pop(sid, None)
    if not active_live:
        return
    room_name, agenda_id = active_live
    try:
        _mark_live_empty(room_name, agenda_id, excluded_sid=sid)
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Não foi possível marcar a live vazia após desconexão")


def limpar_dados_expirados():
    agora = _now_utc_naive()
    limite_estado = agora - timedelta(hours=24)
    limite_live = agora - timedelta(minutes=10)

    estados_removidos = db.session.query(Adicionar_dados_estado).filter(
        Adicionar_dados_estado.criado_em.isnot(None),
        Adicionar_dados_estado.criado_em <= limite_estado,
    ).delete(synchronize_session=False)

    stories_expirados = db.session.query(SocialStory.id).filter(
        SocialStory.expira_em <= agora,
    ).subquery()
    db.session.query(SocialStoryView).filter(
        SocialStoryView.story_id.in_(stories_expirados),
    ).delete(synchronize_session=False)
    stories_removidos = db.session.query(SocialStory).filter(
        SocialStory.expira_em <= agora,
    ).delete(synchronize_session=False)

    agendas_removidas = db.session.query(Agendar_Live_Turma).filter(
        Agendar_Live_Turma.live_vazia_em.isnot(None),
        Agendar_Live_Turma.live_vazia_em <= limite_live,
    ).delete(synchronize_session=False)

    db.session.commit()
    return estados_removidos, stories_removidos, agendas_removidas


def _limpeza_periodica(app):
    while True:
        with app.app_context():
            try:
                estados, stories, agendas = limpar_dados_expirados()
                if estados or stories or agendas:
                    app.logger.info(
                        "Limpeza de expiração: %s estados, %s stories e %s agendamentos removidos",
                        estados,
                        stories,
                        agendas,
                    )
            except Exception:
                db.session.rollback()
                app.logger.exception("Falha ao remover estados, stories ou lives expirados")
            finally:
                db.session.remove()
        socketio.sleep(20)


def iniciar_limpeza_periodica(app):
    if app.config.get("TESTING") or app.extensions.get("ancora_lifecycle_cleanup_started"):
        return
    app.extensions["ancora_lifecycle_cleanup_started"] = True
    socketio.start_background_task(_limpeza_periodica, app)
