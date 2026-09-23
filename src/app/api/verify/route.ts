import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folio = searchParams.get('folio');

  if (!folio) {
    return NextResponse.json({ error: 'El parámetro folio es requerido' }, { status: 400 });
  }

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { folio },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'Certificado no encontrado', valid: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, valid: true, certificate });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al consultar el certificado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
