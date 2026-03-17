import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadToIPFS } from '../../../lib/ipfs-local';
import { Buffer } from 'buffer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, customerAddress, items, total, txHash } = body;

    if (!orderId || !customerAddress || !items || !total || !txHash) {
      return NextResponse.json({ error: 'Faltan datos para generar la factura' }, { status: 400 });
    }

    // 1. Crear un nuevo documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;

    // 2. Dibujar el contenido de la factura
    let y = height - 50;
    const drawText = (text: string, x: number, isBold = false, customY?: number) => {
      page.drawText(text, {
        x,
        y: customY || y,
        font: isBold ? boldFont : font,
        size: fontSize,
        color: rgb(0.1, 0.1, 0.1),
      });
      if (!customY) y -= 20;
    };

    page.drawText(`Factura E-Commerce Solana`, { x: 50, y, font: boldFont, size: 20 });
    y -= 40;

    drawText(`ID de Orden: #${orderId}`, 50, true);
    drawText(`Fecha: ${new Date().toLocaleString('es-ES')}`, 50);
    y -= 10;

    drawText('Cliente:', 50, true);
    drawText(`${customerAddress}`, 50);
    y -= 10;

    drawText('Total Pagado:', 50, true);
    drawText(`${total} EURT`, 50);
    y -= 10;

    drawText('Hash de Transacción:', 50, true);
    drawText(`${txHash}`, 50);
    y -= 30;

    drawText('--- Resumen de Productos ---', 50, true);
    y -= 10;
    items.forEach((item: any) => {
      drawText(`- ${item.name} (x${item.quantity})`, 60);
      drawText(`${item.price} EURT`, 450, false, y + 20); // Align price to the right
    });

    // 3. Serializar el PDF a un Buffer
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 4. Subir el Buffer a IPFS local
    const cid = await uploadToIPFS(pdfBuffer);

    // 5. Devolver el CID
    return NextResponse.json({ success: true, cid }, { status: 200 });
  } catch (error: any) {
    console.error('Error en la API de generación de factura:', error);
    const errorMessage = error.message || 'Error interno del servidor';
    // Check if the error is from Kubo not running
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error:
            'No se pudo conectar con el demonio de IPFS local (Kubo). Asegúrate de que está corriendo.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
