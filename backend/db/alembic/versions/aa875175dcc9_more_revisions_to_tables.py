"""More revisions to tables

Revision ID: aa875175dcc9
Revises: ef64fbe837b0
Create Date: 2025-01-26 04:37:04.335630

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'aa875175dcc9'
down_revision: Union[str, None] = 'ef64fbe837b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('chat_messages',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('chat_id', sa.String(), nullable=True),
    sa.Column('content', sa.String(), nullable=True),
    sa.Column('role', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['chat_id'], ['chats.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_chat_id'), 'chat_messages', ['chat_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.add_column('chats', sa.Column('is_public', sa.Boolean(), nullable=True))
    op.alter_column('chats', 'file_tree',
               existing_type=postgresql.JSON(astext_type=sa.Text()),
               type_=sa.String(),
               existing_nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('chats', 'file_tree',
               existing_type=sa.String(),
               type_=postgresql.JSON(astext_type=sa.Text()),
               existing_nullable=True)
    op.drop_column('chats', 'is_public')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_chat_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    # ### end Alembic commands ###
