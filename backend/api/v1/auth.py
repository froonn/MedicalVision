# Файл: api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from datetime import timedelta

from database import get_db
from crud import user_crud
from core import security
from models import pydantic_models

router = APIRouter()

# Схема OAuth2 для передачи токена
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/token")


# --- Функция для получения JWT токена при входе ---
@router.post("/token", response_model=pydantic_models.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Авторизация пользователя (логин и пароль) и выдача Access Token.
    """
    user = user_crud.get_user_by_username(db, username=form_data.username)

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Создание токена
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# --- Пример защищенного маршрута (для проверки) ---
@router.get("/me", response_model=pydantic_models.User)
async def read_users_me(
    # ИСПОЛЬЗУЙТЕ ИМПОРТИРОВАННУЮ ФУНКЦИЮ!
    current_user: pydantic_models.User = Depends(security.get_current_user)
):
    """
    Возвращает информацию о текущем авторизованном пользователе.
    """
    return current_user


# Добавляем роутер с помощью @router.post
@router.post("/register", response_model=pydantic_models.User, status_code=status.HTTP_201_CREATED)
async def register_new_user(user_data: pydantic_models.UserCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя.
    Пользователям по умолчанию присваивается роль 'diagnostician'.
    """
    # 1. Проверка на существование пользователя
    db_user = user_crud.get_user_by_username(db, username=user_data.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )

    # 2. Устанавливаем роль по умолчанию (например, 'diagnostician')
    user_data.role = 'diagnostician'  # Принудительно устанавливаем роль

    # 3. Создание пользователя (CRUD уже содержит логику хеширования и усечения пароля)
    new_user = user_crud.create_user(db, user=user_data)

    return new_user