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
    // AQUÍ ESTÁ EL CAMBIO: 'mx-auto' para centrar y 'w-full max-w-3xl' para controlar el ancho
    <div className="w-full max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      
      <div className="bg-slate-950 px-8 py-6 border-b border-slate-800 flex items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-white">Nueva Auditoría</h2>
            <p className="text-sm text-slate-400">Completa los datos para iniciar el análisis normativo</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">1. Material / Referencia</label>
                <input 
                    type="text" 
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Ej. Banda Modular S-200"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">2. Uso Previsto</label>
                <input 
                    type="text" 
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    placeholder="Ej. Contacto directo"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    disabled={isLoading}
                />
            </div>
        </div>

        <div className="space-y-3">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Documentación Técnica</label>
            
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 group ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-400 hover:bg-slate-800'}`}>
                <input {...getInputProps()} disabled={isLoading} />
                <div className="flex flex-col items-center gap-3 z-10 relative">
                    <p className="font-bold text-slate-200 text-lg">Arrastra tus archivos aquí</p>
                    <p className="text-sm text-slate-500">Soporta PDF, JPG, PNG</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800 px-4 py-3 rounded border border-slate-700/50">
                            <span className="text-slate-300 text-sm font-medium truncate max-w-[200px]">
                                {file.mimeType === 'application/pdf' ? `Documento PDF ${index + 1}` : `Imagen ${index + 1}`}
                            </span>
                            <button onClick={() => handleRemoveFile(index)} className="text-red-400 text-xs font-bold hover:underline">
                                ELIMINAR
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">4. Observaciones</label>
            <textarea 
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                placeholder="Añade detalles importantes..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                disabled={isLoading}
            />
        </div>

        <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-5 rounded-xl font-bold text-base uppercase tracking-widest transition-all shadow-lg
                ${isLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
        >
            {isLoading ? "PROCESANDO..." : "INICIAR ANÁLISIS DE SEGURIDAD"}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
