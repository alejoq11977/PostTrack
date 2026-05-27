"""
Pruebas de la evaluación de riesgo con ventanas temporales.

Se apoyan en los datos sembrados por la migración 0006_seed_clinical_rules
(las 3 ventanas, 21 factores con su riesgo por ventana, 9 combinaciones y los
umbrales de acumulación), que el test runner ejecuta sobre la BD de pruebas.
"""
from django.test import TestCase

from apps.monitoring.models.questions import GeneralQuestion
from apps.patients.services.risk_evaluation import evaluate_risk, AnswerInput


def qid(factor: str) -> int:
    """ID de la pregunta general activa para un factor sembrado."""
    return GeneralQuestion.objects.get(factor=factor, is_active=True).id


def answers(*factors, value=True):
    return [AnswerInput(question_id=qid(f), answer=value) for f in factors]


# Horas representativas de cada ventana (start_hour 0 / 49 / 121).
V1, V2, V3 = 10, 60, 200


class WindowResolutionTests(TestCase):
    def test_factor_risk_changes_with_window(self):
        """Hinchazón sube de BAJO (V1) a MEDIO (V2) a ALTO (V3)."""
        self.assertEqual(evaluate_risk(answers('Hinchazón'), hours_since_surgery=V1).level, 'LOW')
        self.assertEqual(evaluate_risk(answers('Hinchazón'), hours_since_surgery=V2).level, 'MEDIUM')
        self.assertEqual(evaluate_risk(answers('Hinchazón'), hours_since_surgery=V3).level, 'HIGH')

    def test_window_label_reported(self):
        res = evaluate_risk(answers('Hinchazón'), hours_since_surgery=V1)
        self.assertEqual(res.window, 'Ventana 1 (0-48h)')
        self.assertEqual(evaluate_risk(answers('Hinchazón'), hours_since_surgery=V2).window, 'Ventana 2 (49-120h)')
        self.assertEqual(evaluate_risk(answers('Hinchazón'), hours_since_surgery=V3).window, 'Ventana 3 (121h+)')

    def test_no_window_falls_back_to_associated_risk(self):
        """Sin horas, se usa associated_risk (= nivel de V1) y window es None."""
        res = evaluate_risk(answers('Hinchazón'), hours_since_surgery=None)
        self.assertEqual(res.level, 'LOW')
        self.assertIsNone(res.window)

    def test_no_yes_answers_is_low(self):
        res = evaluate_risk(answers('Hinchazón', value=False), hours_since_surgery=V3)
        self.assertEqual(res.level, 'LOW')
        self.assertEqual(res.counts, {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0})


class MaxCombineTests(TestCase):
    def test_single_high_factor_is_high(self):
        # Postración es ALTO en todas las ventanas.
        self.assertEqual(evaluate_risk(answers('Postración'), hours_since_surgery=V1).level, 'HIGH')

    def test_combination_overrides_individual_in_v1(self):
        """
        Fiebre (M en V1) + Supuración serosa (L en V1): el máximo individual es
        MEDIO, pero la combinación específica lo eleva a ALTO. Gana el máximo.
        """
        res = evaluate_risk(answers('Fiebre', 'Supuración serosa'), hours_since_surgery=V1)
        self.assertEqual(res.level, 'HIGH')
        self.assertIn('Fiebre + supuración serosa', res.applied_rules)

    def test_two_medium_threshold_escalates_to_high(self):
        """Dos factores MEDIO que NO forman combinación → umbral 2+ MEDIO eleva a ALTO."""
        # En V2: Náuseas = M, Lamido excesivo = M (no son una combinación entre sí).
        res = evaluate_risk(answers('Náuseas', 'Lamido excesivo'), hours_since_surgery=V2)
        self.assertEqual(res.counts['MEDIUM'], 2)
        self.assertEqual(res.level, 'HIGH')
        self.assertTrue(any('MEDIUM' in r for r in res.applied_rules))

    def test_two_low_threshold_escalates_to_medium_not_high(self):
        """Dos factores BAJO → umbral 2+ BAJO eleva a MEDIO (no a ALTO; hace falta 4+)."""
        # En V1: Hinchazón = L, Náuseas = L (no forman combinación entre sí).
        res = evaluate_risk(answers('Hinchazón', 'Náuseas'), hours_since_surgery=V1)
        self.assertEqual(res.counts['LOW'], 2)
        self.assertEqual(res.level, 'MEDIUM')

    def test_four_low_threshold_escalates_to_high(self):
        """Cuatro factores BAJO → umbral 4+ BAJO eleva a ALTO."""
        # En V1, todos BAJO y sin combinación entre sí.
        res = evaluate_risk(
            answers('Hinchazón', 'Náuseas', 'Decaimiento', 'Aislamiento'),
            hours_since_surgery=V1,
        )
        self.assertEqual(res.counts['LOW'], 4)
        self.assertEqual(res.level, 'HIGH')
