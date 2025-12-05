// @ts-nocheck
import React, { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ReportSection from './components/ReportSection';
import { generateAuditReport } from './services/geminiService';
import { AuditContext, FoodSafetyAuditReport } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<FoodSafetyAuditReport | null>(null);
  const [materialName, setMaterialName] = useState<string>('');

  const handleAuditRequest = async (context: AuditContext) => {
    setIsLoading(true);
    setMaterialName(context.materialName);
    try {
      const result = await generateAuditReport(context);
      setReport(result);
    } catch (error) {
      console.error("Error auditoría:", error);
      alert("Error al conectar con la IA.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">

      {/* Header Full Width */}
      <Header />

      {/* Main Content Area - Wider and Responsive */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {!report ? (
          <div className="w-full max-w-5xl mx-auto">
            <InputSection onAuditRequest={handleAuditRequest} isLoading={isLoading} />
          </div>
        ) : (
          <div className="animate-fade-in space-y-8 w-full">
            <ReportSection report={report} materialName={materialName} />
            <div className="text-center py-6">
              <button
                onClick={() => setReport(null)}
                className="group text-slate-500 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2 mx-auto"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
                Nueva Auditoría
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer Full Width */}
      <footer className="w-full text-center text-slate-600 text-xs py-6 border-t border-slate-900 bg-slate-950/50 backdrop-blur-sm">
        <p>IndustrIA v2.0 • Powered by OpenAI • <span className="text-slate-700">Audit System</span></p>
      </footer>

    </div>
  );
}

export default App;
