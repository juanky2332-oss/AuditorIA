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
      alert("Error al conectar con la IA. Verifica tu API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // CAMBIO IMPORTANTE: 'min-h-screen' y 'bg-slate-950' para fondo total.
    // Quitamos 'max-w' para que se expanda si quiere, o lo centramos verticalmente.
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
      
      {/* HEADER: Lo hacemos opcional o más discreto si quieres pantalla completa */}
      <div className="w-full max-w-6xl mb-8">
          <Header />
      </div>

      <main className="w-full max-w-6xl flex flex-col items-center">
        {!report ? (
          <div className="w-full flex justify-center">
             <InputSection onAuditRequest={handleAuditRequest} isLoading={isLoading} />
          </div>
        ) : (
          <div className="w-full animate-fade-in">
             <ReportSection report={report} materialName={materialName} />
             
             <div className="mt-8 text-center">
               <button 
                 onClick={() => setReport(null)}
                 className="text-slate-500 hover:text-white underline transition-colors"
               >
                 ← Realizar nueva auditoría
               </button>
             </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-slate-600 text-xs pb-4">
        <p>IndustrIA v2.0 • Powered by OpenAI GPT-4o & Vercel</p>
      </footer>
    </div>
  );
}

export default App;
