# Файл: crud/user_crud.py

from sqlalchemy.orm import Session
from models import sql_models, pydantic_models
from core.security import get_password_hash


# Функция для получения пользователя по имени
def get_user_by_username(db: Session, username: str):
    return db.query(sql_models.User).filter(sql_models.User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    """Получает пользователя по его ID."""
    return db.query(sql_models.User).filter(sql_models.User.id == user_id).first()


# Функция для создания нового пользователя
def create_user(db: Session, user: pydantic_models.UserCreate):
    # --- ИСПРАВЛЕНИЕ: Удаляем ручное усечение пароля ---
    # passlib/bcrypt обрабатывает усечение до 72 байт автоматически.

    # Хешируем оригинальный пароль
    print(user)
    hashed_password = get_password_hash(user.password)

    db_user = sql_models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """
    Получает список всех пользователей системы.
    """
    return db.query(sql_models.User).offset(skip).limit(limit).all()

# --- НОВАЯ ФУНКЦИЯ: Обновление роли пользователя ---
def update_user_role(db: Session, user_id: int, new_role: str):
    """
    Обновляет роль пользователя по его ID.
    """
    db_user = db.query(sql_models.User).filter(sql_models.User.id == user_id).first()
    if db_user:
        db_user.role = new_role
        db.commit()
        db.refresh(db_user)
    return db_user