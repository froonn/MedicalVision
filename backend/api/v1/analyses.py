# Файл: api/v1/analyses.py

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
import os

from database import get_db
from crud import analysis_crud
from api.v1.auth import get_current_user
from models.pydantic_models import *

router = APIRouter()

# --- Конфигурация для сохранения файлов ---
# В реальной жизни лучше использовать S3 или сетевое хранилище.
UPLOAD_FOLDER = "data/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post(
    "/upload_analysis",
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка медицинского изображения и запуск CV анализа"
)
async def upload_file_and_run_cv(
        # File для загружаемого файла, Form для других полей
        file: UploadFile = File(...),
        patient_mrn: str = Form(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)  # Защита маршрута
):
    """
    Позволяет Врачу-диагносту загрузить снимок и привязать его к пациенту.
    Запускает автоматический анализ CV (заглушку).
    """

    # 1. Проверка роли (только диагносты могут загружать)
    if current_user.role != 'diagnostician':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для Врачей-диагностов."
        )

    # 2. Сохранение файла на сервере
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        # Чтение файла по частям и запись на диск
        with open(file_location, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # Чтение по 1MB
                f.write(chunk)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении файла: {e}"
        )
    finally:
        await file.close()

    # 3. Создание записи в БД и запуск CV (через CRUD)
    try:
        new_analysis = analysis_crud.create_analysis_and_run_cv(
            db=db,
            patient_mrn=patient_mrn,
            diagnostician_id=current_user.id,
            image_path=file_location
        )

        return {
            "message": "Файл успешно загружен и анализ запущен.",
            "analysis_id": new_analysis.id,
            "patient_mrn": patient_mrn,
            "system_diagnosis": new_analysis.results.system_diagnosis  # Доступ к результатам
        }

    except ValueError as e:
        # Если пациент не найден
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        # Ошибка при работе с БД или CV
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обработки анализа: {e}"
        )


# Файл: api/v1/analyses.py (Обновлен)

# ... (импорты остаются прежними: APIRouter, Depends, HTTPException, status, etc.)

# ... (константы UPLOAD_FOLDER)

# ... (маршрут upload_file_and_run_cv остается прежним)

# --- 1. Требование: История анализов ---
@router.get(
    "/my_history",
    response_model=list[AnalysisFull],
    summary="Просмотр истории анализов врача-диагноста"
)
async def get_my_analysis_history(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Возвращает список всех анализов, проведенных текущим авторизованным диагностом.
    """
    if current_user.role not in ['diagnostician', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для Диагностов и Администраторов."
        )

    analyses = analysis_crud.get_analyses_for_diagnostician(db, current_user.id)
    return analyses


# --- 2. Требование: Просмотр одного анализа ---
@router.get(
    "/{analysis_id}",
    response_model=AnalysisFull,
    summary="Получение полного анализа по ID"
)
async def get_single_analysis(
        analysis_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Получает детали анализа, включая изображение, сегментацию и результаты CV.
    Проверка: доступ только для тех, кто проводил анализ, или администратора.
    """
    analysis = analysis_crud.get_analysis_by_id(db, analysis_id)

    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Анализ не найден.")

    # Проверка прав доступа
    is_owner = analysis.diagnostician_id == current_user.id
    is_admin_or_clinician = current_user.role in ['admin', 'clinician']

    if not is_owner and not is_admin_or_clinician:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к данному анализу.")

    return analysis


# --- 3. Требование: Корректировка и подтверждение диагноза + Обратная связь ---
@router.post(
    "/{analysis_id}/confirm",
    response_model=AnalysisFull,
    summary="Подтверждение/корректировка диагноза и обратная связь системе"
)
async def confirm_diagnosis(
        analysis_id: int,
        data: ConclusionUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Врач-диагност вводит окончательное заключение и помечает
    выводы системы как корректные (1) или ошибочные (0).
    """
    if current_user.role != 'diagnostician':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступно только для Диагностов.")

    analysis = analysis_crud.get_analysis_by_id(db, analysis_id)

    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Анализ не найден.")

    # Проверка: только владелец может подтвердить
    if analysis.diagnostician_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Вы не являетесь автором этого анализа.")

    # Конвертируем bool в int для БД: True(корректно) -> 1, False(ошибочно) -> 0
    feedback_int = 1 if data.is_correct else 0

    updated_analysis = analysis_crud.update_analysis_conclusion(
        db=db,
        analysis_id=analysis_id,
        conclusion=data.conclusion,
        feedback=feedback_int
    )

    return updated_analysis