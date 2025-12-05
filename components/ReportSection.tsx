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
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 15;

    // ===== CABECERA =====
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.setFont("helvetica", "bold");
    doc.text("IndustrIA", margin, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Auditoría Técnica de Seguridad Alimentaria", margin, yPos);
    
    yPos += 2;
    doc.setFontSize(9);
    doc.text(`Murcia, España • ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);

    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // ===== SECCIÓN 1: INFORMACIÓN GENERAL =====
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("1. INFORMACIÓN DEL MATERIAL", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    
    const infoLines = [
      `Material Detectado: ${report.materialClassification}`,
      `Familia Recomendada: ${report.recommendedFamily}`,
      `ID Auditoría: ${materialName || 'No especificado'}`,
      `Generado: ${new Date().toLocaleString('es-ES')}`
    ];
    
    infoLines.forEach(line => {
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });

    yPos += 5;

    // ===== SECCIÓN 2: VEREDICTOS =====
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("2. DICTAMEN DE APTITUD", margin, yPos);
    yPos += 7;

    // Caja Contacto Directo
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, yPos - 3, contentWidth, 12, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(margin, yPos - 3, contentWidth, 12);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("CONTACTO DIRECTO (Alimento):", margin + 3, yPos + 2);
    
    // Color del veredicto
    const directColor = report.directContactVerdict === AuditResultType.APTO 
      ? [0, 150, 0] 
      : report.directContactVerdict === AuditResultType.NO_APTO 
      ? [200, 0, 0]
      : [200, 120, 0];
    
    doc.setTextColor(...directColor);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(11);
    doc.text(report.directContactVerdict, pageWidth - margin - 40, yPos + 2);
    
    yPos += 15;

    // Caja Contacto Indirecto
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, yPos - 3, contentWidth, 12, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(margin, yPos - 3, contentWidth, 12);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("CONTACTO INDIRECTO (Entorno):", margin + 3, yPos + 2);
    
    const indirectColor = report.indirectContactVerdict === AuditResultType.APTO 
      ? [0, 150, 0]
      : report.indirectContactVerdict === AuditResultType.NO_APTO
      ? [200, 0, 0]
      : [200, 120, 0];
    
    doc.setTextColor(...indirectColor);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(11);
    doc.text(report.indirectContactVerdict, pageWidth - margin - 40, yPos + 2);
    
    yPos += 18;

    // ===== SECCIÓN 3: JUSTIFICACIÓN TÉCNICA =====
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("3. JUSTIFICACIÓN TÉCNICA", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    
    const justificationLines = doc.splitTextToSize(report.technicalJustification, contentWidth - 5);
    doc.text(justificationLines, margin + 3, yPos);
    yPos += (justificationLines.length * 4) + 8;

    // Verificar si necesitamos nueva página
    if (yPos > 200) {
      doc.addPage();
      yPos = 15;
    }

    // ===== SECCIÓN 4: RIESGOS =====
    doc.setFontSize(12);
    doc.setTextColor(200, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("4. RIESGOS DETECTADOS", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    if (report.detectedRisks.length > 0) {
      report.detectedRisks.forEach(risk => {
        const riskLines = doc.splitTextToSize(`• ${risk}`, contentWidth - 10);
        doc.text(riskLines, margin + 5, yPos);
        yPos += (riskLines.length * 4);
      });
    } else {
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text("No se detectaron riesgos críticos.", margin + 5, yPos);
      yPos += 4;
    }

    yPos += 8;

    // ===== SECCIÓN 5: DOCUMENTACIÓN FALTANTE =====
    doc.setFontSize(12);
    doc.setTextColor(200, 120, 0);
    doc.setFont("helvetica", "bold");
    doc.text("5. DOCUMENTACIÓN FALTANTE", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    if (report.missingDocumentation.length > 0) {
      report.missingDocumentation.forEach(doc_item => {
        const docLines = doc.splitTextToSize(`• ${doc_item}`, contentWidth - 10);
        doc.text(docLines, margin + 5, yPos);
        yPos += (docLines.length * 4);
      });
    } else {
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text("Documentación completa.", margin + 5, yPos);
      yPos += 4;
    }

    yPos += 8;

    // ===== SECCIÓN 6: RECOMENDACIONES =====
    if (yPos > 220) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 150, 0);
    doc.setFont("helvetica", "bold");
    doc.text("6. RECOMENDACIONES", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    report.recommendations.forEach(rec => {
      const recLines = doc.splitTextToSize(`✓ ${rec}`, contentWidth - 10);
      doc.text(recLines, margin + 5, yPos);
      yPos += (recLines.length * 4);
    });

    yPos += 10;

    // ===== SECCIÓN 7: CONCLUSIÓN FINAL =====
    if (yPos > 220) {
      doc.addPage();
      yPos = 15;
    }

    doc.setFillColor(230, 245, 250);
    doc.rect(margin, yPos - 2, contentWidth, 35, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos - 2, contentWidth, 35);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("DICTAMEN FINAL DEL AUDITOR", margin + 3, yPos + 2);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    
    const conclusionLines = doc.splitTextToSize(report.finalConclusion, contentWidth - 8);
    doc.text(conclusionLines, margin + 3, yPos + 8);

    yPos += 40;

    // ===== PIE DE PÁGINA =====
    yPos = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    doc.text("Documento generado automáticamente por IndustrIA • Auditoría Técnica Profesional", margin, yPos + 2);
    doc.text("Este informe debe ser revisado por un responsable de calidad antes de su distribución", margin, yPos + 6);

    // Guardar
    const fileName = `IndustrIA_Auditoria_${materialName || 'Material'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getStatusColor = (result: AuditResultType) => {
    switch (result) {
      case AuditResultType.APTO:
        return 'text-emerald-400 border-emerald-500 bg-emerald-950/20';
      case AuditResultType.APTO_CONDICIONADO:
        return 'text-amber-400 border-amber-500 bg-amber-950/20';
      case AuditResultType.NO_APTO:
        return 'text-red-500 border-red-600 bg-red-950/20';
      case AuditResultType.NO_APLICA:
        return 'text-slate-400 border-slate-600 bg-slate-800/20';
      default:
        return 'text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-end animate-fade-in">
        <button 
            onClick={generateProfessionalPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Descargar Informe PDF
        </button>
      </div>

      {/* Report Container - Visualización en pantalla (modo oscuro) */}
      <div id="audit-report-content" className="bg-[#0f172a] p-6 rounded-xl animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 border border-slate-800">
        
        {/* Col 1: Verdict & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* HEADER CARD */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Clasificación</h4>
                <div className="space-y-4">
                    <div>
                        <span className="block text-[10px] text-slate-500 font-mono mb-1">MATERIAL DETECTADO</span>
                        <span className="block text-sm text-white font-semibold">{report.materialClassification}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-500 font-mono mb-1">FAMILIA RECOMENDADA</span>
                        <span className="block text-xl text-blue-400 font-bold">{report.recommendedFamily}</span>
                    </div>
                </div>
            </div>

            {/* VERDICT CARD: DIRECT CONTACT */}
            <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center border-l-4 shadow-lg ${getStatusColor(report.directContactVerdict)}`}>
                <div className="w-full mb-2 font-mono text-[10px] text-slate-400 text-left uppercase tracking-wider">
                    CONTACTO DIRECTO (ALIMENTO)
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {report.directContactVerdict}
                </h3>
                {report.directContactVerdict === AuditResultType.APTO && (
                    <div className="text-[10px] text-emerald-400 font-mono">✓ Apto para tocar producto</div>
                )}
            </div>

            {/* VERDICT CARD: INDIRECT CONTACT */}
            <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center border-l-4 shadow-lg ${getStatusColor(report.indirectContactVerdict)}`}>
                <div className="w-full mb-2 font-mono text-[10px] text-slate-400 text-left uppercase tracking-wider">
                    CONTACTO INDIRECTO (ENTORNO)
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {report.indirectContactVerdict}
                </h3>
                {report.indirectContactVerdict === AuditResultType.APTO && (
                    <div className="text-[10px] text-emerald-400 font-mono">✓ Apto para zona de fábrica</div>
                )}
            </div>

        </div>

        {/* Col 2 & 3: Detailed Report */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 md:p-8 flex flex-col gap-6">
            
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <div className="p-2 bg-slate-800 rounded">
                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                    <h4 className="font-bold text-slate-200">INFORME TÉCNICO DETALLADO</h4>
                    <p className="text-xs text-slate-500 font-mono">ID: {materialName || 'S/N'} • {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300">
                
                {/* Tech Justification */}
                <section>
                    <h5 className="text-xs font-bold text-blue-400 uppercase mb-2">Justificación Técnica</h5>
                    <p className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 leading-relaxed text-slate-300 font-mono text-xs md:text-sm">
                        {report.technicalJustification}
                    </p>
                </section>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Risks */}
                    <section>
                        <h5 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Riesgos Detectados
                        </h5>
                        {report.detectedRisks.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-slate-400">
                                {report.detectedRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                            </ul>
                        ) : (
                            <p className="text-slate-500 italic">No se detectaron riesgos críticos.</p>
                        )}
                    </section>

                    {/* Docs */}
                    <section>
                        <h5 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Documentación Faltante
                        </h5>
                        {report.missingDocumentation.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 text-slate-400">
                                {report.missingDocumentation.map((doc, i) => <li key={i}>{doc}</li>)}
                            </ul>
                        ) : (
                            <p className="text-slate-500 italic">Documentación completa.</p>
                        )}
                    </section>
                </div>

                {/* Recommendations */}
                <section>
                    <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">Recomendaciones</h5>
                    <ul className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 text-slate-300 bg-slate-900/30 p-2 rounded border-l-2 border-emerald-500/50">
                                <span className="text-emerald-500 font-bold">✓</span> {rec}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Final Conclusion */}
                <div className="mt-8 pt-6 border-t border-slate-700">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Dictamen Final del Auditor</h5>
                    <p className="text-slate-200 font-medium leading-relaxed bg-blue-900/10 p-4 rounded border border-blue-900/30">
                        {report.finalConclusion}
                    </p>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;
