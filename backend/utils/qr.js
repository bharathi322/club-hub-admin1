import QRCode from "qrcode";
export function generateQrToken(eventId) {
  return `${eventId}-${Date.now()}`;
}

// Generate QR code as base64 image
export async function generateQrCodeDataUrl(data) {
  try {
    const qr = await QRCode.toDataURL(data);
    return qr;
  } catch (err) {
    console.error("QR generation error:", err);
    throw err;
  }
}