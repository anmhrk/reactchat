"""Remove public

Revision ID: 7d10d40621e2
Revises: 179144f7bba8
Create Date: 2025-02-03 19:48:12.739220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d10d40621e2'
down_revision: Union[str, None] = '179144f7bba8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('chats', 'is_public')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('chats', sa.Column('is_public', sa.BOOLEAN(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
