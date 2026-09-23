'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Certificate {
  id: number;
  fullName: string;
  topic: string;
  date: string;
  certType: string;
  stateCode: string;
  age?: string;
  occupation?: string;
  folio: string;
  createdAt: string;
}

export default function VerifyFolioPage() {
  const params = useParams();
  const rawFolio = params?.folio;
  const folio = Array.isArray(rawFolio) ? rawFolio[0] : rawFolio;

  const [loading, setLoading] = useState<boolean>(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!folio) {
      setLoading(false);
      return;
    }

    async function verifyFolio() {
      try {
        const res = await fetch(`/api/verify?folio=${encodeURIComponent(folio!)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setCertificate(data.certificate);
        } else {
          setError(data.error || 'Certificado no encontrado o folio inválido');
        }
      } catch (err) {
        setError('Error al consultar el servidor de verificación');
      } finally {
        setLoading(false);
      }
    }

    verifyFolio();
  }, [folio]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span>Sistema Oficial de Autenticidad</span>
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Validación de Constancia
          </h1>
          <p className="text-slate-400 text-xs font-mono">
            Folio a verificar: <strong className="text-blue-300">{folio}</strong>
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Verificando registro en base de datos oficial...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-xl font-bold text-red-400">Folio Inexistente o Inválido</h2>
            <p className="text-slate-300 text-sm">{error}</p>
            <div className="pt-2">
              <Link
                href="/"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                ← Volver al Inicio
              </Link>
            </div>
          </div>
        )}

        {!loading && certificate && (
          <div className="space-y-6">
            {/* Banner Válido */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-emerald-400 font-extrabold text-sm tracking-wide">
                  DOCUMENTO OFICIAL VÁLIDO Y AUTÉNTICO
                </span>
              </div>
              <span className="font-mono bg-emerald-950 text-emerald-300 text-xs px-2.5 py-1 rounded border border-emerald-500/30 font-bold">
                VERIFICADO
              </span>
            </div>

            {/* Datos de la Constancia */}
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider block font-semibold">Folio de Registro</span>
                  <span className="text-2xl font-mono font-extrabold text-blue-400">{certificate.folio}</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-800 font-mono">
                  ID: #{certificate.id}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider block font-semibold">Titular de la Constancia</span>
                  <span className="text-lg font-bold text-slate-100">{certificate.fullName}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wider block font-semibold">Evento / Leyenda Oficial</span>
                  <span className="text-sm text-slate-200 font-medium leading-relaxed block">{certificate.topic}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wider block font-semibold">Ubicación y Fecha</span>
                    <span className="text-xs text-slate-300">{certificate.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wider block font-semibold">Estado de Procedencia</span>
                    <span className="text-xs text-purple-300 font-mono font-bold">{certificate.stateCode}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Link
                href="/"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Generar otra constancia
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
