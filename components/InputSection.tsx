// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const InputSection = ({ onAuditRequest, isLoading }) => {
  const [materialName, setMaterialName] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [technicalData, setTechnicalData] = useState('');
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
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

  const handleRemoveFile = (index) => {
      setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!materialName && !intendedUse && !technicalData && files.length === 0) {
        alert("Por favor, introduzca algún dato o suba un archivo.");
        return;
    }
    onAuditRequest({ materialName, intendedUse, technicalData, filesData: files });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-blue-400">01. DATOS DE ENTRADA</h2>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Material / Ref</label>
                <input 
                    type="text" 
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Ej. Banda Modular"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200"
                    disabled={isLoading}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Uso Previsto</label>
                <input 
                    type="text" 
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    placeholder="Ej. Transporte"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200"
                    disabled={isLoading}
                />
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Documentación</label>
            <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer border-slate-700 hover:border-blue-500">
                <input {...getInputProps()} disabled={isLoading} />
                <p className="text-slate-500">Arrastra archivos aquí</p>
            </div>
            {files.length > 0 && (
                <div className="space-y-2 mt-3">
                    {files.map((file, index) => (
                        <div key={index} className="flex justify-between bg-slate-800 px-4 py-2 rounded text-sm border border-slate-700">
                            <span className="text-blue-300">Archivo {index + 1}</span>
                            <button onClick={() => handleRemoveFile(index)} className="text-red-400 text-xs font-bold">ELIMINAR</button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
            <textarea 
                value={technicalData}
                onChange={(e) => setTechnicalData(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 h-24"
                disabled={isLoading}
            />
        </div>

        <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 rounded-lg font-bold text-sm uppercase bg-blue-600 hover:bg-blue-500 text-white"
        >
            {isLoading ? "ANALIZANDO..." : "INICIAR AUDITORÍA"}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
