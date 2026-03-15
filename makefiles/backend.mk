bash:
	docker compose -f docker-compose.dev.yml exec backend bash

migrate:
	docker compose -f docker-compose.dev.yml exec backend python src/manage.py migrate

makemigrations:
	docker compose -f docker-compose.dev.yml exec backend python src/manage.py makemigrations