# Файл: crud/analysis_crud.py

from sqlalchemy.orm import Session, joinedload
from models import sql_models, pydantic_models
from core import cv_stub
from sqlalchemy import func  # Импорт функции для агрегации


# Получение пациента по MRN
def get_patient_by_mrn(db: Session, mrn: str):
    return db.query(sql_models.Patient).filter(sql_models.Patient.medical_record_number == mrn).first()


# --- НОВАЯ ФУНКЦИЯ: Создание пациента (для использования ниже) ---
def create_patient(db: Session, mrn: str):
    """Создает новую запись пациента только с MRN."""
    db_patient = sql_models.Patient(medical_record_number=mrn)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def create_analysis_and_run_cv(
        db: Session,
        patient_mrn: str,
        diagnostician_id: int,
        image_path: str
):
    # 1. Найти или создать пациента
    patient = get_patient_by_mrn(db, patient_mrn)

    if not patient:
        # --- ИСПРАВЛЕНИЕ: Автоматически создаем нового пациента ---
        print(f"Пациент с MRN {patient_mrn} не найден. Создаю нового пациента.")
        patient = create_patient(db, patient_mrn)
        # --------------------------------------------------------

    # 2. Создать запись об анализе
    db_analysis = sql_models.Analysis(
        patient_id=patient.id,
        diagnostician_id=diagnostician_id,
        image_path=image_path
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # 3. Запустить заглушку CV (остальное без изменений)
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


# --- НОВАЯ ФУНКЦИЯ: Получение полной истории пациента по MRN ---
def get_patient_history_by_mrn(db: Session, mrn: str):
    """
    Получает объект пациента и все связанные с ним анализы.
    """
    # 1. Находим пациента
    patient = db.query(sql_models.Patient).filter(sql_models.Patient.medical_record_number == mrn).first()
    if not patient:
        return None

    # 2. Получаем все анализы этого пациента
    analyses = (
        db.query(sql_models.Analysis)
        .filter(sql_models.Analysis.patient_id == patient.id)
        .options(
            # Предзагружаем результаты и информацию о диагносте, который подтвердил диагноз
            joinedload(sql_models.Analysis.results),
            joinedload(sql_models.Analysis.diagnostician)
        )
        .order_by(sql_models.Analysis.date_of_analysis.desc())
        .all()
    )

    return {"patient": patient, "analyses": analyses}


# --- НОВАЯ ФУНКЦИЯ: Обновление плана лечения ---
def update_analysis_treatment_plan(
        db: Session,
        analysis_id: int,
        treatment_plan: str,
        clinician_id: int
):
    """
    Обновляет план лечения в результате анализа и записывает ID клинициста.
    """
    db_analysis = db.query(sql_models.Analysis).filter(sql_models.Analysis.id == analysis_id).first()

    if not db_analysis:
        return None

    # Получаем или создаем результат
    db_result = db.query(sql_models.Result).filter(sql_models.Result.analysis_id == analysis_id).first()
    if not db_result:
        # В рабочем процессе это не должно происходить, так как анализ уже был запущен.
        return None

    db_result.treatment_plan = treatment_plan
    db_analysis.clinician_id = clinician_id  # Привязываем клинициста к анализу

    db.commit()
    db.refresh(db_result)
    db.refresh(db_analysis)
    return db_analysis


def get_all_analyses(db: Session, skip: int = 0, limit: int = 100):
    """
    Получает все анализы, проведенные в системе, для Администратора.
    """
    return (
        db.query(sql_models.Analysis)
        .options(
            joinedload(sql_models.Analysis.patient),
            joinedload(sql_models.Analysis.results),
            joinedload(sql_models.Analysis.diagnostician) # Добавим имя диагноста
        )
        .order_by(sql_models.Analysis.date_of_analysis.desc())
        .offset(skip).limit(limit)
        .all()
    )


# Файл: crud/analysis_crud.py (Дополнение)

# --- НОВАЯ ФУНКЦИЯ: Получение метрик обратной связи ---
def get_feedback_metrics(db: Session):
    """
    Рассчитывает процент корректных диагнозов системы на основе
    подтверждений врачей-диагностов.
    """

    # Считаем общее количество подтвержденных анализов (где is_confirmed = True)
    total_confirmed = db.query(sql_models.Result).filter(
        sql_models.Result.is_confirmed == True
    ).count()

    if total_confirmed == 0:
        return {
            "total_confirmed": 0,
            "correct_predictions": 0,
            "accuracy_percentage": 0.0
        }

    # Считаем количество корректных прогнозов (feedback_correct = 1)
    correct_predictions = db.query(sql_models.Result).filter(
        sql_models.Result.is_confirmed == True,
        sql_models.Result.feedback_correct == 1
    ).count()

    # Рассчитываем процент
    accuracy_percentage = (correct_predictions / total_confirmed) * 100

    return {
        "total_confirmed": total_confirmed,
        "correct_predictions": correct_predictions,
        "accuracy_percentage": round(accuracy_percentage, 2)
    }