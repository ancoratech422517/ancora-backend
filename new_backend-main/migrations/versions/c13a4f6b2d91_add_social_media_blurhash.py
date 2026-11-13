"""Store BlurHash placeholders for uploaded images.

Revision ID: c13a4f6b2d91
Revises: a1b2c3d4e5f6
Create Date: 2026-11-13
"""
from alembic import op
import sqlalchemy as sa


revision = "c13a4f6b2d91"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns_by_table = {
        "social_posts": "media_blurhash",
        "social_stories": "media_blurhash",
        "Dados_Estado": "media_blurhash",
        "usuarios": "foto_usuario_blurhash",
        "Produto_usuario": "url_imagem_produto_blurhash",
        "Turma_Aula": "imagem_perfil_Turma_blurhash",
    }
    for table, column in columns_by_table.items():
        if inspector.has_table(table):
            existing_columns = {item["name"] for item in inspector.get_columns(table)}
            if column not in existing_columns:
                op.add_column(table, sa.Column(column, sa.String(length=100), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns_by_table = {
        "social_posts": "media_blurhash",
        "social_stories": "media_blurhash",
        "Dados_Estado": "media_blurhash",
        "usuarios": "foto_usuario_blurhash",
        "Produto_usuario": "url_imagem_produto_blurhash",
        "Turma_Aula": "imagem_perfil_Turma_blurhash",
    }
    for table, column in columns_by_table.items():
        if inspector.has_table(table):
            existing_columns = {item["name"] for item in inspector.get_columns(table)}
            if column in existing_columns:
                op.drop_column(table, column)
