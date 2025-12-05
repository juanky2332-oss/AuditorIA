import OpenAI from "openai";
import * as pdfjsLib from 'pdfjs-dist';
import { AuditContext, FoodSafetyAuditReport } from "../types";

// Configuración del Worker de PDF.js para navegador
// Usamos un CDN público para evitar problemas de configuración de build
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  dangerouslyAllowBrowser: true 
});

const SYSTEM_INSTRUCTION = `
Eres **IndustrIA**, un auditor técnico senior especializado en ingeniería de materiales y seguridad alimentaria.
Estás ubicado en **Murcia, España**.
La fecha actual es **4 de Diciembre de 2025**.

**TU MISIÓN:**
Evaluar materiales industriales y determinar claramente su aptitud para dos escenarios distintos basándote en la documentación visual (imágenes o PDFs convertidos) y datos aportados:
1. **CONTACTO DIRECTO:** El material toca físicamente el alimento.
2. **CONTACTO INDIRECTO:** El material está en el entorno, encima de líneas abiertas, o hay riesgo de contacto accidental.

**CRITERIOS DE AUDITORÍA:**
- Analiza Fichas Técnicas y Certificados visualmente.
- **DIRECTO:** Requiere cumplimiento estricto Reg. 1935/2004, Reg. 10/2011 (plásticos), FDA, migración global/específica declarada.
- **INDIRECTO:** Puede ser apto si cumple criterios de higiene general, ausencia de sustancias tóxicas volátiles, lubricantes H1, etc., aunque no tenga migración específica.
- **NO APTO:** Materiales sucios, oxidables, madera (salvo excepciones), vidrio no protegido, materiales sin trazabilidad.

**RESULTADOS POSIBLES:**
- **APTO:** Cumple normativa sobradamente.
- **APTO CONDICIONADO:** Cumple pero falta algún documento menor o requiere limpieza previa.
- **NO APTO:** Riesgo de seguridad alimentaria.
- **NO APLICA:** Para materiales que no tienen sentido en esa categoría.

**IMPORTANTE:**
- Sé muy claro diferenciando los dos tipos de contacto.
- Clasifica la familia correctamente.
- Devuelve JSON estricto.
`;

// Función auxiliar: Convertir PDF (base64) a lista de Imágenes (base64)
async function convertPdfToImages(pdfBase64: string): Promise<string[]> {
  try {
    // Limpiar cabecera si existe (data:application/pdf;base64,...)
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    
    // Decodificar base64 a binario
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

    // Cargar documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    const images: string[] = [];

    // Procesar solo las primeras 3 páginas para no saturar la API
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Escala 1.5 para buena legibilidad
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        // Exportar a JPG comprimido
        images.push(canvas.toDataURL('image/jpeg', 0.8)); 
      }
    }
    return images;
  } catch (error) {
    console.error("Error crítico convirtiendo PDF:", error);
    return [];
  }
}

export const generateAuditReport = async (context: AuditContext): Promise<FoodSafetyAuditReport> => {
  // Validación de seguridad
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error("Falta la API Key (VITE_OPENAI_API_KEY)");
  }

  const userContent: any[] = [
    {
      type: "text",
      text: `SOLICITUD DE AUDITORÍA.
      
      Material: ${context.materialName || "Detectar de archivos"}
      Uso Declarado: ${context.intendedUse || "No especificado"}
      Notas del Usuario: "${context.technicalData}"
      
      INSTRUCCIONES:
      Analiza las imágenes adjuntas (que pueden ser fotos del material o páginas de su ficha técnica). 
      Extrae toda la información regulatoria posible (FDA, EC 1935/2004, Logos, Temperaturas).
      Emite tu veredicto en JSON.`
    }
  ];

  // Procesar archivos adjuntos
  if (context.filesData && context.filesData.length > 0) {
    for (const file of context.filesData) {
      
      // CASO A: Es una IMAGEN (JPG, PNG, WEBP)
      if (file.mimeType.startsWith('image/')) {
        userContent.push({
          type: "image_url",
          image_url: { 
            url: file.data.startsWith('data:') ? file.data : `data:${file.mimeType};base64,${file.data}` 
          },
        });
      } 
      
      // CASO B: Es un PDF -> Convertir a imágenes y adjuntar
      else if (file.mimeType === 'application/pdf') {
        console.log("Detectado PDF, iniciando conversión a imágenes...");
        const pdfImages = await convertPdfToImages(file.data);
        
        if (pdfImages.length > 0) {
            pdfImages.forEach((imgData, index) => {
                userContent.push({
                    type: "text",
                    text: `--- Página ${index + 1} del PDF adjunto ---`
                });
                userContent.push({
                    type: "image_url",
                    image_url: { url: imgData }
                });
            });
        } else {
             userContent.push({ 
               type: "text", 
               text: "[ADVERTENCIA: Se adjuntó un PDF pero no se pudo visualizar. Auditar solo con los datos de texto proporcionados.]" 
             });
        }
      }
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Usamos GPT-4o por su excelente capacidad de visión OCR
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
              materialClassification: { 
                type: "string", 
                description: "Resumen breve del tipo de material detectado." 
              },
              recommendedFamily: { 
                type: "string", 
                description: "Familia industrial (Ej: Tornillería, Transmisiones, Juntas, EPP)." 
              },
              directContactVerdict: { 
                type: "string", 
                enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"],
                description: "Veredicto estricto contacto DIRECTO."
              },
              indirectContactVerdict: { 
                type: "string", 
                enum: ["APTO", "APTO_CONDICIONADO", "NO_APTO", "NO_APLICA"],
                description: "Veredicto estricto contacto INDIRECTO."
              },
              technicalJustification: { 
                type: "string", 
                description: "Justificación técnica basada en reglamentos encontrados en los docs." 
              },
              detectedRisks: { 
                type: "array", 
                items: { type: "string" },
                description: "Lista de riesgos reales."
              },
              missingDocumentation: { 
                type: "array", 
                items: { type: "string" },
                description: "Documentación que falta."
              },
              recommendations: { 
                type: "array", 
                items: { type: "string" },
                description: "Acciones recomendadas."
              },
              finalConclusion: { 
                type: "string", 
                description: "Conclusión profesional final." 
              }
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
