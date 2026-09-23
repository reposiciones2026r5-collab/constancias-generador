'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

interface Certificate {
  id: number;
  fullName: string;
  topic: string;
  date: string;
  certType: string;
  stateCode: string;
  folio: string;
  createdAt: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const folio = searchParams.get('folio');
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
          setError(data.error || 'Certificado inválido o no encontrado');
        }
      } catch (err) {
        setError('Error al consultar el servidor');
      } finally {
        setLoading(false);
      }
    }

    verifyFolio();
  }, [folio]);

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Verificación de Constancia
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Sistema oficial de validación de folio y autenticidad
        </p>
      </div>

      {!folio && (
        <div className="text-center py-8 text-slate-400">
          <p className="mb-4">No se proporcionó ningún folio para verificar.</p>
          <Link
            href="/"
            id="back-home-btn"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition duration-200 inline-block"
          >
            Ir al Generador
          </Link>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Verificando folio: <span className="text-blue-400 font-mono">{folio}</span>...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-red-400">Certificado No Válido</h2>
          <p className="text-slate-300 text-sm">{error}</p>
          <div className="pt-4">
            <Link
              href="/"
              id="error-back-btn"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
            >
              Volver a la página principal
            </Link>
          </div>
        </div>
      )}

      {!loading && certificate && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 font-semibold text-sm">CONSTANCIA VÁLIDA Y AUTÉNTICA</span>
            </div>
            <span className="font-mono bg-emerald-950/80 text-emerald-300 text-xs px-2.5 py-1 rounded-md border border-emerald-500/30">
              OFICIAL
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-6 border border-slate-800/80 space-y-4">
            <div className="border-b border-slate-800/80 pb-4">
              <span className="text-slate-400 text-xs uppercase tracking-wider block">Folio de Registro</span>
              <span className="text-2xl font-mono font-bold text-blue-400">{certificate.folio}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Nombre Titular</span>
                <span className="text-lg font-semibold text-slate-100">{certificate.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Tema / Evento</span>
                <span className="text-base text-slate-200">{certificate.topic}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Fecha de Emisión</span>
                <span className="text-slate-200">{certificate.date}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Tipo y Estado</span>
                <span className="text-slate-200">
                  Tipo: <strong className="text-blue-400">{certificate.certType}</strong> | Estado: <strong className="text-purple-400">{certificate.stateCode}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/"
              id="verify-home-btn"
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition duration-200"
            >
              Generar otra constancia
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 flex items-center justify-center">
      <Suspense fallback={<div className="text-slate-400 text-center">Cargando módulo de verificación...</div>}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
