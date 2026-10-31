import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import styles from './Together.module.css';

// Chrome on Android reads QR codes itself (BarcodeDetector); anything else falls back to jsQR on the camera frames
interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}

/** Opens the back camera and calls `onCode` with the first QR code it sees. */
export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const done = useRef(false);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const found = (code: string) => {
      if (done.current) return;
      done.current = true;
      onCodeRef.current(code);
    };
    // Tests (and a debugging phone) can hand over a code without a camera
    const onTest = (e: Event) => found((e as CustomEvent<string>).detail);
    window.addEventListener('tidepool-code', onTest);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        setProblem('The camera is needed to scan the other phone’s code. Allow it in Chrome when asked, then try again.');
        return;
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      const native = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const tick = async () => {
        if (stopped || done.current) return;
        if (video.readyState >= 2) {
          try {
            if (native) {
              const [hit] = await native.detect(video);
              if (hit) found(hit.rawValue);
            } else {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const hit = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
              if (hit) found(hit.data);
            }
          } catch {
            // a frame that couldn't be read; try the next one
          }
        }
        timer = window.setTimeout(tick, 180);
      };
      tick();
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener('tidepool-code', onTest);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className={styles.scanner}>
      {problem ? (
        <p className={styles.problem}>{problem}</p>
      ) : (
        <>
          <video ref={videoRef} className={styles.video} playsInline muted aria-label="Camera view for scanning" />
          <div className={styles.frame} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
