
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditContext, FoodSafetyAuditReport, AuditResultType } from "../types";

const API_KEY = process.env.API_KEY;

// Schema definition
const auditResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    materialClassification: {
      type: Type.STRING,
      description: "Resumen breve del tipo de material detectado.",
    },
    recommendedFamily: {
      type: Type.STRING,
      description: "Familia industrial recomendada (Ej: Tornillería, Transmisiones, Neumática, Juntas, EPP, Lubricantes).",
    },
    directContactVerdict: {
      type: Type.STRING,
      enum: [AuditResultType.APTO, AuditResultType.APTO_CONDICIONADO, AuditResultType.NO_APTO, AuditResultType.NO_APLICA],
      description: "Veredicto estricto para contacto DIRECTO con alimento.",
    },
    indirectContactVerdict: {
      type: Type.STRING,
      enum: [AuditResultType.APTO, AuditResultType.APTO_CONDICIONADO, AuditResultType.NO_APTO, AuditResultType.NO_APLICA],
      description: "Veredicto estricto para contacto INDIRECTO (accidental, entorno, encima de línea).",
    },
    technicalJustification: {
      type: Type.STRING,
      description: "Justificación técnica lógica basada en reglamentos explicando por qué se aprueba o rechaza cada tipo de contacto.",
    },
    detectedRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de riesgos reales detectados.",
    },
    missingDocumentation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Documentación necesaria que no se ha encontrado.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Acciones recomendadas sensatas.",
    },
    finalConclusion: {
      type: Type.STRING,
      description: "Conclusión profesional. Debe mencionar explícitamente si se autoriza la compra y bajo qué condiciones de uso (Directo vs Indirecto).",
    },
  },
  required: [
    "materialClassification",
    "recommendedFamily",
    "directContactVerdict",
    "indirectContactVerdict",
    "technicalJustification",
    "detectedRisks",
    "missingDocumentation",
    "recommendations",
    "finalConclusion"
  ],
};

const SYSTEM_INSTRUCTION = `
Eres **IndustrIA**, un auditor técnico senior especializado en ingeniería de materiales y seguridad alimentaria.
Estás ubicado en **Murcia, España**.
La fecha actual es **4 de Diciembre de 2025**.

**TU MISIÓN:**
Evaluar materiales industriales y determinar claramente su aptitud para dos escenarios distintos:
1. **CONTACTO DIRECTO:** El material toca físicamente el alimento.
2. **CONTACTO INDIRECTO:** El material está en el entorno, encima de líneas abiertas, o hay riesgo de contacto accidental.

**CRITERIOS DE AUDITORÍA:**
- Analiza Fichas Técnicas y Certificados.
- **DIRECTO:** Requiere cumplimiento estricto Reg. 1935/2004, Reg. 10/2011 (plásticos), FDA, migración global/específica declarada.
- **INDIRECTO:** Puede ser apto si cumple criterios de higiene general, ausencia de sustancias tóxicas volátiles, lubricantes H1, etc., aunque no tenga migración específica.
- **NO APTO:** Materiales sucios, oxidables, madera (salvo excepciones), vidrio no protegido, materiales sin trazabilidad.

**RESULTADOS POSIBLES:**
- **APTO:** Cumple normativa sobradamente.
- **APTO CONDICIONADO:** Cumple pero falta algún documento menor (ej: renovar DoC antigua) o requiere limpieza previa.
- **NO APTO:** Riesgo de seguridad alimentaria.
- **NO APLICA:** Para materiales que no tienen sentido en esa categoría (ej: un rodamiento interno sellado podría ser NO APLICA para directo, pero APTO para indirecto).

**IMPORTANTE:**
- Sé muy claro diferenciando los dos tipos de contacto.
- Si un material es para uso estructural lejos de la línea, será NO APTO (o NO APLICA) para directo, y APTO para indirecto/sin contacto.
- Clasifica la familia correctamente.

**TONO:**
Profesional, técnico, riguroso.
`;

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const parts: any[] = [];

  // Text Part
  const textPrompt = `
    SOLICITUD DE AUDITORÍA TÉCNICA - INDUSTRIA.
    
    Item/Material: ${context.materialName || "No especificado (Detectar del archivo)"}
    Uso declarado: ${context.intendedUse || "No especificado"}
    
    NOTAS DEL USUARIO:
    "${context.technicalData}"
    
    Analiza la documentación adjunta (si existe) y los datos proporcionados.
    Genera el dictamen diferenciado para Contacto Directo e Indirecto.
  `;

  parts.push({ text: textPrompt });

  // Files Part
  if (context.filesData && context.filesData.length > 0) {
    context.filesData.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: auditResponseSchema,
        temperature: 0, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FoodSafetyAuditReport;
    } else {
      throw new Error("No se pudo generar el reporte técnico.");
    }
  } catch (error) {
    console.error("IndustrIA Error:", error);
    throw error;
  }
};
