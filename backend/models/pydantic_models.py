# Файл: models/pydantic_models.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- 1. Схемы Пользователей и Авторизации ---

class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    role: str  # 'diagnostician', 'clinician', 'admin'


class User(UserBase):
    id: int
    role: str
    is_active: bool

    class Config:
        from_attributes = True  # Для совместимости с SQLAlchemy


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# --- 2. Схемы Анализов и Результатов ---

class AnalysisCreate(BaseModel):
    patient_mrn: str  # MRN пациента для привязки
    # При загрузке файла данные о пути 'image_path' будут добавлены на сервере


class ResultBase(BaseModel):
    system_diagnosis: str


class ResultInDB(ResultBase):
    diagnostician_conclusion: Optional[str] = None
    is_confirmed: bool = False
    feedback_correct: int = -1

    class Config:
        from_attributes = True


class AnalysisWithResult(BaseModel):
    id: int
    date_of_analysis: datetime
    image_path: str
    patient_id: int
    diagnostician_id: int
    results: Optional[ResultInDB] = None

    class Config:
        from_attributes = True



# --- Схема данных пациента (для отображения в списке) ---
class PatientBase(BaseModel):
    # Теперь эти поля разрешают None, что соответствует данным из БД.
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    medical_record_number: str

    class Config:
        from_attributes = True


# --- Схема анализа с полными данными (для истории) ---
class AnalysisFull(BaseModel):
    id: int
    date_of_analysis: datetime
    image_path: str
    patient: PatientBase  # <-- Теперь использует исправленный PatientBase
    results: Optional[ResultInDB] = None

    class Config:
        from_attributes = True


# --- Схема для обновления заключения ---
class ConclusionUpdate(BaseModel):
    conclusion: str
    is_correct: bool  # true = корректно (1), false = ошибочно (0)


# --- Схема базового пользователя (для отображения, кто подтвердил) ---
class UserBase(BaseModel):
    username: str

    class Config:
        from_attributes = True


# --- Расширенная схема анализа для Клинициста ---
class ClinicianAnalysis(BaseModel):
    id: int
    date_of_analysis: datetime
    image_path: str
    # Assuming ResultInDB now includes 'treatment_plan' and other fields
    results: Optional[ResultInDB] = None
    diagnostician: Optional[UserBase] = None  # Кто подтвердил окончательный диагноз

    class Config:
        from_attributes = True


# --- Схема ответа для полной истории пациента ---
class PatientHistory(BaseModel):
    patient: PatientBase
    analyses: list[ClinicianAnalysis]


# --- Схема запроса для обновления плана лечения ---
class TreatmentUpdate(BaseModel):
    treatment_plan: str

class UserRoleUpdate(BaseModel):
    role: str # Ожидаемые значения: 'diagnostician', 'clinician', 'admin'

# --- Схема для метрик модели ---
class ModelMetrics(BaseModel):
    total_confirmed: int
    correct_predictions: int
    accuracy_percentage: float
