'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MEXICAN_STATES } from '@/config/states';

interface ActiveAdminConfig {
  topic: string;
  certType: string;
  stateCode: string;
  eventDate: string;
}

export default function HomePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    stateCode: 'EDO',
    age: '',
    occupation: '',
  });

  const [adminConfig, setAdminConfig] = useState<ActiveAdminConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedFolio, setGeneratedFolio] = useState<string | null>(null);

  // Obtener la configuración activa de la administradora al cargar la vista
  useEffect(() => {
    async function fetchAdminConfig() {
      try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        if (res.ok && data.config) {
          setAdminConfig(data.config);
          if (data.config.stateCode) {
            setFormData((prev) => ({
              ...prev,
              stateCode: data.config.stateCode,
            }));
          }
        }
      } catch (err) {
        console.error('Error al cargar la configuración del administrador:', err);
      }
    }

    fetchAdminConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setDownloadUrl(null);
    setGeneratedFolio(null);

    try {
      // 1. Configurar la llamada fetch enviando los datos requeridos (incluyendo la abreviatura del estado seleccionado)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      // 2. Extraer el Folio asignado
      const folioHeader = response.headers.get('X-Certificate-Folio');

      // 3. Capturar la respuesta binaria del PDF
      const pdfBlob = await response.blob();

      // 4. Crear URL temporal para forzar descarga automática
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDownloadUrl(blobUrl);

      const fileName = `constancia_${folioHeader || 'generada'}.pdf`;
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (folioHeader) {
        setGeneratedFolio(folioHeader);
      }

      setSuccessMsg(`¡Constancia generada y descargada exitosamente! ${folioHeader ? `Folio: ${folioHeader}` : ''}`);
    } catch (err) {
      console.error('Error al solicitar la constancia:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Barra de navegación superior */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Portal de Registro de Participantes</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 rounded-lg transition font-semibold"
            >
              ⚙ Panel de Administración
            </Link>
          </div>
        </div>

        {/* Encabezado */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Generación de Constancia Oficial</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Solicita tu Constancia PDF
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Ingresa tus datos personales y selecciona tu estado de procedencia para emitir tu constancia con código QR de verificación.
          </p>

          {/* Badge de la Configuración Activa del Evento */}
          {adminConfig && (
            <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl max-w-2xl mx-auto text-xs text-slate-300 flex flex-wrap items-center justify-center gap-3">
              <span className="text-blue-400 font-semibold">📌 Evento Activo:</span>
              <span className="font-medium text-slate-200">{adminConfig.topic}</span>
              <span className="text-slate-600">|</span>
              <span>Fecha: <strong className="text-slate-200">{adminConfig.eventDate}</strong></span>
            </div>
          )}
        </div>

        {/* Formulario para el usuario final */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Datos del Participante</span>
            <span className="text-xs text-slate-400 font-normal">* Campo requerido</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nombre Completo */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Nombre Completo *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-600"
                  placeholder="Ej. Ana María López García"
                />
              </div>

              {/* Lista desplegable select con las 32 Entidades Federativas de México */}
              <div className="sm:col-span-2">
                <label htmlFor="stateCode" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Estado de Procedencia *
                </label>
                <select
                  id="stateCode"
                  name="stateCode"
                  required
                  value={formData.stateCode}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer font-medium"
                >
                  <option value="" disabled>-- Selecciona tu estado de procedencia --</option>
                  {MEXICAN_STATES.map((state) => (
                    <option key={state.code} value={state.code} className="bg-slate-900 text-slate-100 py-1">
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 mt-1 block">
                  La clave de 2-3 letras ({formData.stateCode || 'EDO'}) se integrará automáticamente al formato del Folio.
                </span>
              </div>

              {/* Edad */}
              <div>
                <label htmlFor="age" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Edad
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-600"
                  placeholder="Ej. 28"
                />
              </div>

              {/* Ocupación */}
              <div>
                <label htmlFor="occupation" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                  Ocupación
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder-slate-600"
                  placeholder="Ej. Productor Agrícola / Estudiante"
                />
              </div>
            </div>

            {/* Alert Error */}
            {error && (
              <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-start space-x-3">
                <span className="text-red-400 text-lg font-bold">✕</span>
                <div>
                  <strong className="block font-semibold">Ocurrió un error</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Alert Éxito */}
            {successMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 text-lg font-bold">✓</span>
                  <strong className="font-semibold text-emerald-200">{successMsg}</strong>
                </div>
                {downloadUrl && (
                  <div className="pt-2 flex items-center space-x-4">
                    <a
                      href={downloadUrl}
                      download={`constancia_${generatedFolio || 'generada'}.pdf`}
                      className="inline-flex items-center space-x-1 text-xs bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition"
                    >
                      <span>⬇ Volver a descargar PDF</span>
                    </a>
                    {generatedFolio && (
                      <Link
                        href={`/verificar?folio=${generatedFolio}`}
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-mono"
                      >
                        Verificar Folio en línea →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botón submit */}
            <div className="pt-2">
              <button
                id="submit-generate-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-3 text-base"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Generando Constancia...</span>
                  </>
                ) : (
                  <span>Generar Constancia</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Vista previa iframe si el PDF fue generado */}
        {downloadUrl && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Vista Previa de la Constancia (PDF)</h3>
              {generatedFolio && (
                <span className="font-mono text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md">
                  Folio: {generatedFolio}
                </span>
              )}
            </div>
            <div className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                src={downloadUrl}
                title="Vista Previa de la Constancia PDF"
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
