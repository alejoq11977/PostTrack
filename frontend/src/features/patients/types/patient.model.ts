export type MonitoringStatus = 'ACTIVE' | 'DISCHARGED';

export interface SurgicalMonitoring {
  id: number;
  surgery_type: string;
  surgery_date: string;
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