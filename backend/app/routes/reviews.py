from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewResponse


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.post("/", response_model=ReviewResponse)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db)
):
    existing_review = (
        db.query(Review)
        .filter(
            Review.user_id == review.user_id,
            Review.content_id == review.content_id
        )
        .first()
    )

    if existing_review:
        existing_review.watched = review.watched
        existing_review.rating = review.rating
        existing_review.review = review.review

        if review.watched and not existing_review.watched_at:
            existing_review.watched_at = datetime.now()

        db.commit()
        db.refresh(existing_review)

        return existing_review

    new_review = Review(
        user_id=review.user_id,
        content_id=review.content_id,
        watched=review.watched,
        rating=review.rating,
        review=review.review,
        watched_at=datetime.now() if review.watched else None
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


@router.get("/", response_model=list[ReviewResponse])
def get_reviews(
    db: Session = Depends(get_db)
):
    return db.query(Review).all()


@router.get(
    "/user/{user_id}",
    response_model=list[ReviewResponse]
)
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .all()
    ) 
