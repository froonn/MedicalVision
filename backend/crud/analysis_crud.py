# Файл: crud/analysis_crud.py

from sqlalchemy.orm import Session
from models import sql_models, pydantic_models
from core import cv_stub


# Получение пациента по MRN
def get_patient_by_mrn(db: Session, mrn: str):
    return db.query(sql_models.Patient).filter(sql_models.Patient.medical_record_number == mrn).first()


# Создание анализа и результатов
def create_analysis_and_run_cv(
        db: Session,
        patient_mrn: str,
        diagnostician_id: int,
        image_path: str
):
    # 1. Найти пациента
    patient = get_patient_by_mrn(db, patient_mrn)
    if not patient:
        # В реальной жизни здесь может быть создание нового пациента
        # или HTTPException
        raise ValueError(f"Пациент с MRN {patient_mrn} не найден.")

    # 2. Создать запись об анализе
    db_analysis = sql_models.Analysis(
        patient_id=patient.id,
        diagnostician_id=diagnostician_id,
        image_path=image_path
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # 3. Запустить заглушку CV
    cv_result = cv_stub.run_cv_analysis(image_path)

    # 4. Сохранить результаты CV
    db_result = sql_models.Result(
        analysis_id=db_analysis.id,
        system_diagnosis=cv_result['system_diagnosis'],
        system_segmentation_path=cv_result['segmentation_mask_path'],
        # is_confirmed и feedback_correct остаются по умолчанию
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return db_analysis


# --- НОВАЯ ФУНКЦИЯ: Получение анализов для конкретного диагноста ---
def get_analyses_for_diagnostician(db: Session, user_id: int):
    """
    Получает все анализы, проведенные данным диагностом,
    с предзагрузкой данных пациента и результатов.
    """
    return (
        db.query(sql_models.Analysis)
        .filter(sql_models.Analysis.diagnostician_id == user_id)
        # Оптимизация: загружаем связанные данные пациента и результатов
        .options(joinedload(sql_models.Analysis.patient),
                 joinedload(sql_models.Analysis.results))
        .order_by(sql_models.Analysis.date_of_analysis.desc())
        .all()
    )


# --- НОВАЯ ФУНКЦИЯ: Получение одного анализа по ID ---
def get_analysis_by_id(db: Session, analysis_id: int):
    """
    Получает один анализ с результатами и данными пациента.
    """
    return (
        db.query(sql_models.Analysis)
        .filter(sql_models.Analysis.id == analysis_id)
        .options(joinedload(sql_models.Analysis.patient),
                 joinedload(sql_models.Analysis.results))
        .first()
    )


# --- НОВАЯ ФУНКЦИЯ: Обновление заключения врача и обратной связи ---
def update_analysis_conclusion(
        db: Session,
        analysis_id: int,
        conclusion: str,
        feedback: int  # 1: корректно, 0: ошибочно
):
    """
    Обновляет окончательное заключение и статус подтверждения.
    """
    db_analysis = get_analysis_by_id(db, analysis_id)
    if not db_analysis or not db_analysis.results:
        return None

    db_result = db_analysis.results

    db_result.diagnostician_conclusion = conclusion
    db_result.is_confirmed = True
    db_result.feedback_correct = feedback  # Записываем обратную связь

    db.commit()
    db.refresh(db_result)
    return db_analysis