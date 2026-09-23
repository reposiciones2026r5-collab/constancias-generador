import { NextResponse } from 'next/server';
import { getAdminConfig, saveAdminConfig } from '@/lib/adminConfigHelper';

export async function GET() {
  try {
    const config = getAdminConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la configuración de administración', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modality, typeNumber, topic, stateCode, eventDate } = body;

    if (!modality || typeNumber === undefined || !topic || !stateCode || !eventDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: modality, typeNumber, topic, stateCode, eventDate' },
        { status: 400 }
      );
    }

    const updatedConfig = saveAdminConfig({
      modality,
      typeNumber: Number(typeNumber),
      topic,
      stateCode,
      eventDate,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de administración actualizada correctamente',
      config: updatedConfig,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar la configuración de administración', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
