include makefiles/*.mk

.DEFAULT_GOAL := help

help:
	@echo "PostTrack Commands:"
	@echo "  make up      - Inicia los contenedores de desarrollo"
	@echo "  make down    - Detiene los contenedores"
	@echo "  make bash    - Entra a la consola del backend"