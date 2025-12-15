# Файл: main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from database import init_db
from fastapi.staticfiles import StaticFiles

from api.v1 import *

# Инициализация БД (создание таблиц)
init_db()

app = FastAPI(title="Система Компьютерного Зрения для Медицинской Диагностики")

app.mount("/data", StaticFiles(directory="data"), name="data")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить все (на этапе разработки), позже заменить на домен React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Регистрация роутера авторизации
app.include_router(
    auth.router,
    prefix="/v1/auth",
    tags=["Auth"]
)

app.include_router( # НОВЫЙ РОУТЕР
    analyses.router,
    prefix="/v1/analyses",
    tags=["Analyses"]
)

app.include_router(admin.router) # НОВЫЙ РОУТЕР

# --- Вспомогательный маршрут для создания тестового пользователя (УДАЛИТЬ в продакшене!) ---
from crud import user_crud
from models.pydantic_models import UserCreate
from database import get_db, SessionLocal
from core.security import get_password_hash

# Создание тестового пользователя (например, администратора) при запуске
try:
    db = SessionLocal()
    if not user_crud.get_user_by_username(db, "admin"):
        admin_user = UserCreate(username="admin", password="password", role="admin")
        user_crud.create_user(db, admin_user)
        print("Тестовый пользователь 'admin' создан.")
finally:
    db.close()