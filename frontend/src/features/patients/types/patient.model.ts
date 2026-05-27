export type MonitoringStatus = 'ACTIVE' | 'DISCHARGED';

export interface SurgicalMonitoring {
  id: number;
  surgery_type: string;
  surgery_date: string;
  home_release_date: string | null;
  report_frequency_hours: number;
  status: MonitoringStatus;
}

export interface Patient {
  id: number;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  current_weight: number;
  photo_url?: string | null;
  monitorings: SurgicalMonitoring[];
}

export interface Question {
  id: number;
  text: string;
  instruction_text?: string | null;
}

export interface MonitoringForm {
  monitoring: {
    id: number;
    surgery_type: string;
    surgery_date: string;
    custom_questions: Question[];
  };
  general_questions: Question[];
}

export type ProcessingStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReportStatus = 'PENDING' | 'REVIEWED';

export interface VisualEvidence {
  id: number;
  image_url: string;
  created_at: string;
}

export interface Answer {
  id: number;
  question_text: string;
  value: string;
}

export interface ReportHistory {
  id: number;
  submitted_at: string;
  calculated_risk?: RiskLevel | null;
  validated_risk?: RiskLevel | null;
  review_status: ReportStatus;
  processing_status: ProcessingStatus;
  medical_notes?: string | null;
  answers: Answer[];
  evidences: VisualEvidence[];
}