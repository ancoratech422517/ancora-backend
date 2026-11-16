"""Persist refresh-token state for rotation and logout revocation."""
from alembic import op
import sqlalchemy as sa


revision = "ef8a09b7c231"
down_revision = "47b19d2a6f03"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("refresh_sessions"):
        op.create_table(
            "refresh_sessions",
            sa.Column("jti", sa.String(length=80), primary_key=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked_at", sa.DateTime(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
        )

    existing_indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("refresh_sessions")
    }
    if "ix_refresh_sessions_user_id" not in existing_indexes:
        op.create_index("ix_refresh_sessions_user_id", "refresh_sessions", ["user_id"])
    if "ix_refresh_sessions_expires_at" not in existing_indexes:
        op.create_index("ix_refresh_sessions_expires_at", "refresh_sessions", ["expires_at"])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("refresh_sessions"):
        existing_indexes = {
            index["name"] for index in inspector.get_indexes("refresh_sessions")
        }
        if "ix_refresh_sessions_expires_at" in existing_indexes:
            op.drop_index("ix_refresh_sessions_expires_at", table_name="refresh_sessions")
        if "ix_refresh_sessions_user_id" in existing_indexes:
            op.drop_index("ix_refresh_sessions_user_id", table_name="refresh_sessions")
        op.drop_table("refresh_sessions")
