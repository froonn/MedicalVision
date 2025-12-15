from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # 'diagnostician', 'clinician', 'admin'
    is_active = Column(Boolean, default=True)


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(String)
    medical_record_number = Column(String, unique=True, index=True)


class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    diagnostician_id = Column(Integer, ForeignKey("users.id"))
    date_of_analysis = Column(DateTime, default=datetime.datetime.utcnow)
    image_path = Column(String)  # Путь к оригинальному файлу

    patient = relationship("Patient")
    results = relationship("Result", back_populates="analysis", uselist=False)


class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"))
    system_diagnosis = Column(String)
    system_segmentation_path = Column(String)  # Путь к маске CV

    diagnostician_conclusion = Column(String, nullable=True)  # Окончательное заключение
    is_confirmed = Column(Boolean, default=False)
    feedback_correct = Column(Integer, default=-1)  # -1: нет, 0: ошибочно, 1: корректно

    analysis = relationship("Analysis", back_populates="results")