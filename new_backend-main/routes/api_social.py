from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import jwt
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func, or_

from models.database import (
    SocialBookmark,
    SocialComment,
    SocialFollow,
    SocialLike,
    SocialPost,
    SocialStory,
    SocialStoryView,
    Usuario,
    db,
)
from service.media_metadata import validate_blurhash


social_bp = Blueprint("social", __name__, url_prefix="/api/social")


def _utcnow_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _current_user_id():
    token = request.cookies.get("token_sessao")
    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"],
        )
        if payload.get("type") != "access":
            return None
        user_id = int(payload.get("id"))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        return None

    return user_id if db.session.get(Usuario, user_id) else None


def _auth_error():
    return jsonify({"error": "Sessão inválida ou expirada"}), 401


def _user_payload(user):
    return {
        "id": user.id,
        "nome": user.nome,
        "foto_usuario": user.foto_usuario,
        "foto_usuario_blurhash": user.foto_usuario_blurhash,
        "provincia": user.provincia,
        "pais": user.pais,
    }


def _valid_media_url(value):
    if value is None or value == "":
        return None
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError("O endereço da mídia é inválido")
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("A mídia deve usar um endereço HTTPS válido")
    return value


def _post_payloads(posts, viewer_id):
    if not posts:
        return []

    post_ids = [post.id for post in posts]
    user_ids = {post.user_id for post in posts}
    users = {
        user.id: user
        for user in Usuario.query.filter(Usuario.id.in_(user_ids)).all()
    }
    likes = dict(
        db.session.query(SocialLike.post_id, func.count(SocialLike.id))
        .filter(SocialLike.post_id.in_(post_ids))
        .group_by(SocialLike.post_id)
        .all()
    )
    comments = dict(
        db.session.query(SocialComment.post_id, func.count(SocialComment.id))
        .filter(SocialComment.post_id.in_(post_ids))
        .group_by(SocialComment.post_id)
        .all()
    )
    liked_ids = {
        row[0]
        for row in db.session.query(SocialLike.post_id)
        .filter(SocialLike.user_id == viewer_id, SocialLike.post_id.in_(post_ids))
        .all()
    }
    saved_ids = {
        row[0]
        for row in db.session.query(SocialBookmark.post_id)
        .filter(SocialBookmark.user_id == viewer_id, SocialBookmark.post_id.in_(post_ids))
        .all()
    }

    return [
        {
            "id": post.id,
            "texto": post.texto,
            "media_url": post.media_url,
            "media_type": post.media_type,
            "media_blurhash": post.media_blurhash,
            "localizacao": post.localizacao,
            "criado_em": post.criado_em.isoformat() + "Z",
            "autor": _user_payload(users[post.user_id]),
            "curtidas": int(likes.get(post.id, 0)),
            "comentarios": int(comments.get(post.id, 0)),
            "curtido": post.id in liked_ids,
            "guardado": post.id in saved_ids,
        }
        for post in posts
        if post.user_id in users
    ]


def _story_payloads(stories, viewer_id):
    if not stories:
        return []

    story_ids = [story.id for story in stories]
    user_ids = {story.user_id for story in stories}
    users = {
        user.id: user
        for user in Usuario.query.filter(Usuario.id.in_(user_ids)).all()
    }
    viewed_ids = {
        row[0]
        for row in db.session.query(SocialStoryView.story_id)
        .filter(
            SocialStoryView.user_id == viewer_id,
            SocialStoryView.story_id.in_(story_ids),
        )
        .all()
    }
    view_counts = dict(
        db.session.query(SocialStoryView.story_id, func.count(SocialStoryView.id))
        .filter(SocialStoryView.story_id.in_(story_ids))
        .group_by(SocialStoryView.story_id)
        .all()
    )

    return [
        {
            "id": story.id,
            "texto": story.texto,
            "media_url": story.media_url,
            "media_type": story.media_type,
            "media_blurhash": story.media_blurhash,
            "criado_em": story.criado_em.isoformat() + "Z",
            "expira_em": story.expira_em.isoformat() + "Z",
            "autor": _user_payload(users[story.user_id]),
            "visto": story.id in viewed_ids,
            "visualizacoes": int(view_counts.get(story.id, 0)),
        }
        for story in stories
        if story.user_id in users
    ]


@social_bp.route("/posts", methods=["GET"])
def list_posts():
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()

    feed = request.args.get("feed", "for-you")
    query = request.args.get("q", "").strip()[:120]
    author_id = request.args.get("author_id", type=int)
    limit = min(max(request.args.get("limit", 50, type=int), 1), 100)

    posts_query = SocialPost.query.join(Usuario, Usuario.id == SocialPost.user_id)
    if feed == "following":
        followed_ids = [
            row[0]
            for row in db.session.query(SocialFollow.followed_user_id)
            .filter(SocialFollow.user_id == user_id)
            .all()
        ]
        posts_query = posts_query.filter(SocialPost.user_id.in_([user_id, *followed_ids]))
    elif feed == "saved":
        saved_ids = [
            row[0]
            for row in db.session.query(SocialBookmark.post_id)
            .filter(SocialBookmark.user_id == user_id)
            .all()
        ]
        if not saved_ids:
            return jsonify({"items": []})
        posts_query = posts_query.filter(SocialPost.id.in_(saved_ids))

    if author_id is not None:
        posts_query = posts_query.filter(SocialPost.user_id == author_id)
    if query:
        pattern = f"%{query}%"
        posts_query = posts_query.filter(
            or_(
                SocialPost.texto.ilike(pattern),
                SocialPost.localizacao.ilike(pattern),
                Usuario.nome.ilike(pattern),
            )
        )

    posts = posts_query.order_by(SocialPost.criado_em.desc()).limit(limit).all()
    payloads = _post_payloads(posts, user_id)
    if feed == "popular":
        payloads.sort(key=lambda post: (post["curtidas"], post["comentarios"], post["criado_em"]), reverse=True)

    return jsonify({"items": payloads})


@social_bp.route("/posts", methods=["POST"])
def create_post():
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "O conteúdo da publicação é inválido"}), 400

    texto = data.get("texto", "")
    if not isinstance(texto, str) or len(texto.strip()) > 3000:
        return jsonify({"error": "O texto deve ter no máximo 3000 caracteres"}), 400
    texto = texto.strip()
    try:
        media_url = _valid_media_url(data.get("media_url"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    media_type = data.get("media_type")
    if media_url and media_type not in {"image", "video"}:
        return jsonify({"error": "O tipo da mídia deve ser imagem ou vídeo"}), 400
    try:
        media_blurhash = validate_blurhash(data.get("media_blurhash"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if media_type != "image":
        media_blurhash = None
    if not media_url:
        media_type = None
        media_blurhash = None
    localizacao = data.get("localizacao", "")
    if not isinstance(localizacao, str) or len(localizacao.strip()) > 120:
        return jsonify({"error": "A localização deve ter no máximo 120 caracteres"}), 400
    if not texto and not media_url:
        return jsonify({"error": "Escreve algo ou adiciona uma foto/vídeo"}), 400

    post = SocialPost(
        user_id=user_id,
        texto=texto,
        media_url=media_url,
        media_type=media_type,
        media_blurhash=media_blurhash,
        localizacao=localizacao.strip() or None,
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({"item": _post_payloads([post], user_id)[0]}), 201


@social_bp.route("/posts/<int:post_id>", methods=["DELETE"])
def delete_post(post_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    post = db.session.get(SocialPost, post_id)
    if not post:
        return jsonify({"error": "Publicação não encontrada"}), 404
    if post.user_id != user_id:
        return jsonify({"error": "Só podes apagar as tuas publicações"}), 403

    SocialLike.query.filter_by(post_id=post.id).delete()
    SocialComment.query.filter_by(post_id=post.id).delete()
    SocialBookmark.query.filter_by(post_id=post.id).delete()
    db.session.delete(post)
    db.session.commit()
    return jsonify({"deleted": True})


@social_bp.route("/posts/<int:post_id>/like", methods=["POST"])
def toggle_like(post_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    if not db.session.get(SocialPost, post_id):
        return jsonify({"error": "Publicação não encontrada"}), 404

    like = SocialLike.query.filter_by(post_id=post_id, user_id=user_id).first()
    if like:
        db.session.delete(like)
        liked = False
    else:
        db.session.add(SocialLike(post_id=post_id, user_id=user_id))
        liked = True
    db.session.commit()
    count = SocialLike.query.filter_by(post_id=post_id).count()
    return jsonify({"curtido": liked, "curtidas": count})


@social_bp.route("/posts/<int:post_id>/bookmark", methods=["POST"])
def toggle_bookmark(post_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    if not db.session.get(SocialPost, post_id):
        return jsonify({"error": "Publicação não encontrada"}), 404

    bookmark = SocialBookmark.query.filter_by(post_id=post_id, user_id=user_id).first()
    if bookmark:
        db.session.delete(bookmark)
        saved = False
    else:
        db.session.add(SocialBookmark(post_id=post_id, user_id=user_id))
        saved = True
    db.session.commit()
    return jsonify({"guardado": saved})


@social_bp.route("/posts/<int:post_id>/comments", methods=["GET", "POST"])
def post_comments(post_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    if not db.session.get(SocialPost, post_id):
        return jsonify({"error": "Publicação não encontrada"}), 404

    if request.method == "POST":
        data = request.get_json(silent=True)
        texto = data.get("texto") if isinstance(data, dict) else None
        if not isinstance(texto, str) or not texto.strip() or len(texto.strip()) > 1000:
            return jsonify({"error": "O comentário deve ter entre 1 e 1000 caracteres"}), 400
        comment = SocialComment(post_id=post_id, user_id=user_id, texto=texto.strip())
        db.session.add(comment)
        db.session.commit()
        return jsonify({"item": _comment_payload(comment)}), 201

    comments = (
        SocialComment.query.filter_by(post_id=post_id)
        .order_by(SocialComment.criado_em.asc())
        .limit(100)
        .all()
    )
    return jsonify({"items": [_comment_payload(comment) for comment in comments]})


def _comment_payload(comment):
    user = db.session.get(Usuario, comment.user_id)
    if not user:
        return None
    return {
        "id": comment.id,
        "texto": comment.texto,
        "criado_em": comment.criado_em.isoformat() + "Z",
        "autor": _user_payload(user),
    }


@social_bp.route("/posts/<int:post_id>/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(post_id, comment_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    comment = db.session.get(SocialComment, comment_id)
    if not comment or comment.post_id != post_id:
        return jsonify({"error": "Comentário não encontrado"}), 404
    if comment.user_id != user_id:
        return jsonify({"error": "Só podes apagar os teus comentários"}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"deleted": True})


@social_bp.route("/users", methods=["GET"])
def list_users():
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    query = request.args.get("q", "").strip()[:100]
    limit = min(max(request.args.get("limit", 20, type=int), 1), 50)
    users_query = Usuario.query.filter(Usuario.id != user_id)
    if query:
        users_query = users_query.filter(Usuario.nome.ilike(f"%{query}%"))
    users = users_query.order_by(Usuario.nome.asc()).limit(limit).all()
    followed_ids = {
        row[0]
        for row in db.session.query(SocialFollow.followed_user_id)
        .filter(
            SocialFollow.user_id == user_id,
            SocialFollow.followed_user_id.in_([user.id for user in users] or [-1]),
        )
        .all()
    }
    return jsonify({
        "items": [
            {
                **_user_payload(user),
                "seguindo": user.id in followed_ids,
                "seguidores": SocialFollow.query.filter_by(followed_user_id=user.id).count(),
            }
            for user in users
        ]
    })


@social_bp.route("/users/<int:target_id>", methods=["GET"])
def user_profile(target_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    user = db.session.get(Usuario, target_id)
    if not user:
        return jsonify({"error": "Utilizador não encontrado"}), 404
    return jsonify({
        "user": {
            **_user_payload(user),
            "publicacoes": SocialPost.query.filter_by(user_id=user.id).count(),
            "seguidores": SocialFollow.query.filter_by(followed_user_id=user.id).count(),
            "seguindo": SocialFollow.query.filter_by(user_id=user.id).count(),
            "eu_sigo": SocialFollow.query.filter_by(user_id=user_id, followed_user_id=user.id).first() is not None,
        }
    })


@social_bp.route("/users/<int:target_id>/follow", methods=["POST"])
def toggle_follow(target_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    if target_id == user_id:
        return jsonify({"error": "Não podes seguir a tua própria conta"}), 400
    if not db.session.get(Usuario, target_id):
        return jsonify({"error": "Utilizador não encontrado"}), 404

    follow = SocialFollow.query.filter_by(user_id=user_id, followed_user_id=target_id).first()
    if follow:
        db.session.delete(follow)
        following = False
    else:
        db.session.add(SocialFollow(user_id=user_id, followed_user_id=target_id))
        following = True
    db.session.commit()
    return jsonify({
        "seguindo": following,
        "seguidores": SocialFollow.query.filter_by(followed_user_id=target_id).count(),
    })


@social_bp.route("/stories", methods=["GET", "POST"])
def stories():
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()

    if request.method == "POST":
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "O conteúdo do story é inválido"}), 400
        texto = data.get("texto", "")
        if not isinstance(texto, str) or len(texto.strip()) > 500:
            return jsonify({"error": "O texto do story deve ter no máximo 500 caracteres"}), 400
        try:
            media_url = _valid_media_url(data.get("media_url"))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        media_type = data.get("media_type")
        if media_url and media_type not in {"image", "video"}:
            return jsonify({"error": "O tipo da mídia deve ser imagem ou vídeo"}), 400
        try:
            media_blurhash = validate_blurhash(data.get("media_blurhash"))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400
        if media_type != "image":
            media_blurhash = None
        if not media_url:
            media_blurhash = None
        if not texto.strip() and not media_url:
            return jsonify({"error": "Escreve algo ou adiciona uma foto/vídeo"}), 400
        story = SocialStory(
            user_id=user_id,
            texto=texto.strip(),
            media_url=media_url,
            media_type=media_type if media_url else None,
            media_blurhash=media_blurhash,
            expira_em=_utcnow_naive() + timedelta(hours=24),
        )
        db.session.add(story)
        db.session.commit()
        return jsonify({"item": _story_payloads([story], user_id)[0]}), 201

    active_stories = (
        SocialStory.query.filter(SocialStory.expira_em > _utcnow_naive())
        .order_by(SocialStory.criado_em.asc())
        .limit(200)
        .all()
    )
    return jsonify({"items": _story_payloads(active_stories, user_id)})


@social_bp.route("/stories/<int:story_id>/view", methods=["POST"])
def view_story(story_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    story = db.session.get(SocialStory, story_id)
    if not story or story.expira_em <= _utcnow_naive():
        return jsonify({"error": "Story expirado ou não encontrado"}), 404
    if story.user_id != user_id and not SocialStoryView.query.filter_by(story_id=story_id, user_id=user_id).first():
        db.session.add(SocialStoryView(story_id=story_id, user_id=user_id))
        db.session.commit()
    return jsonify({"visualizacoes": SocialStoryView.query.filter_by(story_id=story_id).count()})


@social_bp.route("/stories/<int:story_id>", methods=["DELETE"])
def delete_story(story_id):
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()
    story = db.session.get(SocialStory, story_id)
    if not story:
        return jsonify({"error": "Story não encontrado"}), 404
    if story.user_id != user_id:
        return jsonify({"error": "Só podes apagar os teus stories"}), 403
    SocialStoryView.query.filter_by(story_id=story_id).delete()
    db.session.delete(story)
    db.session.commit()
    return jsonify({"deleted": True})


@social_bp.route("/activity", methods=["GET"])
def activity():
    user_id = _current_user_id()
    if user_id is None:
        return _auth_error()

    events = []
    likes = (
        db.session.query(SocialLike, SocialPost, Usuario)
        .join(SocialPost, SocialPost.id == SocialLike.post_id)
        .join(Usuario, Usuario.id == SocialLike.user_id)
        .filter(SocialPost.user_id == user_id, SocialLike.user_id != user_id)
        .order_by(SocialLike.criado_em.desc())
        .limit(30)
        .all()
    )
    comments = (
        db.session.query(SocialComment, SocialPost, Usuario)
        .join(SocialPost, SocialPost.id == SocialComment.post_id)
        .join(Usuario, Usuario.id == SocialComment.user_id)
        .filter(SocialPost.user_id == user_id, SocialComment.user_id != user_id)
        .order_by(SocialComment.criado_em.desc())
        .limit(30)
        .all()
    )
    follows = (
        db.session.query(SocialFollow, Usuario)
        .join(Usuario, Usuario.id == SocialFollow.user_id)
        .filter(SocialFollow.followed_user_id == user_id)
        .order_by(SocialFollow.criado_em.desc())
        .limit(30)
        .all()
    )
    for like, post, user in likes:
        events.append({
            "id": f"like-{like.id}", "tipo": "like", "criado_em": like.criado_em.isoformat() + "Z",
            "texto": "gostou da tua publicação", "autor": _user_payload(user), "post_id": post.id,
        })
    for comment, post, user in comments:
        events.append({
            "id": f"comment-{comment.id}", "tipo": "comment", "criado_em": comment.criado_em.isoformat() + "Z",
            "texto": f"comentou: {comment.texto}", "autor": _user_payload(user), "post_id": post.id,
        })
    for follow, user in follows:
        events.append({
            "id": f"follow-{follow.id}", "tipo": "follow", "criado_em": follow.criado_em.isoformat() + "Z",
            "texto": "começou a seguir-te", "autor": _user_payload(user), "post_id": None,
        })
    events.sort(key=lambda item: item["criado_em"], reverse=True)
    return jsonify({"items": events[:60]})
