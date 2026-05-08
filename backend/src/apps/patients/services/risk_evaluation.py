from dataclasses import dataclass
from typing import List, Dict, Optional
from apps.monitoring.models.questions import RiskLevel


@dataclass
class AnswerInput:
    question_id: int
    answer: bool


@dataclass
class RiskEvaluationResult:
    level: str
    counts: Dict[str, int]
    applied_rules: List[str]


def evaluate_risk(answers: List[AnswerInput]) -> RiskEvaluationResult:
    """
    Evalúa el nivel de riesgo basándose en las respuestas del propietario.

    Flujo:
    1. Contar SÍ por nivel de riesgo de la pregunta
    2. Nivel inicial = el más alto encontrado
    3. Evaluar RiskRules (si todas las preguntas en SÍ → sumar puntos)
    4. Evaluar RiskThresholds (si count >= min_count → escalar)
    5. Retornar nivel final
    """
    if not answers:
        return RiskEvaluationResult(
            level=RiskLevel.LOW,
            counts={RiskLevel.LOW: 0, RiskLevel.MEDIUM: 0, RiskLevel.HIGH: 0},
            applied_rules=[]
        )

    from apps.patients.models.question import RiskRule, RiskThreshold
    from apps.monitoring.models.questions import GeneralQuestion

    question_ids = [a.question_id for a in answers]
    questions = GeneralQuestion.objects.filter(id__in=question_ids)
    question_risk_map = {q.id: q.associated_risk for q in questions}

    counts = {RiskLevel.LOW: 0, RiskLevel.MEDIUM: 0, RiskLevel.HIGH: 0}
    yes_questions = set()

    for answer in answers:
        if answer.answer:
            risk = question_risk_map.get(answer.question_id, RiskLevel.LOW)
            counts[risk] += 1
            yes_questions.add(answer.question_id)

    level = get_initial_level(counts)
    applied_rules = []

    active_rules = RiskRule.objects.filter(is_active=True)
    for rule in active_rules:
        if all(q_id in yes_questions for q_id in rule.question_ids):
            for level_key, points in rule.points.items():
                counts[level_key] += points
            applied_rules.append(rule.name)

    level = apply_thresholds(counts)

    return RiskEvaluationResult(
        level=level,
        counts=counts,
        applied_rules=applied_rules
    )


def get_initial_level(counts: Dict[str, int]) -> str:
    """Determina el nivel inicial basado en el nivel más alto presente."""
    if counts[RiskLevel.HIGH] > 0:
        return RiskLevel.HIGH
    if counts[RiskLevel.MEDIUM] > 0:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def apply_thresholds(counts: Dict[str, int]) -> str:
    """Aplica los thresholds de forma iterativa hasta que no haya más cambios."""
    from apps.patients.models.question import RiskThreshold

    max_iterations = 10
    for _ in range(max_iterations):
        thresholds = RiskThreshold.objects.filter(is_active=True).order_by('-min_count')
        threshold_applied = False

        for threshold in thresholds:
            if counts[threshold.level] >= threshold.min_count:
                if threshold.escalates_to == 'LOW':
                    counts['LOW'] += 1
                elif threshold.escalates_to == 'MEDIUM':
                    counts['MEDIUM'] += 1
                elif threshold.escalates_to == 'HIGH':
                    counts['HIGH'] += 1
                threshold_applied = True
                break

        if not threshold_applied:
            break

    return get_initial_level(counts)