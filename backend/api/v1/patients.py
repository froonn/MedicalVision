# Файл: api/v1/patients.py (НОВЫЙ ФАЙЛ)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import pydantic_models
from crud import analysis_crud
from core.security import get_current_user
from database import get_db

router = APIRouter(prefix="/v1/patients", tags=["Клиницист / Управление Пациентами"])


# --- 1. Требование: Поиск и История ЭМК ---
@router.get(
    "/{medical_record_number}/history",
    response_model=pydantic_models.PatientHistory,
    summary="Получение полной истории анализов пациента по MRN"
)
async def get_patient_emr_history(
        medical_record_number: str,
        db: Session = Depends(get_db),
        current_user: pydantic_models.User = Depends(get_current_user)
):
    """
    Клиницист/Администратор просматривает все проведенные анализы
    и заключения для конкретного пациента по его MRN.
    """
    if current_user.role not in ['clinician', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для Клиницистов и Администраторов."
        )

    patient_data = analysis_crud.get_patient_history_by_mrn(db, medical_record_number)

    if not patient_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Пациент с MRN: {medical_record_number} не найден.")

    return patient_data


# --- 2. Требование: Назначение Лечения ---
@router.post(
    "/analyses/{analysis_id}/prescribe",
    response_model=pydantic_models.ClinicianAnalysis,
    summary="Назначение плана лечения по результатам анализа"
)
async def prescribe_treatment(
        analysis_id: int,
        data: pydantic_models.TreatmentUpdate,
        db: Session = Depends(get_db),
        current_user: pydantic_models.User = Depends(get_current_user)
):
    """
    Клиницист вводит окончательный план лечения на основе окончательного заключения диагноста.
    """
    if current_user.role != 'clinician':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступно только для Клиницистов."
        )

    updated_analysis = analysis_crud.update_analysis_treatment_plan(
        db=db,
        analysis_id=analysis_id,
        treatment_plan=data.treatment_plan,
        clinician_id=current_user.id
    )

    if not updated_analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Анализ не найден.")

    return updated_analysis