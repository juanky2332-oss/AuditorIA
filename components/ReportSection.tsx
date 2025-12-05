import React from 'react';
import jsPDF from 'jspdf';
import { FoodSafetyAuditReport, AuditResultType } from '../types';

interface ReportSectionProps {
  report: FoodSafetyAuditReport;
  materialName?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ report, materialName }) => {
  
  const generateProfessionalPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // --- FUNCIONES AUXILIARES DE ESTILO ---
    const drawSectionHeader = (title: string, y: number) => {
        doc.setFillColor(41, 128, 185); // Azul corporativo
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(title.toUpperCase(), margin + 3, y + 5.5);
        return y + 15;
    };

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };

    // --- 1. CABECERA ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Azul oscuro
    doc.text("IndustrIA", margin, yPos);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(127, 140, 141); // Gris
    doc.text("Auditoría Técnica de Seguridad Alimentaria", margin, yPos + 6);
    doc.text(`Ref: ${materialName || 'S/N'} • Fecha: ${new Date().toLocaleDateString()}`, pageWidth - margin - 60, yPos + 6);

    yPos += 15;
    doc.setDrawColor(189, 195, 199);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // --- 2. RESUMEN DEL MATERIAL ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(report.materialClassification, margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Familia: ${report.recommendedFamily}`, margin, yPos);
    yPos += 15;

    // --- 3. VEREDICTOS (TABLA VISUAL) ---
    yPos = drawSectionHeader("1. DICTAMEN DE APTITUD", yPos);

    // Función para dibujar celda de veredicto
    const drawVerdictBox = (label: string, verdict: string, x: number, y: number, width: number) => {
        const isApto = verdict.includes("APTO") && !verdict.includes("NO");
        const isNoApto = verdict.includes("NO_APTO");
        
        const color = isApto ? [39, 174, 96] : isNoApto ? [192, 57, 43] : [243, 156, 18]; // Verde, Rojo, Naranja
        
        doc.setDrawColor(200);
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y, width, 25, 'F');
        doc.rect(x, y, width, 25); // Borde
        
        // Etiqueta
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text(label, x + 5, y + 8);
        
        // Veredicto
        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(verdict.replace(/_/g, " "), x + 5, y + 18);
    };

    const boxWidth = (contentWidth / 2) - 5;
    drawVerdictBox("CONTACTO DIRECTO", report.directContactVerdict, margin, yPos, boxWidth);
    drawVerdictBox("CONTACTO INDIRECTO", report.indirectContactVerdict, margin + boxWidth + 10, yPos, boxWidth);
    
    yPos += 35;

    // --- 4. JUSTIFICACIÓN ---
    yPos = drawSectionHeader("2. JUSTIFICACIÓN TÉCNICA", yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50);
    const justifLines = doc.splitTextToSize(report.technicalJustification, contentWidth);
    doc.text(justifLines, margin, yPos);
    yPos += (justifLines.length * 5) + 10;

    // --- 5. RIESGOS Y DOCS ---
    checkPageBreak(60);
    yPos = drawSectionHeader("3. ANÁLISIS DE RIESGOS Y DOCUMENTACIÓN", yPos);

    // Riesgos
    doc.setFont("helvetica", "bold");
    doc.setTextColor(192, 57, 43); // Rojo
    doc.text("Riesgos Detectados:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    if(report.detectedRisks.length > 0) {
        report.detectedRisks.forEach(r => {
            doc.text(`• ${r}`, margin + 5, yPos);
            yPos += 5;
        });
    } else {
        doc.setTextColor(150);
        doc.text("No se detectaron riesgos críticos.", margin + 5, yPos);
        yPos += 5;
    }
    
    yPos += 5;
    
    // Docs
    doc.setFont("helvetica", "bold");
    doc.setTextColor(211, 84, 0); // Naranja
    doc.text("Documentación Faltante:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    if(report.missingDocumentation.length > 0) {
        report.missingDocumentation.forEach(d => {
            doc.text(`• ${d}`, margin + 5, yPos);
            yPos += 5;
        });
    } else {
        doc.setTextColor(150);
        doc.text("Documentación completa.", margin + 5, yPos);
        yPos += 5;
    }
    
    yPos += 10;

    // --- 6. RECOMENDACIONES ---
    checkPageBreak(50);
    yPos = drawSectionHeader("4. RECOMENDACIONES", yPos);
    
    doc.setTextColor(39, 174, 96); // Verde
    report.recommendations.forEach(rec => {
        const recLines = doc.splitTextToSize(`✓ ${rec}`, contentWidth);
        doc.text(recLines, margin, yPos);
        yPos += (recLines.length * 5) + 2;
    });
    
    yPos += 10;

    // --- 7. CONCLUSIÓN FINAL ---
    checkPageBreak(40);
    
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(11);
    const conclLines = doc.splitTextToSize(report.finalConclusion, contentWidth);
    doc.text(conclLines, margin, yPos);

    // Guardar
    doc.save(`IndustrIA_${materialName || 'Reporte'}.pdf`);
  };

  const getStatusColor = (result: AuditResultType) => {
    switch (result) {
      case AuditResultType.APTO: return 'text-emerald-400 border-emerald-500 bg-emerald-950/20';
      case AuditResultType.APTO_CONDICIONADO: return 'text-amber-400 border-amber-500 bg-amber-950/20';
      case AuditResultType.NO_APTO: return 'text-red-500 border-red-600 bg-red-950/20';
      case AuditResultType.NO_APLICA: return 'text-slate-400 border-slate-600 bg-slate-800/20';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Botón de Descarga */}
      <div className="flex justify-end animate-fade-in">
        <button 
            onClick={generateProfessionalPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Descargar Informe PDF
        </button>
      </div>

      {/* Visualización Web (Igual que antes) */}
      <div className="bg-[#0f172a] p-6 rounded-xl animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 border border-slate-800">
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Clasificación</h4>
                <div className="space-y-4">
                    <div><span className="block text-[10px] text-slate-500 font-mono mb-1">MATERIAL</span><span className="block text-sm text-white font-semibold">{report.materialClassification}</span></div>
                    <div><span className="block text-[10px] text-slate-500 font-mono mb-1">FAMILIA</span><span className="block text-xl text-blue-400 font-bold">{report.recommendedFamily}</span></div>
                </div>
            </div>
            <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center border-l-4 shadow-lg ${getStatusColor(report.directContactVerdict)}`}>
                <div className="w-full mb-2 font-mono text-[10px] text-slate-400 text-left uppercase tracking-wider">CONTACTO DIRECTO</div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">{report.directContactVerdict}</h3>
            </div>
            <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center border-l-4 shadow-lg ${getStatusColor(report.indirectContactVerdict)}`}>
                <div className="w-full mb-2 font-mono text-[10px] text-slate-400 text-left uppercase tracking-wider">CONTACTO INDIRECTO</div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">{report.indirectContactVerdict}</h3>
            </div>
        </div>
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 md:p-8 flex flex-col gap-6">
            <div className="border-b border-slate-700 pb-4"><h4 className="font-bold text-slate-200">INFORME TÉCNICO</h4><p className="text-xs text-slate-500 font-mono">ID: {materialName}</p></div>
            <div className="space-y-6 text-sm text-slate-300">
                <section><h5 className="text-xs font-bold text-blue-400 uppercase mb-2">Justificación</h5><p className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">{report.technicalJustification}</p></section>
                <div className="grid md:grid-cols-2 gap-6">
                    <section><h5 className="text-xs font-bold text-red-400 uppercase mb-2">Riesgos</h5><ul className="list-disc list-inside text-slate-400">{report.detectedRisks.map((r,i)=><li key={i}>{r}</li>)}</ul></section>
                    <section><h5 className="text-xs font-bold text-amber-400 uppercase mb-2">Documentación</h5><ul className="list-disc list-inside text-slate-400">{report.missingDocumentation.map((d,i)=><li key={i}>{d}</li>)}</ul></section>
                </div>
                <section><h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">Recomendaciones</h5><ul className="space-y-2">{report.recommendations.map((r,i)=><li key={i} className="flex gap-2 text-slate-300"><span className="text-emerald-500">✓</span> {r}</li>)}</ul></section>
                <div className="mt-8 pt-6 border-t border-slate-700"><h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Dictamen</h5><p className="text-slate-200 font-medium bg-blue-900/10 p-4 rounded">{report.finalConclusion}</p></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;
