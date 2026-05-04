FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for some ML packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port FastAPI runs on
EXPOSE 8001

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
