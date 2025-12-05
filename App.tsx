import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ReportSection from './components/ReportSection';
import { AuditContext, FoodSafetyAuditReport } from './types';
import { generateAuditReport } from './services/geminiService';

function App() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // Estado para la barra
  const [report, setReport] = useState<FoodSafetyAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [materialName, setMaterialName] = useState('');

  // EFECTO PARA SIMULAR PROGRESO REALISTA
  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(10); // Empieza en 10%
      interval = setInterval(() => {
        setProgress((prev) => {
          // Sube rápido al principio, luego se frena en el 85%
          if (prev < 60) return prev + 5;
          if (prev < 85) return prev + 1;
          return prev; // Se queda esperando en 85-90%
        });
      }, 500);
    } else {
      setProgress(100); // Al terminar, 100%
      // Resetear barra después de un momento
      setTimeout(() => setProgress(0), 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAuditRequest = async (context: AuditContext) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setMaterialName(context.materialName || 'Material');

    try {
      const result = await generateAuditReport(context);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error desconocido al generar el informe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />

      <main className="container mx-auto px-4 py-12 flex flex-col items-center gap-12">
        
        {!report && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <InputSection 
                onAuditRequest={handleAuditRequest} 
                isLoading={loading} 
            />
          </div>
        )}

        {/* BARRA DE PROGRESO MEJORADA */}
        {loading && (
          <div className="w-full max-w-md space-y-3 animate-pulse">
            <div className="flex justify-between text-xs font-mono text-blue-400 uppercase">
                <span>Analizando documentación...</span>
                <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-500 animate-bounce mt-2">
                Consultando normativas FDA / UE 10/2011...
            </p>
          </div>
        )}

        {error && (
          <div className="w-full max-w-2xl bg-red-950/30 border border-red-800/50 text-red-300 p-4 rounded-lg text-sm flex items-center gap-3 animate-shake">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {report && (
            <ReportSection report={report} materialName={materialName} />
        )}

      </main>
    </div>
  );
}

export default App;
