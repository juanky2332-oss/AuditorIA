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
    // CAMBIO CLAVE: min-h-screen, w-full, flex para centrar.
    // QUITADO cualquier padding (p-4) de este contenedor principal.
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 flex flex-col items-center py-10">
      
      {/* Contenedor interno para limitar el ancho solo del contenido, no del fondo */}
      <div className="w-full max-w-5xl px-4 flex flex-col gap-8">
        
        <Header />

        <main className="w-full">
          {!report ? (
             <InputSection onAuditRequest={handleAuditRequest} isLoading={isLoading} />
          ) : (
            <div className="animate-fade-in space-y-8">
               <ReportSection report={report} materialName={materialName} />
               <div className="text-center">
                 <button 
                   onClick={() => setReport(null)}
                   className="text-slate-500 hover:text-white underline"
                 >
                   ← Nueva Auditoría
                 </button>
               </div>
            </div>
          )}
        </main>

        <footer className="text-center text-slate-600 text-xs py-4 border-t border-slate-900 mt-auto">
          <p>IndustrIA v2.0 • Powered by OpenAI</p>
        </footer>

      </div>
    </div>
  );
}

export default App;
