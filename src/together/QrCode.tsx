import { useMemo } from 'react';
import { create } from 'qrcode';

/**
 * A QR code drawn as one svg path. Always dark on white with a quiet zone, whatever the palette, since that is what
 * cameras read best.
 */
export function QrCode({ text, size, label }: { text: string; size: number; label: string }) {
  const { path, n } = useMemo(() => {
    const qr = create(text, { errorCorrectionLevel: 'L' });
    const count = qr.modules.size;
    let d = '';
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) if (qr.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
    return { path: d, n: count };
  }, [text]);
  const quiet = 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`}
      role="img"
      aria-label={label}
      data-code={text}
      shapeRendering="crispEdges"
    >
      <rect x={-quiet} y={-quiet} width={n + quiet * 2} height={n + quiet * 2} rx={2} fill="#FFFFFF" />
      <path d={path} fill="#10202A" />
    </svg>
  );
}
