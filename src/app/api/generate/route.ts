import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { getAdminConfig } from '@/lib/adminConfigHelper';
import { MEXICAN_STATES } from '@/config/states';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const formatParam = url.searchParams.get('format');
    const body = await request.json();

    const { fullName, age, occupation, stateCode: userStateCode } = body;

    if (!fullName || String(fullName).trim() === '') {
      return NextResponse.json(
        { error: 'El nombre completo (fullName) es requerido' },
        { status: 400 }
      );
    }

    // 1. Cargar la configuración activa del panel de administración
    const adminConfig = getAdminConfig();
    const modality = adminConfig.modality || 'Seminario';
    const certType = adminConfig.certType; // S1, S2, C1, C2...
    const organizerStateCode = String(adminConfig.stateCode || 'CDMX').trim().toUpperCase();
    const date = adminConfig.eventDate;
    const adminTopic = adminConfig.topic;

    // Estado de procedencia del participante (para registro y estadística)
    const participantStateCode = userStateCode ? String(userStateCode).trim().toUpperCase() : organizerStateCode;

    // 2. Consultar a Prisma cuántos registros existen y sumar 1 para el consecutivo de 5 dígitos
    const count = await prisma.certificate.count();
    const consecutivo = String(count + 1).padStart(5, '0');

    // 3. Construir Folio definitivo: FpB + [S1/C1] + [Estado Organizador] + [00000]
    const folio = `FpB${certType}${organizerStateCode}${consecutivo}`;

    // 4. Generar código QR apuntando a la URL de validación: https://[tudominio]/verificar/[FOLIO]
    const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://tudominio.com';
    const validationUrl = `${domain}/verificar/${folio}`;
    const qrDataUrl = await QRCode.toDataURL(validationUrl);

    // 5. Guardar el registro en Prisma DB
    const newCertificate = await prisma.certificate.create({
      data: {
        fullName: String(fullName).trim(),
        topic: adminTopic,
        date,
        certType,
        stateCode: participantStateCode, // Estado de procedencia del participante para estadística
        age: age ? String(age).trim() : null,
        occupation: occupation ? String(occupation).trim() : null,
        folio,
      },
    });

    // 5.1 Enviar datos del participante a Google Sheets si está configurada la URL
    const googleSheetUrl = process.env.GOOGLE_SHEET_WEBAPP_URL;
    if (googleSheetUrl) {
      try {
        fetch(googleSheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: String(fullName).trim(),
            state: participantStateCode,
            age: age ? String(age).trim() : '',
            occupation: occupation ? String(occupation).trim() : '',
            folio: folio,
          }),
          redirect: 'follow',
        }).catch((err) => {
          console.error('Error al enviar datos a Google Sheets:', err);
        });
      } catch (sheetErr) {
        console.error('Excepción al intentar sincronizar con Google Sheets:', sheetErr);
      }
    }

    // 6. Generar PDF usando pdf-lib y las fuentes nativas estándar (Helvetica y HelveticaBold)
    const pdfDoc = await PDFDocument.create();

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([612, 792]); // Tamaño Carta (8.5 x 11 pulgadas)
    const { width, height } = page.getSize();

    // Cargar la imagen plantilla local (.jpg o .png)
    const jpgPath = path.join(process.cwd(), 'PLANTILLA_CONSTANCIA_Titulares copy 2.jpg');
    const pngPath = path.join(process.cwd(), 'PLANTILLA_CONSTANCIA_Titulares copy 2.png');

    let bgBytes: Buffer;
    let isJpg = false;

    if (fs.existsSync(jpgPath)) {
      bgBytes = fs.readFileSync(jpgPath);
      isJpg = true;
    } else if (fs.existsSync(pngPath)) {
      bgBytes = fs.readFileSync(pngPath);
      isJpg = false;
    } else {
      throw new Error('No se encontró la imagen plantilla local PLANTILLA_CONSTANCIA_Titulares copy 2');
    }

    const bgImg = isJpg
      ? await pdfDoc.embedJpg(bgBytes)
      : await pdfDoc.embedPng(bgBytes);

    // Dibuja la plantilla como fondo de la página (sin recrear logos ni textos estáticos de la imagen)
    page.drawImage(bgImg, { x: 0, y: 0, width, height });

    // Dibuja únicamente los elementos dinámicos utilizando las fuentes estándar incrustadas:
    // A. Nombre completo (fullName) centrado en negrita (HelveticaBold)
    let nameSize = 30;
    let nameWidth = helveticaBoldFont.widthOfTextAtSize(fullName, nameSize);
    while (nameWidth > width - 80 && nameSize > 16) {
      nameSize -= 2;
      nameWidth = helveticaBoldFont.widthOfTextAtSize(fullName, nameSize);
    }
    page.drawText(fullName, {
      x: (width - nameWidth) / 2,
      y: 445,
      size: nameSize,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // B. Leyenda oficial dividida en 2 líneas limpias centradas (Helvetica)
    const line1Text = 'Por su asistencia en la VII Jornada de Seminarios';
    const line2Text = `del Programa Fertilizantes para el Bienestar en el ${modality}`;

    let legendSize = 11.5;
    let line1Width = helveticaFont.widthOfTextAtSize(line1Text, legendSize);
    let line2Width = helveticaFont.widthOfTextAtSize(line2Text, legendSize);

    while ((line1Width > width - 60 || line2Width > width - 60) && legendSize > 9) {
      legendSize -= 0.5;
      line1Width = helveticaFont.widthOfTextAtSize(line1Text, legendSize);
      line2Width = helveticaFont.widthOfTextAtSize(line2Text, legendSize);
    }

    // Interlineado limpio y elegante
    const lineHeight = Math.round(legendSize * 1.6);
    const legendY1 = 390;
    const legendY2 = legendY1 - lineHeight;

    page.drawText(line1Text, {
      x: (width - line1Width) / 2,
      y: legendY1,
      size: legendSize,
      font: helveticaFont,
      color: rgb(0.25, 0.25, 0.25),
    });

    page.drawText(line2Text, {
      x: (width - line2Width) / 2,
      y: legendY2,
      size: legendSize,
      font: helveticaFont,
      color: rgb(0.25, 0.25, 0.25),
    });

    // C. Tema del evento centrado en negrita (HelveticaBold)
    let topicSize = 16.5;
    let topicWidth = helveticaBoldFont.widthOfTextAtSize(adminTopic, topicSize);
    while (topicWidth > width - 80 && topicSize > 11) {
      topicSize -= 1;
      topicWidth = helveticaBoldFont.widthOfTextAtSize(adminTopic, topicSize);
    }
    const topicY = legendY2 - 40;
    page.drawText(adminTopic, {
      x: (width - topicWidth) / 2,
      y: topicY,
      size: topicSize,
      font: helveticaBoldFont,
      color: rgb(0.65, 0.45, 0.1),
    });

    // D. Ubicación y Fecha en la parte inferior centrada (Helvetica)
    const stateObj = MEXICAN_STATES.find(s => s.code.toUpperCase() === organizerStateCode.toUpperCase());
    const locationName = stateObj ? stateObj.name : organizerStateCode;
    const locationDateText = `${locationName}, ${date}`;

    let dateSize = 11.5;
    let dateWidth = helveticaFont.widthOfTextAtSize(locationDateText, dateSize);
    page.drawText(locationDateText, {
      x: (width - dateWidth) / 2,
      y: 250,
      size: dateSize,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // E. Código QR centrado exactamente encima del recuadro gris
    const qrBase64Clean = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBytes = Buffer.from(qrBase64Clean, 'base64');
    const qrImg = await pdfDoc.embedPng(qrBytes);
    const qrSize = 75;
    page.drawImage(qrImg, {
      x: (width - qrSize) / 2,
      y: 150,
      width: qrSize,
      height: qrSize,
    });

    // F. Folio impreso en texto claro centrado debajo del QR (HelveticaBold)
    const folioText = `FOLIO: ${folio}`;
    const folioSize = 11.5;
    const folioWidth = helveticaBoldFont.widthOfTextAtSize(folioText, folioSize);
    page.drawText(folioText, {
      x: (width - folioWidth) / 2,
      y: 130,
      size: folioSize,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    const pdfBytes = await pdfDoc.save();

    if (formatParam === 'json') {
      return NextResponse.json({
        success: true,
        data: newCertificate,
        qrCode: qrDataUrl,
        validationUrl,
        pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      });
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="constancia_${folio}.pdf"`,
        'X-Certificate-Folio': folio,
      },
    });
  } catch (error) {
    console.error('Error en /api/generate:', error);
    return NextResponse.json(
      { error: 'Error al generar la constancia y el PDF', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
