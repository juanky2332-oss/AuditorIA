// @ts-nocheck
import React from 'react';
import jsPDF from 'jspdf';
import { FoodSafetyAuditReport, AuditResultType } from '../types';

interface ReportSectionProps {
  report: FoodSafetyAuditReport;
  materialName?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ report, materialName }) => {
  
  // --- LÓGICA DE GENERACIÓN DE PDF PROFESIONAL ---
  const generateProfessionalPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    let y = 20;

    // -- 1. Cabecera Corporativa --
    doc.setFillColor(15, 23, 42); // Color Slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("IndustrIA", margin, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("INFORME TÉCNICO DE APTITUD ALIMENTARIA", margin, 28);
    
    doc.text(`REF: ${materialName || 'S/N'}`, pageWidth - margin - 50, 20);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 28);

    y = 55; // Empezamos debajo de la cabecera

    // -- 2. Resumen del Material --
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICACIÓN DEL MATERIAL", margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    
    const classLines = doc.splitTextToSize(`Clasificación: ${report.materialClassification}`, maxLineWidth);
    doc.text(classLines, margin, y);
    y += (classLines.length * 6);

    const familyLines = doc.splitTextToSize(`Familia Recomendada: ${report.recommendedFamily}`, maxLineWidth);
    doc.text(familyLines, margin, y);
    y += (familyLines.length * 6) + 10;

    // -- 3. Veredictos (Cajas de Color) --
    const drawVerdict = (title, verdict, xPos) => {
        const isApto = verdict.includes("APTO") && !verdict.includes("NO");
        const isNoApto = verdict.includes("NO_APTO");
        const bgColor = isApto ? [220, 252, 231] : isNoApto ? [254, 226, 226] : [254, 243, 199]; // Fondos suaves
        const textColor = isApto ? [22, 101, 52] : isNoApto ? [153, 27, 27] : [146, 64, 14]; // Textos fuertes

        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(xPos, y, (maxLineWidth / 2) - 5, 25, 'F');
        doc.setDrawColor(200);
        doc.rect(xPos, y, (maxLineWidth / 2) - 5, 25);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(title, xPos + 5, y + 8);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(verdict.replace(/_/g, " "), xPos + 5, y + 18);
    };

    drawVerdict("CONTACTO DIRECTO", report.directContactVerdict, margin);
    drawVerdict("CONTACTO INDIRECTO", report.indirectContactVerdict, margin + (maxLineWidth / 2) + 5);
    y += 35;

    // -- 4. Análisis Técnico --
    const addSection = (title, content) => {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(title, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);
        
        const lines = doc.splitTextToSize(content, maxLineWidth);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 10;
    };

    addSection("2. JUSTIFICACIÓN TÉCNICA", report.technicalJustification);

    // -- 5. Listas (Riesgos y Recomendaciones) --
    const addList = (title, items, colorRGB) => {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorRGB[0], colorRGB[1], colorRGB[2]);
        doc.text(title, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);

        if(items.length === 0) {
            doc.text("Ninguno detectado.", margin, y);
            y += 10;
        } else {
            items.forEach(item => {
                const itemText = `• ${item}`;
                const lines = doc.splitTextToSize(itemText, maxLineWidth);
                
                if (y + (lines.length * 5) > pageHeight - 20) { doc.addPage(); y = 20; }
                
                doc.text(lines, margin, y);
                y += (lines.length * 5) + 2;
            });
            y += 10;
        }
    };

    addList("3. RIESGOS DETECTADOS", report.detectedRisks, [220, 38, 38]); // Rojo
    addList("4. DOCUMENTACIÓN FALTANTE", report.missingDocumentation, [234, 88, 12]); // Naranja
    addList("5. RECOMENDACIONES", report.recommendations, [22, 163, 74]); // Verde

    // -- 6. Conclusión Final --
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setFont("helvetica", "italic");
    doc.setTextColor(30);
    const conclLines = doc.splitTextToSize(report.finalConclusion, maxLineWidth);
    doc.text(conclLines, margin, y);

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Generado por IndustrIA`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Informe_Auditoria_${materialName || 'Material'}.pdf`);
  };

  // --- RENDERIZADO WEB ---
  const getStatusStyle = (verdict) => {
      if (verdict.includes("NO_APTO")) return "bg-red-500/10 text-red-400 border-red-500/50";
      if (verdict.includes("CONDICIONADO")) return "bg-amber-500/10 text-amber-400 border-amber-500/50";
      if (verdict.includes("APTO")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/50";
      return "bg-slate-800 text-slate-400 border-slate-700";
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Cabecera de Resultados */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div>
                <h2 className="text-2xl font-bold text-white">Resultados de la Auditoría</h2>
                <p className="text-slate-400">Análisis completado para: <span className="text-blue-400 font-mono">{materialName}</span></p>
            </div>
            <button 
                onClick={generateProfessionalPDF}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:-translate-y-1"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                DESCARGAR INFORME PDF
            </button>
        </div>

        {/* Grid de Veredictos */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-8 rounded-2xl border-2 flex flex-col items-center text-center ${getStatusStyle(report.directContactVerdict)}`}>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">CONTACTO DIRECTO</span>
                <h3 className="text-3xl font-extrabold">{report.directContactVerdict.replace(/_/g, " ")}</h3>
            </div>
            <div className={`p-8 rounded-2xl border-2 flex flex-col items-center text-center ${getStatusStyle(report.indirectContactVerdict)}`}>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">CONTACTO INDIRECTO</span>
                <h3 className="text-3xl font-extrabold">{report.indirectContactVerdict.replace(/_/g, " ")}</h3>
            </div>
        </div>

        {/* Panel Detallado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">
            
            <section>
                <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Justificación Técnica</h4>
                <p className="text-slate-300 leading-relaxed text-justify">{report.technicalJustification}</p>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
                    <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Riesgos Detectados
                    </h4>
                    {report.detectedRisks.length > 0 ? (
                        <ul className="space-y-2 text-slate-300 list-disc list-inside">
                            {report.detectedRisks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    ) : <span className="text-slate-500 italic">Sin riesgos críticos.</span>}
                </section>

                <section className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
                    <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Documentación Pendiente
                    </h4>
                    {report.missingDocumentation.length > 0 ? (
                        <ul className="space-y-2 text-slate-300 list-disc list-inside">
                            {report.missingDocumentation.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    ) : <span className="text-slate-500 italic">Documentación completa.</span>}
                </section>
            </div>

            <section className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-xl">
                <h4 className="text-emerald-400 font-bold mb-4">Recomendaciones de Mejora</h4>
                <ul className="space-y-3">
                    {report.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-200">
                            <span className="text-emerald-500 mt-1">✓</span>
                            {rec}
                        </li>
                    ))}
                </ul>
            </section>

            <div className="mt-8 pt-8 border-t border-slate-800">
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Conclusión Final del Auditor</h4>
                <p className="text-lg font-medium text-white italic">"{report.finalConclusion}"</p>
            </div>

        </div>
    </div>
  );
};

export default ReportSection;
