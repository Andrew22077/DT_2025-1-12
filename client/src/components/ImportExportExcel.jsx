import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { importExcelProfesores, exportProfesoresExcel } from '../api/UserApi';

const ImportExportExcel = ({ onImportSuccess }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportProfesoresExcel();
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el archivo Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const closeModal = () => {
    setShowImportModal(false);
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      {/* Botones de Importar y Exportar */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
        >
          <Upload size={16} />
          Importar Excel
        </button>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {exportLoading ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Modal de Importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Importar Profesores desde Excel</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo Excel
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
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
                  <span className="text-xs text-gray-400 mt-1">
                    Formatos soportados: .xlsx, .xls
                  </span>
                </label>
              </div>
            </div>

            {/* Información sobre el formato esperado */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Formato esperado del Excel:</h4>
              <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                <li><strong>APELLIDOS NOMBRES</strong> (obligatorio)</li>
                <li><strong>No. DE IDENTIFICACIÓN</strong> (obligatorio)</li>
                <li>CORREO INSTITUCIONAL (opcional)</li>
                <li>CORREO PERSONAL (opcional)</li>
                <li>Celular (opcional)</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                ℹ️ Las demás columnas del Excel serán ignoradas automáticamente
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {result && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <div className="flex items-center mb-2">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="font-medium">Importación completada</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>✅ Creados: <strong>{result.created}</strong> profesores</div>
                  <div>🔄 Actualizados: <strong>{result.updated}</strong> profesores</div>
                  <div>📊 Total procesado: <strong>{result.total_processed || result.created + result.updated}</strong> de <strong>{result.total_rows || 'N/A'}</strong> filas</div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="text-red-600">❌ Errores: <strong>{result.errors.length}</strong></div>
                  )}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
                        Ver errores ({result.errors.length})
                      </summary>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <ul className="list-disc list-inside text-red-600 space-y-1">
                          {result.errors.map((error, index) => (
                            <li key={index} className="text-xs">{error}</li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {result ? 'Cerrar' : 'Cancelar'}
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Importar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportExportExcel;