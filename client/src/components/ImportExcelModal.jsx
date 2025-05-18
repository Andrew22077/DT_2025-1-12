import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importExcelProfesores } from '../api/UserApi';

const ImportExcelModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await importExcelProfesores(file);
      setResult(response);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Importar Profesores desde Excel</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar archivo Excel
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileSpreadsheet size={48} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Haz clic para seleccionar un archivo Excel'}
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {result && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <div className="flex items-center mb-2">
              <CheckCircle size={16} className="mr-2" />
              <span className="font-medium">Importación completada</span>
            </div>
            <ul className="text-sm list-disc list-inside">
              <li>Creados: {result.created} profesores</li>
              <li>Actualizados: {result.updated} profesores</li>
              {result.errors && result.errors.length > 0 && (
                <li className="text-red-600">Errores: {result.errors.length}</li>
              )}
            </ul>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Ver errores</summary>
                  <ul className="mt-2 list-disc list-inside text-red-600">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importando...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Importar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;