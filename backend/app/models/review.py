from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    content_id = Column(
        Integer,
        ForeignKey("content.id"),
        nullable=False
    )

    watched = Column(
        Boolean,
        default=False,
        nullable=False
    )

    rating = Column(
        Float,
        nullable=True
    )

    review = Column(
        Text,
        nullable=True
    )

    watched_at = Column(
        DateTime,
        nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "content_id",
            name="unique_user_content"
        ),
        CheckConstraint(
            "rating >= 1 AND rating <= 10",
            name="rating_between_1_and_10"
        ),
    )