FROM python:3.14-slim
LABEL authors="froonn"

WORKDIR /app

RUN apt update && apt install -y build-essential --no-install-recommends
RUN rm -rf /var/lib/apt/lists/*

COPY pyproject.toml poetry.lock* README.md ./
RUN python -m pip install --upgrade pip setuptools build

COPY api/ api/

RUN pip install --no-cache-dir .

COPY run.py ./

EXPOSE ${PORT}

CMD ["python", "-m", "run"]