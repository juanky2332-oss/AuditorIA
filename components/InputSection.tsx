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
      reader.onabort = () => console.log('Lectura abortada');
      reader.onerror = () => console.log('Error leyendo archivo');
      reader.onload = () => {
        const binaryStr = reader.result;
        if (typeof binaryStr === 'string') {
             setFiles((prev) => [...prev, {
                 mimeType: file.type,
                 data: binaryStr
             }]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop,
      accept: {
          'image/*': [],
          'application/pdf': []
      },
      maxFiles: 3
  });

  const handleRemoveFile = (index: number) => {
      setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (isLoading) return;

    if (!materialName && !intendedUse && !technicalData && files.length === 0) {
        alert("Por favor, introduzca algún dato o suba un archivo.");
        return;
    }

    onAuditRequest({
      materialName,
      intendedUse,
      technicalData,
      filesData: files
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
      
      <div className="mb-8">
        <h2 className="text-xl font-bold text-blue-400 flex items-center gap-3">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-mono px-2 py-1 rounded border border-blue-500/20">01.</span>
            DATOS DE ENTRADA
        </h2>
      </div>

      <div className="space-y-6">
        
        {/* FILA 1 */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Material / Ref</label>
                <input 
                    type="text" 
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Ej. Banda Modular S-200"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-blue-500 transition-all"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Uso Previsto</label>
                <input 
                    type="text" 
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    placeholder="Ej. Transporte de producto terminado"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-blue-500 transition-all"
                    disabled={isLoading}
                />
            </div>
        </div>

        {/* FILA 2: Dropzone */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Documentación</label>
            
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500/50'}`}>
                <input {...getInputProps()} disabled={isLoading} />
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="font-medium">{isDragActive ? "Suelta los archivos..." : "Arrastre PDF o Imágenes aquí"}</p>
                </div>
            </div>

            {/* Archivos subidos */}
            {files.length > 0 && (
                <div className="space-y-2 mt-3">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded text-sm border border-slate-700">
                            <span className="text-blue-300 truncate max-w-[200px]">
                                {file.mimeType === 'application/pdf' ? 'Documento PDF' : 'Imagen'} {index + 1}
                            </span>
                            <button onClick={() => handleRemoveFile(index)} className="text-slate-500 hover:text-red-400 text-xs font-bold uppercase" disabled={isLoading}>Eliminar</button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* FILA 3: Observaciones */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Observaciones</label>
            <textarea 
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                placeholder="Detalles extra..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-blue-500 transition-all h-24 resize-none"
                disabled={isLoading}
            />
        </div>

        {/* BOTÓN */}
        <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2
                ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        ircle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analizando...</span>
                </>
            ) : (
                'Iniciar Auditoría Técnica'
            )}
        </button>

      </div>
    </div>
  );
};

export default InputSection;
