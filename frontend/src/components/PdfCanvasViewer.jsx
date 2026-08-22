import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Mobile WebViews (Android system WebView / Capacitor) have no built-in PDF
// renderer, so an <iframe src="blob:..."> just shows blank. Render each page
// to a canvas ourselves so the preview works the same everywhere.
const PdfCanvasViewer = ({ url }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const container = containerRef.current;
    if (container) container.innerHTML = '';

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page     = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas   = document.createElement('canvas');
          canvas.width  = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'w-full h-auto max-w-2xl shadow-sm mb-4 bg-white';
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container?.appendChild(canvas);
        }
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8 text-center">
        Couldn't preview this PDF. Try downloading it instead.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-4">
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-primary" />
        </div>
      )}
      <div ref={containerRef} className="flex flex-col items-center" />
    </div>
  );
};

export default PdfCanvasViewer;
