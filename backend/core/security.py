# core/security.py

import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import jwt, JWTError

# --- НОВЫЕ ИМПОРТЫ для get_current_user ---
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from crud import user_crud
from models import pydantic_models


# --- Конфигурация Безопасности ---

# Секретный ключ для подписи токенов
# В реальном приложении это должно быть взято из переменных окружения!
SECRET_KEY = os.environ.get("SECRET_KEY", "very_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Токен истекает через 24 часа

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/token")


# --- Функции Паролей ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет совпадает ли введенный пароль с хешем."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Хеширует пароль."""
    return pwd_context.hash(password)


# --- Функции JWT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает новый JWT Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Добавляем данные об истечении срока действия
    to_encode.update({"exp": expire})

    # Создаем токен
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Декодирует JWT Access Token."""
    try:
        # Проверяем подпись и срок действия
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Невалидный токен или истек срок действия
        return None


# Файл: core/security.py (ИСПРАВЛЕНИЕ ТИПА В get_current_user)

async def get_current_user(
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
) -> pydantic_models.User:
    """
    Проверяет токен, извлекает ID пользователя и возвращает объект пользователя.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    # --- КРИТИЧНОЕ ИСПРАВЛЕНИЕ: ПРЕОБРАЗОВАНИЕ СТРОКИ В INT ---
    try:
        user_id = int(user_id_str)
    except ValueError:
        # Если 'sub' не является числом, это ошибка токена
        raise credentials_exception

    # 2. Получение пользователя из БД (теперь user_id - это int)
    user = user_crud.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception

    # Преобразование в Pydantic модель для возврата
    return pydantic_models.User.model_validate(user)