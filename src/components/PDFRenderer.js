import React, { useEffect, useRef, useState } from 'react';

export default function PDFRenderer({ url, userName, userEmail }) {
  const containerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError('');

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const pdf = await pdfjsLib.getDocument(url).promise;
        setNumPages(pdf.numPages);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '8px';
          canvas.style.borderRadius = '4px';

          // Prevent right click on each canvas
          canvas.addEventListener('contextmenu', e =>
            e.preventDefault()
          );

          const ctx = canvas.getContext('2d');

          await page.render({
            canvasContext: ctx,
            viewport
          }).promise;

          // Draw watermark on each page
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.font = 'bold 18px Arial';
          ctx.fillStyle = 'white';
          ctx.translate(viewport.width / 2, viewport.height / 2);
          ctx.rotate(-35 * Math.PI / 180);
          ctx.textAlign = 'center';
          ctx.fillText(`${userName} • ${userEmail}`, 0, 0);
          ctx.restore();

          if (containerRef.current) {
            containerRef.current.appendChild(canvas);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load PDF. Please check the file URL.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [url, userName, userEmail]);

  if (!url) return (
    <div style={{ display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100%',
      color: '#555', fontSize: '16px',
      flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '48px' }}>📄</div>
      <div>No PDF uploaded for this topic yet.</div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%',
      overflowY: 'auto', background: '#1a1a1a',
      padding: '16px', boxSizing: 'border-box',
      userSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'center', height: '200px',
          color: '#f97316', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>⏳</div>
          <div style={{ fontSize: '14px' }}>Loading PDF...</div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'center', height: '200px',
          color: '#ef4444', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>❌</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%' }} />

      {!loading && !error && numPages > 0 && (
        <div style={{ textAlign: 'center', color: '#555',
          fontSize: '12px', marginTop: '16px',
          paddingBottom: '20px' }}>
          {numPages} pages
        </div>
      )}
    </div>
  );
}
