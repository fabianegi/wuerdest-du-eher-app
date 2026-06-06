"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  value: string;
  size?: number;
}

// QR Code mit dickem Rahmen. Der eigentliche Code ist in unserer
// "Ink" Farbe gehalten und sitzt auf einem hellen Cream Hintergrund,
// damit Handy Kameras ihn auch unter schlechtem Licht zuverlässig
// scannen können. Fehlerkorrektur Level "M" (medium) ist ein guter
// Mittelweg zwischen Robustheit und Datenmenge.
export default function QrCode({ value, size = 240 }: Props) {
  return (
    <div className="inline-block bg-cream p-4 brut-border-lg">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#F7F3E7"
        fgColor="#0E0E0D"
        level="M"
      />
    </div>
  );
}
