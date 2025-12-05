import React, { useState, useRef, useCallback } from 'react';
import { AuditContext, FileData } from '../types';

interface InputSectionProps {
  onAnalyze: (context: AuditContext) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [materialName, setMaterialName] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter((f: File) => 
        f.type === "application/pdf" || 
        f.type.startsWith("image/") || 
        f.type === "text/plain"
      );
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      } else {
        alert("Formato no soportado. Use PDF o Imagen.");
      }
    }
  }, []);

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const convertFileToBase64 = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve({
            name: file.name,
            mimeType: file.type,
            data: base64String
          });
        } else {
          reject(new Error("Failed to convert file"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: Debe haber AL MENOS un nombre de material O un archivo adjunto.
    const hasMaterial = materialName.trim().length > 0;
    const hasFiles = files.length > 0;

    if (!hasMaterial && !hasFiles) {
      return;
    }

    const filesData: FileData[] = [];
    if (files.length > 0) {
      try {
        const promises = files.map(file => convertFileToBase64(file));
        const results = await Promise.all(promises);
        filesData.push(...results);
      } catch (error) {
        alert("Error procesando archivos.");
        return;
      }
    }

    onAnalyze({
      materialName: materialName.trim() || undefined,
      intendedUse: intendedUse || 'No especificado (analizar contexto)',
      technicalData: technicalData || '',
      filesData: filesData.length > 0 ? filesData : undefined
    });
  };

  // Logic to disable button: Disabled ONLY if both Material Name is empty AND No files are uploaded
  const isButtonDisabled = !materialName.trim() && files.length === 0;

  return (
    <div className="glass-panel rounded-2xl p-1 animate-fade-in neon-border-focus transition-all duration-300">
      <div className="bg-slate-900/50 rounded-xl p-6 md:p-8">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
             <span className="text-blue-400 font-mono text-xl">01.</span> 
             DATOS DE ENTRADA
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Material / Ref (Opcional si hay archivo)</label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Ej. Banda Modular S-200"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Uso Previsto</label>
              <input
                type="text"
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Ej. Transporte de producto terminado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Documentación (Ficha Técnica / Certificado)</label>
            
            {/* Professional Drop Zone */}
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 group ${
                isDragging 
                  ? 'border-blue-400 bg-blue-900/10' 
                  : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                className="hidden"
                multiple 
              />
              
              <svg className={`w-10 h-10 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              
              <p className="text-sm font-medium text-slate-300">
                Arrastre archivos PDF o Imágenes aquí
              </p>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                o haga click para seleccionar
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="grid grid-cols-1 gap-2 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-blue-300">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="truncate">{file.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="text-slate-500 hover:text-red-400 ml-4 font-bold px-2 py-1 rounded hover:bg-slate-700"
                    >
                      ELIMINAR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
             <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Observaciones Técnicas Adicionales</label>
             <textarea
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                rows={2}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Detalles extra..."
             />
          </div>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full py-4 rounded-lg font-bold tracking-widest text-sm uppercase transition-all duration-300 shadow-lg ${
               isButtonDisabled
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 hover:shadow-blue-500/20'
            }`}
          >
            INICIAR AUDITORÍA TÉCNICA
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;