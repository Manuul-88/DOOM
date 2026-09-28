from pydantic import BaseModel


class ContentCreate(BaseModel):
    title: str
    type: str
    description: str | None = None
    order_number: int


class ContentResponse(BaseModel):
    id: int
    title: str
    type: str
    description: str | None
    order_number: int

    class Config:
        from_attributes = True