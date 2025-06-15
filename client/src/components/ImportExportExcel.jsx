import React, { useState } from 'react';
import { importExcelProfesores, exportProfesoresExcel } from '../api/UserApi';

const ImportExportExcel = ({ onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setMessage('');
      } else {
        setMessage('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        setMessageType('error');
        setSelectedFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage('Por favor selecciona un archivo primero');
      setMessageType('error');
      return;
    }

    setImporting(true);
    setMessage('');

    try {
      const result = await importExcelProfesores(selectedFile);
      
      if (result.created > 0) {
        setMessage(`✅ Importación exitosa: ${result.created} profesores creados de ${result.total_rows} filas procesadas`);
        setMessageType('success');
        
        if (result.errors && result.errors.length > 0) {
          setMessage(prev => prev + `\n⚠️ Errores encontrados: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`);
        }
        
        // Limpiar el archivo seleccionado
        setSelectedFile(null);
        document.getElementById('file-input-profesores').value = '';
        
        // Notificar al componente padre para que recargue la lista
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setMessage(`⚠️ No se crearon profesores. Revisa el formato del archivo.`);
        setMessageType('error');
        
        if (result.errors && result.errors.length > 0) {
          setMessage(prev => prev + `\nErrores: ${result.errors.slice(0, 5).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error al importar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      setMessage(`❌ Error al importar archivo: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage('Generando archivo Excel...');
    setMessageType('info');

    try {
      const result = await exportProfesoresExcel();
      if (result.success) {
        setMessage('✅ Archivo Excel descargado exitosamente');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      setMessage(`❌ Error al exportar: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setExporting(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        📊 Importar/Exportar Profesores Excel
      </h3>
      
      <div className="flex flex-wrap gap-4 items-center">
        {/* Sección de Importar */}
        <div className="flex items-center gap-2">
          <input
            id="file-input-profesores"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            disabled={importing}
          />
          
          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              !selectedFile || importing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {importing ? '⏳ Importando...' : '📥 Importar'}
          </button>
        </div>

        {/* Separador */}
        <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

        {/* Sección de Exportar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              exporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {exporting ? '⏳ Exportando...' : '📤 Exportar Todo'}
          </button>
        </div>
      </div>

      {/* Información del archivo seleccionado */}
      {selectedFile && (
        <div className="mt-3 text-sm text-gray-600">
          <p>📄 Archivo seleccionado: <strong>{selectedFile.name}</strong></p>
          <p>📏 Tamaño: <strong>{(selectedFile.size / 1024).toFixed(1)} KB</strong></p>
        </div>
      )}

      {/* Mensajes de estado */}
      {message && (
        <div className={`mt-4 p-3 rounded-md relative ${
          messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          messageType === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <button
            onClick={clearMessage}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
          <pre className="whitespace-pre-wrap text-sm font-medium">{message}</pre>
        </div>
      )}

      {/* Información de formato esperado */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Formato esperado del Excel:</strong></p>
        <p>• Columnas: CÉDULA, NOMBRE, CORREO, CONTRASEÑA</p>
        <p>• La primera fila debe contener los encabezados</p>
        <p>• Formatos soportados: .xlsx, .xls (máximo 5MB)</p>
      </div>
    </div>
  );
};

export default ImportExportExcel;