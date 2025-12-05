import OpenAI from "openai";
import { AuditContext, FoodSafetyAuditReport } from "../types";

// 1. CAMBIO IMPORTANTE: Usar import.meta.env en lugar de process.env
// 2. CAMBIO IMPORTANTE: Permitir navegador (dangerouslyAllowBrowser)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  dangerouslyAllowBrowser: true 
});

const SYSTEM_INSTRUCTION = `
Eres IndustrIA, auditor técnico senior (4 Dic 2025).
Misión: Evaluar materiales para Contacto Directo vs Indirecto.
Salida: JSON estricto.
`;

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  // Validación ajustada a Vite
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error("Falta la API Key (VITE_OPENAI_API_KEY)");
  }

  const userContent: any[] = [
    {
      type: "text",
      text: `AUDITORÍA: ${context.materialName}. Uso: ${context.intendedUse}. Notas: ${context.technicalData}`
    }
  ];

  if (context.filesData && context.filesData.length > 0) {
    context.filesData.forEach((file) => {
      if (file.mimeType.startsWith('image/')) {
        userContent.push({
          type: "image_url",
          image_url: { url: file.data.startsWith('data:') ? file.data : `data:${file.mimeType};base64,${file.data}` },
        });
      }
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "audit_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              materialClassification: { type: "string" },
              recommendedFamily: { type: "string" },
              directContactVerdict: { type: "string", enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"] },
              indirectContactVerdict: { type: "string", enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"] },
              technicalJustification: { type: "string" },
              detectedRisks: { type: "array", items: { type: "string" } },
              missingDocumentation: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              finalConclusion: { type: "string" }
            },
            required: ["materialClassification", "recommendedFamily", "directContactVerdict", "indirectContactVerdict", "technicalJustification", "detectedRisks", "missingDocumentation", "recommendations", "finalConclusion"],
            additionalProperties: false
          }
        }
      }
    });

    return JSON.parse(completion.choices[0].message.content || "{}") as FoodSafetyAuditReport;
  } catch (error) {
    console.error("Error OpenAI:", error);
    throw error;
  }
};
