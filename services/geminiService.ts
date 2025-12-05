// @ts-ignore
import OpenAI from "openai";
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import { AuditContext, FoodSafetyAuditReport } from "../types";

// Configuración del Worker de PDF.js (CDN para evitar problemas de build)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  dangerouslyAllowBrowser: true 
});

const SYSTEM_INSTRUCTION = `
Eres **IndustrIA**, auditor técnico senior (4 Dic 2025).
Misión: Evaluar materiales y su aptitud alimentaria.

**RESULTADOS VÁLIDOS (Estrictos):**
- APTO
- APTO_CONDICIONADO
- NO_APTO
- NO_APLICA

IMPORTANTE: Devuelve JSON estricto siguiendo el esquema.
`;

// Función auxiliar: Convertir PDF a Imágenes
async function convertPdfToImages(pdfBase64: string): Promise<string[]> {
  try {
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    const images: string[] = [];
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.8)); 
      }
    }
    return images;
  } catch (error) {
    console.error("Error PDF:", error);
    return [];
  }
}

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error("Falta la API Key");
  }

  const userContent: any[] = [
    {
      type: "text",
      text: `AUDITORÍA: ${context.materialName}. Uso: ${context.intendedUse}. Notas: ${context.technicalData}. Analiza adjuntos.`
    }
  ];

  if (context.filesData && context.filesData.length > 0) {
    for (const file of context.filesData) {
      if (file.mimeType.startsWith('image/')) {
        userContent.push({
          type: "image_url",
          image_url: { url: file.data.startsWith('data:') ? file.data : `data:${file.mimeType};base64,${file.data}` },
        });
      } else if (file.mimeType === 'application/pdf') {
        const pdfImages = await convertPdfToImages(file.data);
        pdfImages.forEach(img => userContent.push({ type: "image_url", image_url: { url: img } }));
      }
    }
  }

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
};
