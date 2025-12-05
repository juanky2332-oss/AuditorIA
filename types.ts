
export enum AuditResultType {
  APTO = 'APTO',
  APTO_CONDICIONADO = 'APTO CONDICIONADO',
  NO_APTO = 'NO APTO',
  NO_APLICA = 'NO APLICA'
}

export enum MaterialContactType {
  DIRECTO = 'DIRECTO',
  INDIRECTO = 'INDIRECTO',
  AMBOS = 'DIRECTO E INDIRECTO',
  SIN_CONTACTO = 'SIN CONTACTO'
}

export interface FoodSafetyAuditReport {
  materialClassification: string; // Explicación general
  recommendedFamily: string;
  directContactVerdict: AuditResultType; // Veredicto específico DIRECTO
  indirectContactVerdict: AuditResultType; // Veredicto específico INDIRECTO
  technicalJustification: string;
  detectedRisks: string[];
  missingDocumentation: string[];
  recommendations: string[];
  finalConclusion: string;
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface AuditContext {
  materialName?: string;
  intendedUse: string;
  technicalData: string;
  filesData?: FileData[];
}
