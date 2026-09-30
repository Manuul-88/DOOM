from datetime import datetime

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    user_id: int
    content_id: int
    watched: bool = False
    rating: float | None = None
    review: str | None = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    content_id: int
    watched: bool
    rating: int | None
    review: str | None
    watched_at: datetime | None

    class Config:
        from_attributes = True