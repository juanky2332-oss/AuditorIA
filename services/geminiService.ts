// services/openaiService.ts (o sobrescribe geminiService.ts)
import OpenAI from "openai";
import { AuditContext, FoodSafetyAuditReport, AuditResultType } from "../types";

// Inicializar cliente. Asegúrate de tener OPENAI_API_KEY en Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
Eres **IndustrIA**, un auditor técnico senior especializado en seguridad alimentaria en Murcia, España (Fecha: 4 Dic 2025).

TU MISIÓN:
Evaluar materiales para:
1. **CONTACTO DIRECTO** (toca alimento). Exige Reg. 1935/2004, 10/2011, FDA.
2. **CONTACTO INDIRECTO** (entorno/accidental). Acepta higiene general, lubricantes H1, etc.

RESULTADOS: APTO, APTO CONDICIONADO, NO APTO, NO APLICA.
Sé riguroso. Si es estructural lejos de línea -> NO APLICA directo / APTO indirecto.
`;

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in environment variables");
  }

  // 1. Construir el mensaje de usuario con texto e imágenes
  const userContent: any[] = [
    {
      type: "text",
      text: `
      SOLICITUD DE AUDITORÍA:
      Item: ${context.materialName || "Detectar de imagen"}
      Uso: ${context.intendedUse || "No especificado"}
      Notas Técnicas: "${context.technicalData}"
      
      Analiza las imágenes adjuntas (si las hay) y los datos. Genera dictamen JSON.`
    }
  ];

  // 2. Adjuntar imágenes si existen (OpenAI solo acepta imágenes en base64 data-url)
  if (context.filesData && context.filesData.length > 0) {
    context.filesData.forEach((file) => {
      // FILTRO: OpenAI Vision solo soporta imágenes (jpeg, png, webp, gif). 
      // Si envías un PDF aquí, fallará.
      const isImage = file.mimeType.startsWith('image/');
      
      if (isImage) {
        userContent.push({
          type: "image_url",
          image_url: {
            // Asegúrate que file.data sea base64 puro. Añadimos el prefijo si falta.
            url: file.data.startsWith('data:') 
              ? file.data 
              : `data:${file.mimeType};base64,${file.data}`,
          },
        });
      } else {
        console.warn("Omitiendo archivo no-imagen (OpenAI no lee PDFs nativamente en este modo):", file.mimeType);
        userContent.push({
          type: "text",
          text: `[NOTA: Se adjuntó un archivo ${file.mimeType} que no se puede visualizar directamente. Basar análisis en los metadatos proporcionados].`
        });
      }
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Usar gpt-4o para mejor visión
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userContent },
      ],
      temperature: 0,
      // "json_schema" garantiza que la respuesta cumpla tu estructura EXACTA
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "audit_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              materialClassification: { type: "string", description: "Resumen del material" },
              recommendedFamily: { type: "string", description: "Familia industrial" },
              directContactVerdict: { 
                type: "string", 
                enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"] 
              },
              indirectContactVerdict: { 
                type: "string", 
                enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"] 
              },
              technicalJustification: { type: "string" },
              detectedRisks: { 
                type: "array", 
                items: { type: "string" } 
              },
              missingDocumentation: { 
                type: "array", 
                items: { type: "string" } 
              },
              recommendations: { 
                type: "array", 
                items: { type: "string" } 
              },
              finalConclusion: { type: "string" }
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
            additionalProperties: false
          }
        }
      }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Respuesta vacía de OpenAI");
    
    return JSON.parse(content) as FoodSafetyAuditReport;

  } catch (error) {
    console.error("Error en servicio OpenAI:", error);
    throw error;
  }
};
