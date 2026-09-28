from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content import Content
from app.schemas.content import ContentCreate, ContentResponse


router = APIRouter(
    prefix="/content",
    tags=["Content"]
)


@router.post("/", response_model=ContentResponse)
def create_content(
    content: ContentCreate,
    db: Session = Depends(get_db)
):
    new_content = Content(
        title=content.title,
        type=content.type,
        description=content.description,
        order_number=content.order_number
    )

    db.add(new_content)
    db.commit()
    db.refresh(new_content)

    return new_content


@router.get("/", response_model=list[ContentResponse])
def get_content(
    db: Session = Depends(get_db)
):
    return (
        db.query(Content)
        .order_by(Content.order_number)
        .all()
    )


@router.get("/{content_id}", response_model=ContentResponse)
def get_content_by_id(
    content_id: int,
    db: Session = Depends(get_db)
):
    content = (
        db.query(Content)
        .filter(Content.id == content_id)
        .first()
    )

    if not content:
        raise HTTPException(
            status_code=404,
            detail="Contenido no encontrado"
        )

    return content 
