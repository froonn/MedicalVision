# Файл: crud/user_crud.py

from sqlalchemy.orm import Session
from models import sql_models, pydantic_models
from core.security import get_password_hash


# Функция для получения пользователя по имени
def get_user_by_username(db: Session, username: str):
    return db.query(sql_models.User).filter(sql_models.User.username == username).first()


# Функция для создания нового пользователя
def create_user(db: Session, user: pydantic_models.UserCreate):
    # --- ИСПРАВЛЕНИЕ: Обрезаем пароль до 72 байт перед хешированием ---
    # Пароль должен быть преобразован в байты для корректного усечения по длине
    raw_password_bytes = user.password.encode('utf-8')
    # Усекаем до 72 байт
    truncated_password = raw_password_bytes[:72].decode('utf-8', errors='ignore')

    # Хешируем обрезанный пароль
    hashed_password = get_password_hash(truncated_password)

    # --- Конец ИСПРАВЛЕНИЯ ---

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