from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Content(Base):
    __tablename__ = "content"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    type = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    order_number = Column(Integer, nullable=False)