'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

import { getStroke } from 'perfect-freehand';

interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'pencil' | 'highlighter' | 'marker' | 'shape' | 'eraser';
export type ShapeType = 'rectangle' | 'circle' | 'line';

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}

interface Stroke {
  tool?: ToolType;
  shapeType?: ShapeType;
  color: string;
  width: number;
  points: Point[];
}

interface LienzoDibujoProps {
  initialData?: any;
  onSave: (data: any) => void;
  saving?: boolean;
}

export function LienzoDibujo({ initialData, onSave, saving = false }: LienzoDibujoProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const initialPinchRef = useRef<{ dist: number, zoom: number, panX: number, panY: number, cx: number, cy: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<Stroke[][]>([[]]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const strokes = pages[currentPage] || [];
  const updateStrokes = (newStrokes: Stroke[]) => {
    const newPages = [...pages];
    newPages[currentPage] = newStrokes;
    setPages(newPages);
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  const [color, setColor] = useState('#ffffff');
  const [width, setWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');

  const colores = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
  const grosores = [2, 5, 10, 20];

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (initialData && !hasLoadedRef.current) {
      // Evita recargar si initialData es el mismo objeto pero regenerado por react
      // especialmente cuando nota.canvasData no se actualiza localmente tras guardar.
      // Wait, let's just make sure it has data to load.
      // If it's an empty object with just pdfHeader, don't mark as loaded until it has strokes/pages.
      // But actually, even if it's empty, we should only initialize ONCE.
      hasLoadedRef.current = true;

      if (initialData.pages && Array.isArray(initialData.pages)) {
        setPages(initialData.pages.map((p: any) => p.strokes || p.items || []));
      } else if (initialData.strokes && Array.isArray(initialData.strokes)) {
        setPages([initialData.strokes]);
      }
    }
  }, [initialData]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    
    const t = stroke.tool || 'pen';
    if (t === 'eraser') return; // El borrador no se dibuja

    ctx.fillStyle = stroke.color;
    ctx.strokeStyle = stroke.color;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    if (t === 'shape' && stroke.shapeType && stroke.points.length >= 2) {
      ctx.beginPath();
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      if (stroke.shapeType === 'rectangle') {
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.shapeType === 'circle') {
        const r = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
      } else if (stroke.shapeType === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
      ctx.stroke();
    } else {
      let options = {
        size: stroke.width,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      };

      if (t === 'pen') {
        options = { size: stroke.width, thinning: 0.3, smoothing: 0.6, streamline: 0.6 };
      } else if (t === 'pencil') {
        options = { size: stroke.width * 0.8, thinning: 0.1, smoothing: 0.4, streamline: 0.4 };
        ctx.globalAlpha = 0.8;
      } else if (t === 'highlighter') {
        options = { size: stroke.width * 1.5, thinning: -0.1, smoothing: 0.8, streamline: 0.8 };
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = 'multiply';
      } else if (t === 'marker') {
        options = { size: stroke.width, thinning: 0, smoothing: 0.5, streamline: 0.5 };
      }

      const rawPoints = stroke.points.map(p => [p.x, p.y]);
      const outlinePoints = getStroke(rawPoints, options);
      const pathData = getSvgPathFromStroke(outlinePoints);
      const path = new Path2D(pathData);
      ctx.fill(path);
    }

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(s => drawStroke(ctx, s));
    if (currentStroke) drawStroke(ctx, currentStroke);
  };

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    resizeCanvas();
  }, [currentPage]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [isFullscreen]);

  const getPoint = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      initialPinchRef.current = { dist, zoom, panX: pan.x, panY: pan.y, cx, cy };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      
      const init = initialPinchRef.current;
      const scaleFactor = dist / init.dist;
      let newZoom = Math.max(0.5, Math.min(init.zoom * scaleFactor, 5));

      const newPanX = cx - (init.cx - init.panX) * (newZoom / init.zoom);
      const newPanY = cy - (init.cy - init.panY) * (newZoom / init.zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchRef.current = null;
    }
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' && !e.isPrimary) return;
    if (initialPinchRef.current) return;
    setIsDrawing(true);
    setCurrentStroke({ tool, shapeType, color, width, points: [getPoint(e)] });
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke || initialPinchRef.current) {
      if (isDrawing && initialPinchRef.current) setIsDrawing(false);
      return;
    }
    const p = getPoint(e);

    if (tool === 'eraser') {
      const eraseRadius = 20 / zoom;
      const newStrokes = strokes.filter(s => {
        if (s.tool === 'shape' && s.shapeType && s.points.length >= 2) {
          const start = s.points[0];
          const end = s.points[s.points.length - 1];
          const minX = Math.min(start.x, end.x) - eraseRadius;
          const maxX = Math.max(start.x, end.x) + eraseRadius;
          const minY = Math.min(start.y, end.y) - eraseRadius;
          const maxY = Math.max(start.y, end.y) + eraseRadius;
          return !(p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
        }
        return !s.points.some(pt => Math.hypot(pt.x - p.x, pt.y - p.y) < eraseRadius);
      });

      if (newStrokes.length !== strokes.length) {
        updateStrokes(newStrokes);
      }
      return;
    }

    if (tool === 'shape') {
      setCurrentStroke({ ...currentStroke, points: [currentStroke.points[0], p] });
    } else {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, p] });
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      updateStrokes([...strokes, currentStroke]);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (strokes.length > 0) updateStrokes(strokes.slice(0, -1));
  };
  const handleClear = () => updateStrokes([]);
  
  const handleAddPage = () => {
    setPages([...pages, []]);
    setCurrentPage(pages.length);
  };

  const handleSave = () => {
    onSave({ pages: pages.map(p => ({ strokes: p })) });
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const mainWidth = containerRef.current?.clientWidth || 800;
    const mainHeight = containerRef.current?.clientHeight || 600;

    const doc = new jsPDF({
      orientation: mainWidth > mainHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [mainWidth, mainHeight]
    });

    const offscreen = document.createElement('canvas');
    offscreen.width = mainWidth;
    offscreen.height = mainHeight;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    pages.forEach((pageStrokes, index) => {
      if (index > 0) doc.addPage([mainWidth, mainHeight], mainWidth > mainHeight ? 'landscape' : 'portrait');
      
      // Draw GoodNotes Background
      ctx.fillStyle = '#f9f8eb';
      ctx.fillRect(0, 0, mainWidth, mainHeight);
      
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let y = 0; y < mainHeight; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mainWidth, y); ctx.stroke();
      }

      // Draw Header
      let yOffset = 0;
      if (initialData?.pdfHeader) {
         ctx.fillStyle = 'white';
         ctx.fillRect(10, 10, mainWidth - 20, 60);
         ctx.strokeStyle = '#000';
         ctx.strokeRect(10, 10, mainWidth - 20, 60);
         ctx.fillStyle = '#000';
         ctx.font = 'bold 16px Arial';
         
         ctx.fillText(`Obra: ${initialData.pdfHeader.obra || ''}`, 20, 30);
         ctx.fillText(`Asignado a: ${initialData.pdfHeader.asignado}`, 20, 50);
         ctx.fillText(`Fecha: ${initialData.pdfHeader.fecha}`, mainWidth - 150, 30);
         yOffset = 80;
      }

      // Draw strokes
      ctx.save();
      if (yOffset > 0) ctx.translate(0, yOffset);
      pageStrokes.forEach(s => drawStroke(ctx, s));
      ctx.restore();

      const imgData = offscreen.toDataURL('image/jpeg', 0.8);
      doc.addImage(imgData, 'JPEG', 0, 0, mainWidth, mainHeight);
    });

    doc.save('cuaderno_obras.pdf');
  };

  return (
    <div className={`flex flex-col flex-1 w-full border border-gray-700/50 rounded-xl overflow-hidden bg-background transition-all ${isFullscreen ? 'fixed inset-0 z-[60] rounded-none border-none h-[100dvh]' : ''}`}>
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-700/50 bg-surface flex flex-col md:flex-row md:flex-wrap gap-3 shadow-sm z-10 items-center justify-between">
        
        {/* Row 1 (Mobile) / Left (Desktop): Tools and Actions */}
        <div className="flex justify-between items-center w-full md:w-auto gap-4">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            {(['pen', 'pencil', 'highlighter', 'marker', 'eraser', 'shape'] as ToolType[]).map(t => (
              <button 
                key={t} 
                onClick={() => setTool(t)} 
                className={`p-2 rounded-md transition-all ${tool === t ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-white hover:bg-white/10'}`}
                title={t}
              >
                {t === 'pen' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                {t === 'pencil' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                {t === 'highlighter' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M9 17v4m6-4v4M12 3v14m0-14a3 3 0 00-3 3v7a3 3 0 006 0V6a3 3 0 00-3-3z" /></svg>}
                {t === 'marker' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                {t === 'eraser' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M4.5 14.5l8-8a2.121 2.121 0 013 3l-8 8a2.121 2.121 0 01-3-3z" /></svg>}
                {t === 'shape' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>}
              </button>
            ))}
            {tool === 'shape' && (
              <div className="flex items-center ml-2 border-l border-white/20 pl-2">
                {(['rectangle', 'circle', 'line'] as ShapeType[]).map(st => (
                   <button key={st} onClick={() => setShapeType(st)} className={`p-1 rounded ${shapeType === st ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                     {st === 'rectangle' && <div className="w-4 h-4 border-2 border-current" />}
                     {st === 'circle' && <div className="w-4 h-4 border-2 border-current rounded-full" />}
                     {st === 'line' && <div className="w-4 h-4 border-b-2 border-current transform -rotate-45" />}
                   </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={handleUndo} disabled={strokes.length === 0} className="p-2 text-text-muted hover:text-white disabled:opacity-50" title="Deshacer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={handleClear} className="p-2 text-red-400 hover:text-red-300" title="Limpiar hoja">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button 
              onClick={async () => {
                if (!isFullscreen) {
                  setIsFullscreen(true);
                  try {
                    const el = document.documentElement;
                    if (el.requestFullscreen) {
                      await el.requestFullscreen().catch(() => {});
                    }
                    const orientation = window.screen?.orientation as any;
                    if (orientation?.lock) {
                      await orientation.lock('landscape').catch(() => {});
                    }
                  } catch (e) {
                    // Ignorar errores en dispositivos que no soportan la API (ej: iOS Safari)
                  }
                } else {
                  setIsFullscreen(false);
                  try {
                    const orientation = window.screen?.orientation as any;
                    if (orientation?.unlock) {
                      orientation.unlock();
                    }
                    if (document.fullscreenElement && document.exitFullscreen) {
                      await document.exitFullscreen().catch(() => {});
                    }
                  } catch (e) {
                    // Ignorar
                  }
                }
              }} 
              className="p-2 text-text-muted hover:text-white" 
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h4v4M20 10h-4V6M14 20v-4h4M10 4v4H6" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              )}
            </button>
            <button onClick={handleExportPDF} className="p-2 text-blue-400 hover:text-blue-300" title="Exportar a PDF">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile) / Middle (Desktop): Colors and Widths */}
        <div className="flex justify-start items-center w-full md:w-auto gap-4">
          <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-lg">
            {colores.map(c => (
              <button 
                key={c} 
                onClick={() => setColor(c)} 
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>

          <div className="flex gap-2 items-center bg-white/5 p-1.5 rounded-lg">
            {grosores.map(w => (
              <button 
                key={w} 
                onClick={() => setWidth(w)} 
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${width === w ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <div className="rounded-full bg-current" style={{ width: w, height: w }} />
              </button>
            ))}
          </div>
        </div>

        {/* Row 3 (Mobile) / Right (Desktop): Pagination and Save */}
        <div className="flex justify-center w-full md:w-auto gap-2 items-center">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))} 
              disabled={currentPage === 0}
              className="p-1 text-text-muted hover:text-white disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs text-text-muted min-w-[3rem] text-center">
              {currentPage + 1} / {pages.length}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} 
              disabled={currentPage === pages.length - 1}
              className="p-1 text-text-muted hover:text-white disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={handleAddPage} className="p-1 text-accent hover:text-accent-hover ml-1 border-l border-white/10 pl-2" title="Añadir hoja">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          
          <div className="md:hidden">
            <Button onClick={handleSave} disabled={saving} className="!p-2 h-[34px] w-[34px] flex-shrink-0 flex items-center justify-center rounded-lg" title="Guardar">
               {saving ? <span className="animate-pulse">...</span> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
            </Button>
          </div>
          <div className="hidden md:block">
            <Button onClick={handleSave} disabled={saving} className="!py-1 !px-3 text-xs h-[34px] flex-shrink-0">
                {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Area with GoodNotes Style */}
      <div 
        ref={containerRef} 
        className="flex-1 relative overflow-hidden bg-[#e0dfd5]"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div 
          className="absolute inset-0 cursor-crosshair origin-top-left"
          style={{ 
            backgroundColor: '#f9f8eb',
            backgroundImage: 'linear-gradient(transparent 19px, #e0e0e0 20px)', 
            backgroundSize: '100% 20px', 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: initialPinchRef.current ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerOut={stopDrawing}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
