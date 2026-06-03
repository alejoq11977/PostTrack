import { useState, useCallback } from 'react';
import { patientsService, AnswerInput, RiskEvaluationResult } from '../api/patients.service';

interface UseRiskEvaluationReturn {
  evaluate: (answers: AnswerInput[], monitoringId?: number) => Promise<RiskEvaluationResult>;
  result: RiskEvaluationResult | null;
  isLoading: boolean;
  error: string | null;
}

export const useRiskEvaluation = (): UseRiskEvaluationReturn => {
  const [result, setResult] = useState<RiskEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async (answers: AnswerInput[], monitoringId?: number): Promise<RiskEvaluationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const evaluationResult = await patientsService.evaluateRisk(answers, monitoringId);
      setResult(evaluationResult);
      return evaluationResult;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al evaluar el riesgo';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    evaluate,
    result,
    isLoading,
    error
  };
};