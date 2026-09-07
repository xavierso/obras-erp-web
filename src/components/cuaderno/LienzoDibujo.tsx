'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'pencil' | 'highlighter' | 'marker' | 'shape';
export type ShapeType = 'rectangle' | 'circle' | 'line';

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
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = t === 'highlighter' ? 'square' : 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = t === 'highlighter' ? 0.4 : (t === 'pencil' ? 0.8 : 1.0);

    if (t === 'shape' && stroke.shapeType && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      if (stroke.shapeType === 'rectangle') {
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.shapeType === 'circle') {
        const r = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.arc(start.x, start.y, r, 0, 2 * Math.PI);
      } else if (stroke.shapeType === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
    } else {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
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

  const getPoint = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
    setIsDrawing(true);
    setCurrentStroke({ tool, shapeType, color, width, points: [getPoint(e)] });
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    const p = getPoint(e);
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
    <div className="flex flex-col flex-1 w-full border border-gray-700/50 rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-700/50 bg-surface flex flex-col md:flex-row gap-3 shadow-sm z-10 justify-between">
        
        {/* Tools, Colors, Widths */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            {(['pen', 'pencil', 'highlighter', 'marker', 'shape'] as ToolType[]).map(t => (
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

          <div className="h-6 w-px bg-white/20 mx-1 hidden md:block" />

          {/* Colors */}
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

          <div className="h-6 w-px bg-white/20 mx-1 hidden md:block" />

          {/* Widths */}
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

        {/* Actions & Pagination */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
          
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
            <button onClick={handleAddPage} className="p-1 text-accent hover:text-accent-hover ml-1" title="Añadir hoja">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end flex-1 min-w-[200px]">
            <button onClick={handleUndo} disabled={strokes.length === 0} className="p-2 text-text-muted hover:text-white disabled:opacity-50" title="Deshacer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={handleClear} className="p-2 text-red-400 hover:text-red-300" title="Limpiar hoja">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button onClick={handleExportPDF} className="p-2 text-blue-400 hover:text-blue-300" title="Exportar a PDF">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <Button onClick={handleSave} disabled={saving} className="ml-1 !py-1 !px-3 text-xs h-8 flex-shrink-0">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Area with GoodNotes Style */}
      <div 
        ref={containerRef} 
        className="flex-1 relative cursor-crosshair overflow-hidden"
        style={{ 
          backgroundColor: '#f9f8eb',
          backgroundImage: 'linear-gradient(transparent 19px, #e0e0e0 20px)', 
          backgroundSize: '100% 20px', 
          touchAction: 'none' 
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
