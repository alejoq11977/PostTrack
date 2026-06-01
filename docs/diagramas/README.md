# Diagramas UML — PostTrack

Diagramas en **PlantUML** que describen el sistema **tal como está implementado** (backend Django/DRF + Celery, frontend React, PostgreSQL, Redis). Cada diagrama fue validado con PlantUML 1.2024.7 + Graphviz.

## Estructura

| Carpeta | Diagrama | Archivos |
|---|---|---|
| `casos-de-uso/` | Casos de uso | `casos-de-uso-general` + focalizados (`propietario`, `veterinario`) |
| `clases/` | Clases | `clases-dominio-completo` + focalizados (`motor-reglas`, `usuarios-clinicas`) |
| `entidad-relacion/` | Entidad-Relación | `entidad-relacion` (esquema de BD) |
| `componentes/` | Componentes | `componentes` (arquitectura lógica) |
| `despliegue/` | Despliegue | `despliegue` (Docker Compose) |
| `estados/` | Estados | `estados-monitoreo`, `estados-reporte` |
| `actividades/` | Actividades | `envio-reporte`, `evaluacion-riesgo`, `revision-veterinario`, `recordatorios` |
| `secuencia/` | Secuencia | `envio-reporte`, `revision-veterinario`, `autenticacion`, `recordatorios-celery`, `alertas-tiempo-real` |

Los diagramas grandes (casos de uso general, clases de dominio completo, entidad-relación) tienen versiones focalizadas en las carpetas correspondientes para mostrar con mayor detalle las partes más complejas.

## Imágenes generadas

Las imágenes ya renderizadas están en `imagenes/`, espejando las categorías:

```
imagenes/
├── svg/<categoria>/*.svg   ← recomendado para el informe (vectorial, no se pixela)
└── png/<categoria>/*.png   ← para visualización rápida y compatibilidad
```

Para insertarlas en el documento LaTeX se recomienda el SVG (o exportarlo a PDF). Si se modifica un `.puml`, regenerar las imágenes con los comandos de abajo.

## Notas de fidelidad al código

- **Motor de riesgo** (`apps/patients/services/risk_evaluation.py`): el nivel final es el **MÁXIMO** entre el factor individual más alto, las combinaciones (`RiskRule`) y los umbrales de acumulación (`RiskThreshold`) que se cumplan. El orden no altera el resultado.
- **Ventana temporal**: la ventana activa es la de mayor `start_hour` menor o igual a las horas transcurridas desde la cirugía.
- **Aislamiento por clínica**: todas las consultas del veterinario se filtran por la clínica activa (`X-Clinic-Id`) vía `ClinicAccessMiddleware`.
- **Recordatorios**: Celery beat ejecuta `send_overdue_reminders` cada 30 min; máximo 3 correos por ciclo y mínimo 24 h entre envíos; los contadores se reinician al enviar un reporte.

## Cómo renderizar

```bash
# PNG de todos los diagramas
java -jar plantuml.jar -tpng docs/diagramas/**/*.puml

# SVG (vectorial, recomendado para el informe)
java -jar plantuml.jar -tsvg docs/diagramas/**/*.puml

# Validar sintaxis sin generar imagen
java -jar plantuml.jar -checkonly docs/diagramas/**/*.puml
```

Requiere `java` y `graphviz` (`dot`) instalados. También se puede usar la extensión *PlantUML* de VS Code o el editor en línea de plantuml.com.
