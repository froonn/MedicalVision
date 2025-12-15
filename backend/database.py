from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.sql_models import Base # Импортируем нашу Base из sql_models

# SQLite URL для подключения
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Создание движка для SQLite.
# check_same_thread нужен только для SQLite, т.к. он не поддерживает многопоточность по умолчанию
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Создание сессии для работы с БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Функция для создания всех таблиц
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency для FastAPI: получение сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Запуск функции инициализации (например, в main.py)
if __name__ == "__main__":
    init_db()
    print("Database initialized with tables.")