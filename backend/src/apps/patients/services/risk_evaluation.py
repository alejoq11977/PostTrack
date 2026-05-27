from dataclasses import dataclass
from typing import List, Dict, Optional
from apps.monitoring.models.questions import RiskLevel

SEVERITY = {RiskLevel.LOW: 0, RiskLevel.MEDIUM: 1, RiskLevel.HIGH: 2}


@dataclass
class AnswerInput:
    question_id: int
    answer: bool


@dataclass
class RiskEvaluationResult:
    level: str
    counts: Dict[str, int]
    applied_rules: List[str]
    window: Optional[str] = None


def _max_level(a: str, b: str) -> str:
    return a if SEVERITY.get(a, 0) >= SEVERITY.get(b, 0) else b


def _resolve_window(hours_since_surgery: Optional[float]):
    """Ventana activa = la de mayor start_hour que sea <= horas desde la cirugía."""
    from apps.patients.models.question import RiskWindow
    if hours_since_surgery is None:
        return None
    return RiskWindow.objects.filter(
        is_active=True, start_hour__lte=hours_since_surgery
    ).order_by('-start_hour').first()


def evaluate_risk(answers: List[AnswerInput], hours_since_surgery: Optional[float] = None) -> RiskEvaluationResult:
    """
    Evalúa el nivel de riesgo de un reporte.

    El riesgo de cada factor depende de la VENTANA temporal, calculada desde la
    cirugía (`hours_since_surgery`). El nivel final es el MÁXIMO entre:
      - el factor individual más alto presente,
      - cada combinación específica que se cumpla (su `result_level`),
      - cada umbral que se cumpla (su `escalates_to`).
    No importa el orden: siempre gana el riesgo más alto.
    """
    from apps.patients.models.question import RiskRule, RiskThreshold, FactorWindowRisk
    from apps.monitoring.models.questions import GeneralQuestion

    zero = {RiskLevel.LOW: 0, RiskLevel.MEDIUM: 0, RiskLevel.HIGH: 0}
    window = _resolve_window(hours_since_surgery)
    window_label = window.label if window else None

    yes_ids = [
        a.question_id for a in (answers or [])
        if a.answer and isinstance(a.question_id, int) and a.question_id > 0
    ]
    if not yes_ids:
        return RiskEvaluationResult(level=RiskLevel.LOW, counts=dict(zero), applied_rules=[], window=window_label)

    # Riesgo de cada factor en esta ventana (respaldo: associated_risk de la pregunta).
    risk_map: Dict[int, str] = {}
    if window:
        for fwr in FactorWindowRisk.objects.filter(window=window, question_id__in=yes_ids):
            risk_map[fwr.question_id] = fwr.risk_level
    for q in GeneralQuestion.objects.filter(id__in=yes_ids):
        risk_map.setdefault(q.id, q.associated_risk or RiskLevel.LOW)

    counts = dict(zero)
    yes_set = set()
    for qid in yes_ids:
        counts[risk_map.get(qid, RiskLevel.LOW)] += 1
        yes_set.add(qid)

    candidates: List[str] = []
    applied_rules: List[str] = []

    # Factor individual más alto presente.
    if counts[RiskLevel.HIGH] > 0:
        candidates.append(RiskLevel.HIGH)
    elif counts[RiskLevel.MEDIUM] > 0:
        candidates.append(RiskLevel.MEDIUM)
    else:
        candidates.append(RiskLevel.LOW)

    # Combinaciones específicas (todas sus preguntas en SÍ).
    for rule in RiskRule.objects.filter(is_active=True):
        if rule.question_ids and all(qid in yes_set for qid in rule.question_ids):
            candidates.append(rule.result_level)
            applied_rules.append(rule.name)

    # Umbrales de acumulación.
    for t in RiskThreshold.objects.filter(is_active=True):
        if counts.get(t.level, 0) >= t.min_count:
            candidates.append(t.escalates_to)
            applied_rules.append(f"{t.min_count}+ {t.level} → {t.escalates_to}")

    final = RiskLevel.LOW
    for c in candidates:
        final = _max_level(final, c)

    return RiskEvaluationResult(level=final, counts=counts, applied_rules=applied_rules, window=window_label)
