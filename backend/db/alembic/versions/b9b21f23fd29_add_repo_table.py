"""Add repo table

Revision ID: b9b21f23fd29
Revises: e43d6834b174
Create Date: 2025-01-20 17:42:16.759837

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9b21f23fd29'
down_revision: Union[str, None] = 'e43d6834b174'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('repos',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('github_url', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('user_id', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_repos_github_url'), 'repos', ['github_url'], unique=True)
    op.create_index(op.f('ix_repos_id'), 'repos', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_repos_id'), table_name='repos')
    op.drop_index(op.f('ix_repos_github_url'), table_name='repos')
    op.drop_table('repos')
    # ### end Alembic commands ###
