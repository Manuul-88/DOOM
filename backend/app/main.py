from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models.user import User
from app.models.content import Content
from app.models.review import Review

from app.routes import users
from app.routes import content
from app.routes import reviews


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Doomsday Prep API",
    description="API para preparar Avengers: Doomsday",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(content.router)
app.include_router(reviews.router)


@app.get("/")
def root():
    return {
        "message": "Doomsday Prep API funcionando"
    }