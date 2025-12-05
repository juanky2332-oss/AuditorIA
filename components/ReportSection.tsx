import React from 'react';
import { FoodSafetyAuditReport, AuditResultType } from '../types';

interface ReportSectionProps {
  report: FoodSafetyAuditReport;
  materialName?: string;
}

const ReportSection: React.FC<ReportSectionProps> = ({ report, materialName }) => {
  
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

  const handleDownloadPDF = () => {
    // @ts-ignore
    if (!window.html2pdf) {
        alert("Error cargando librería de PDF. Por favor refresque la página.");
        return;
    }

    const element = document.getElementById('audit-report-content');
    const opt = {
      margin: 10,
      filename: `Auditoria_${materialName || 'Material'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' }, // Maintain dark theme background
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Action Bar */}
      <div className="flex justify-end animate-fade-in">
        <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Descargar Informe PDF
        </button>
      </div>

      {/* Report Container (Target for PDF) */}
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