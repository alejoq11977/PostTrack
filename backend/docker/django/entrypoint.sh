#!/bin/sh

echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

cd /app/src

echo "Applying database migrations..."
python manage.py migrate

echo "Starting development server..."
python manage.py runserver 0.0.0.0:8000