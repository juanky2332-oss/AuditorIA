// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { AuditContext, FileData } from '../types';

interface InputSectionProps {
  onAuditRequest: (context: AuditContext) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAuditRequest, isLoading }) => {
  const [materialName, setMaterialName] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const binaryStr = reader.result;
        if (typeof binaryStr === 'string') {
             setFiles((prev) => [...prev, { mimeType: file.type, data: binaryStr }]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop,
      accept: { 'image/*': [], 'application/pdf': [] },
      maxFiles: 3
  });

  const handleRemoveFile = (index: number) => {
      setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!materialName && !intendedUse && !technicalData && files.length === 0) {
        alert("Por favor, completa al menos un campo o sube un archivo.");
        return;
    }
    onAuditRequest({ materialName, intendedUse, technicalData, filesData: files });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Cabecera del Panel */}
      <div className="bg-slate-950 px-8 py-6 border-b border-slate-800 flex items-center gap-4">
        <div className="bg-blue-600/20 p-3 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">Nueva Auditoría</h2>
            <p className="text-sm text-slate-400">Completa los datos para iniciar el análisis normativo</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        {/* SECCIÓN 1: DATOS BÁSICOS */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">1. Material / Referencia</label>
                <input 
                    type="text" 
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Ej. Banda Modular S-200, Junta EPDM..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">2. Uso Previsto</label>
                <input 
                    type="text" 
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    placeholder="Ej. Contacto directo con masas, Transporte de cajas..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                />
            </div>
        </div>

        {/* SECCIÓN 2: DOCUMENTACIÓN */}
        <div className="space-y-3">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Documentación Técnica (PDF / Imágenes)</label>
            
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 group ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800'}`}>
                <input {...getInputProps()} disabled={isLoading} />
                <div className="flex flex-col items-center gap-3 z-10 relative">
                    <div className="bg-slate-800 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <div>
                        <p className="font-bold text-slate-200 text-lg">Arrastra tus archivos aquí</p>
                        <p className="text-sm text-slate-500">Soporta PDF, JPG, PNG (Máx 3 archivos)</p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${file.mimeType === 'application/pdf' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                <span className="text-slate-300 text-sm font-medium truncate max-w-[200px]">
                                    {file.mimeType === 'application/pdf' ? `Documento PDF ${index + 1}` : `Imagen Técnica ${index + 1}`}
                                </span>
                            </div>
                            <button onClick={() => handleRemoveFile(index)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-red-400/10 rounded transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* SECCIÓN 3: DETALLES */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">4. Observaciones Adicionales</label>
            <textarea 
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                placeholder="Añade detalles importantes: temperaturas de trabajo, tipo de alimento, certificaciones previas..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                disabled={isLoading}
            />
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-5 rounded-xl font-bold text-base uppercase tracking-widest transition-all shadow-lg transform active:scale-[0.99]
                ${isLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
                }`}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">ircle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    PROCESANDO AUDITORÍA CON IA...
                </span>
            ) : (
                "INICIAR ANÁLISIS DE SEGURIDAD"
            )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
