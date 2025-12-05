export enum AuditResultType {
  APTO = 'APTO',
  APTO_CONDICIONADO = 'APTO_CONDICIONADO', // Corregido: debe coincidir con el JSON Schema
  NO_APTO = 'NO_APTO',                     // Corregido
  NO_APLICA = 'NO_APLICA'                  // Corregido
}

export enum MaterialContactType {
  DIRECTO = 'DIRECTO',
  INDIRECTO = 'INDIRECTO',
  AMBOS = 'DIRECTO E INDIRECTO',
  SIN_CONTACTO = 'SIN CONTACTO'
}

export interface FoodSafetyAuditReport {
  materialClassification: string;
  recommendedFamily: string;
  directContactVerdict: AuditResultType;
  indirectContactVerdict: AuditResultType;
  technicalJustification: string;
  detectedRisks: string[];
  missingDocumentation: string[];
  recommendations: string[];
  finalConclusion: string;
}

export interface FileData {
  mimeType: string;
  data: string; // Base64 string
}

export interface AuditContext {
  materialName?: string;
  intendedUse: string;
  technicalData: string;
  filesData?: FileData[];
}
