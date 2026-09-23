'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MEXICAN_STATES } from '@/config/states';

interface AdminConfig {
  modality: 'Seminario' | 'Conversatorio';
  typeNumber: number;
  certType: string;
  topic: string;
  stateCode: string;
  eventDate: string;
}

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig>({
    modality: 'Seminario',
    typeNumber: 1,
    certType: 'S1',
    topic: 'Fertilizantes para el Bienestar y Nutrición Vegetal',
    stateCode: 'CDMX',
    eventDate: '22 de Septiembre de 2026',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar la configuración activa al cargar la página
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        if (res.ok && data.config) {
          setConfig(data.config);
        } else {
          setError(data.error || 'Error al cargar la configuración activa.');
        }
      } catch (err) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  // Calcular dinámicamente la abreviatura para el folio (S1 / C2)
  const computedCertType = `${config.modality === 'Conversatorio' ? 'C' : 'S'}${Math.max(1, config.typeNumber || 1)}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === 'typeNumber' ? Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modality: config.modality,
          typeNumber: Number(config.typeNumber),
          topic: config.topic,
          stateCode: config.stateCode,
          eventDate: config.eventDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar los cambios.');
      }

      setConfig(data.config);
      setSuccessMsg('¡Parámetros de administración y Tema del evento actualizados exitosamente!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-100">Panel de Administración</h1>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition"
            >
              ← Ir al Formulario de Registro
            </Link>
            <Link
              href="/verificar"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition"
            >
              Módulo de Verificación
            </Link>
          </div>
        </div>

        {/* Encabezado */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <span>Configuración General de Constancias</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
            Administración del Evento y Tema
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Configura la modalidad, el tema oficial, el estado organizador y la fecha que se inyectarán en la constancia PDF.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Cargando parámetros globales de administración...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Formulario de Administración */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
                Parámetros Organizadores
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Selector de Modalidad */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                    Modalidad del Evento *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition font-semibold text-sm ${
                        config.modality === 'Seminario'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modality"
                        value="Seminario"
                        checked={config.modality === 'Seminario'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span>🎓 Seminario (S)</span>
                    </label>

                    <label
                      className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition font-semibold text-sm ${
                        config.modality === 'Conversatorio'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modality"
                        value="Conversatorio"
                        checked={config.modality === 'Conversatorio'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span>💬 Conversatorio (C)</span>
                    </label>
                  </div>
                </div>

                {/* Número de Tipo */}
                <div>
                  <label htmlFor="typeNumber" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Número de Evento / Tipo (ej. 1, 2, 3) *
                  </label>
                  <input
                    id="typeNumber"
                    name="typeNumber"
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={config.typeNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition font-mono"
                    placeholder="Ej. 1"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Abreviatura resultante para el folio: <strong className="text-purple-400 font-mono">{computedCertType}</strong>
                  </span>
                </div>

                {/* Campo Obligatorio: Tema del Evento / Taller */}
                <div>
                  <label htmlFor="topic" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Tema del Evento / Taller *
                  </label>
                  <textarea
                    id="topic"
                    name="topic"
                    rows={2}
                    required
                    value={config.topic}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none font-medium"
                    placeholder="Ej. Taller de Tecnologías para el Campo o Fertilizantes para el Bienestar"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Este tema se imprimirá destacado en el PDF justo debajo de la leyenda oficial.
                  </span>
                </div>

                {/* Selector de Estado Organizador */}
                <div>
                  <label htmlFor="stateCode" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Estado Organizador (imparte el evento) *
                  </label>
                  <select
                    id="stateCode"
                    name="stateCode"
                    required
                    value={config.stateCode}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition cursor-pointer font-medium"
                  >
                    {MEXICAN_STATES.map((state) => (
                      <option key={state.code} value={state.code} className="bg-slate-900 text-slate-100">
                        {state.name} ({state.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha del evento */}
                <div>
                  <label htmlFor="eventDate" className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Fecha del Evento *
                  </label>
                  <input
                    id="eventDate"
                    name="eventDate"
                    type="text"
                    required
                    value={config.eventDate}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    placeholder="Ej. 22 de Septiembre de 2026"
                  />
                </div>

                {/* Alert Errores */}
                {error && (
                  <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-start space-x-3">
                    <span className="text-red-400 text-lg font-bold">✕</span>
                    <div>
                      <strong className="block font-semibold">Error al guardar</strong>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Alert Éxito */}
                {successMsg && (
                  <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center space-x-3">
                    <span className="text-emerald-400 text-lg font-bold">✓</span>
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    id="save-config-btn"
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 text-sm"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Guardando Parámetros...</span>
                      </>
                    ) : (
                      <span>Guardar Parámetros Organizadores</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Vista previa de Folio y Texto del PDF */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Estructura del Folio</span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">
                    {computedCertType}
                  </span>
                </h4>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs text-slate-500 font-semibold block">Regla de Construcción:</span>
                  <div className="font-mono text-xs text-slate-300">
                    FpB + <strong className="text-purple-400">[{computedCertType}]</strong> + <strong className="text-blue-400">[{config.stateCode}]</strong> + <strong className="text-emerald-400">[00001]</strong>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Ejemplo de Folio:</span>
                    <span className="font-mono bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded font-bold">
                      FpB{computedCertType}{config.stateCode}00001
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Vista Previa del Texto en PDF
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-semibold">Línea 1 (Leyenda Descriptiva):</span>
                    <span className="text-slate-300">
                      Por su asistencia en la VII Jornada de Seminarios del Programa Fertilizantes para el Bienestar en el {config.modality}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-semibold">Línea 2 (Tema Configurado):</span>
                    <span className="text-amber-400 font-bold block text-sm">
                      {config.topic || 'Sin tema especificado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
