# Файл: api/v1/admin.py (НОВЫЙ ФАЙЛ)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import pydantic_models
from crud import user_crud, analysis_crud
from core.security import get_current_user
from database import get_db

router = APIRouter(prefix="/v1/admin", tags=["Администратор / Управление Системой"])


# --- Хелпер: Проверка прав Администратора ---
def get_admin_user(current_user: pydantic_models.User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для Администраторов."
        )
    return current_user


# --- 1. Управление Пользователями: Получение списка ---
@router.get(
    "/users",
    response_model=list[pydantic_models.User],
    summary="Получить список всех пользователей системы"
)
async def list_all_users(
        db: Session = Depends(get_db),
        admin_user: pydantic_models.User = Depends(get_admin_user)  # Защита маршрута
):
    users = user_crud.get_all_users(db)
    return users


# --- 2. Управление Пользователями: Изменение роли ---
@router.patch(
    "/users/{user_id}/role",
    response_model=pydantic_models.User,
    summary="Изменить роль пользователя по ID"
)
async def change_user_role(
        user_id: int,
        role_update: pydantic_models.UserRoleUpdate,
        db: Session = Depends(get_db),
        admin_user: pydantic_models.User = Depends(get_admin_user)
):
    valid_roles = ['admin', 'diagnostician', 'clinician']
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимая роль. Доступные роли: {', '.join(valid_roles)}"
        )

    updated_user = user_crud.update_user_role(db, user_id, role_update.role)

    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден.")

    return updated_user


# --- 3. Общие Данные: Просмотр всех анализов (Для полного обзора) ---
@router.get(
    "/analyses/all",
    response_model=list[pydantic_models.AnalysisFull],
    summary="Получить полный список всех анализов в системе"
)
async def list_all_analyses(
        db: Session = Depends(get_db),
        admin_user: pydantic_models.User = Depends(get_admin_user)
):
    # Добавим в crud/analysis_crud.py функцию get_all_analyses
    analyses = analysis_crud.get_all_analyses(db)
    return analyses


router.get(
    "/model/feedback_metrics",
    response_model=pydantic_models.ModelMetrics,
    summary="Получить метрики точности модели CV на основе обратной связи от врачей"
)
async def get_model_feedback_metrics(
    db: Session = Depends(get_db),
    admin_user: pydantic_models.User = Depends(get_admin_user)
):
    """
    Показывает, насколько хорошо модель CV справляется с реальной диагностикой
    по мнению врачей (ключевой показатель для ретренинга).
    """
    metrics = analysis_crud.get_feedback_metrics(db)
    return metrics