# backend

FROM python:3.14-slim
LABEL authors="froonn"

WORKDIR /app

RUN apt update && apt install -y build-essential --no-install-recommends
RUN rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* README.md requirements.txt ./
RUN python -m pip install --upgrade pip setuptools build

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]