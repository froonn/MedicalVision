import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import jwt, JWTError

# --- Конфигурация Безопасности ---

# Секретный ключ для подписи токенов
# В реальном приложении это должно быть взято из переменных окружения!
SECRET_KEY = os.environ.get("SECRET_KEY", "ваш_очень_секретный_ключ")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Токен истекает через 24 часа

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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