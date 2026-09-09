'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

import { getStroke } from 'perfect-freehand';

interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'pencil' | 'highlighter' | 'marker' | 'shape' | 'eraser' | 'selector';
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
  id?: string;
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

  // Selection & Transform State
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ start: Point, end: Point } | null>(null);
  
  type InteractionMode = 'draw' | 'select_box' | 'move_selection' | 'resize_tl' | 'resize_tr' | 'resize_bl' | 'resize_br';
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('draw');
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragOriginalStrokes, setDragOriginalStrokes] = useState<Stroke[]>([]);
  const [clipboard, setClipboard] = useState<Stroke[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);

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
        setPages(initialData.pages.map((p: any) => 
          (p.strokes || p.items || []).map((s: Stroke) => ({ ...s, id: s.id || crypto.randomUUID() }))
        ));
      } else if (initialData.strokes && Array.isArray(initialData.strokes)) {
        setPages([initialData.strokes.map((s: Stroke) => ({ ...s, id: s.id || crypto.randomUUID() }))]);
      }
    }
  }, [initialData]);

  const getBoundingBox = (strokeList: Stroke[]) => {
    if (!strokeList.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokeList.forEach(s => {
      s.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });
    if (minX === Infinity) return null;
    return { x: minX - 5, y: minY - 5, width: maxX - minX + 10, height: maxY - minY + 10 };
  };

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

    if (selectionBox) {
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      const x = Math.min(selectionBox.start.x, selectionBox.end.x);
      const y = Math.min(selectionBox.start.y, selectionBox.end.y);
      const w = Math.abs(selectionBox.start.x - selectionBox.end.x);
      const h = Math.abs(selectionBox.start.y - selectionBox.end.y);
      ctx.rect(x, y, w, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (selectedStrokeIds.length > 0) {
      const selectedStrokes = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
      const bb = getBoundingBox(selectedStrokes);
      if (bb) {
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.rect(bb.x, bb.y, bb.width, bb.height);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        const handleSize = 8;
        const drawHandle = (hx: number, hy: number) => {
          ctx.beginPath();
          ctx.rect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        };
        drawHandle(bb.x, bb.y);
        drawHandle(bb.x + bb.width, bb.y);
        drawHandle(bb.x, bb.y + bb.height);
        drawHandle(bb.x + bb.width, bb.y + bb.height);
      }
    }
  };

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke, selectionBox, selectedStrokeIds]);

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
    const p = getPoint(e);

    if (tool === 'selector') {
      let clickedHandle: InteractionMode = 'draw';
      
      if (selectedStrokeIds.length > 0) {
        const selectedStrokes = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
        const bb = getBoundingBox(selectedStrokes);
        if (bb) {
          const handleSize = 12;
          const inHandle = (hx: number, hy: number) => 
            Math.abs(p.x - hx) < handleSize && Math.abs(p.y - hy) < handleSize;

          if (inHandle(bb.x, bb.y)) clickedHandle = 'resize_tl';
          else if (inHandle(bb.x + bb.width, bb.y)) clickedHandle = 'resize_tr';
          else if (inHandle(bb.x, bb.y + bb.height)) clickedHandle = 'resize_bl';
          else if (inHandle(bb.x + bb.width, bb.y + bb.height)) clickedHandle = 'resize_br';
          else if (p.x >= bb.x && p.x <= bb.x + bb.width && p.y >= bb.y && p.y <= bb.y + bb.height) {
            clickedHandle = 'move_selection';
          }
        }
      }

      if (clickedHandle !== 'draw') {
        setInteractionMode(clickedHandle);
        setDragStartPoint(p);
        const originalStrokes = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
        setDragOriginalStrokes(JSON.parse(JSON.stringify(originalStrokes)));
      } else {
        setInteractionMode('select_box');
        setSelectedStrokeIds([]);
        setSelectionBox({ start: p, end: p });
      }
      return;
    }

    setInteractionMode('draw');
    setCurrentStroke({ tool, shapeType, color, width, points: [p] });
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || initialPinchRef.current) {
      if (isDrawing && initialPinchRef.current) setIsDrawing(false);
      return;
    }
    const p = getPoint(e);

    if (tool === 'selector') {
      if (interactionMode === 'select_box' && selectionBox) {
        setSelectionBox({ ...selectionBox, end: p });
      } else if (interactionMode === 'move_selection' && dragStartPoint) {
        const dx = p.x - dragStartPoint.x;
        const dy = p.y - dragStartPoint.y;
        const newStrokes = strokes.map(s => {
          if (s.id && selectedStrokeIds.includes(s.id)) {
            const original = dragOriginalStrokes.find(os => os.id === s.id);
            if (original) {
              return { ...s, points: original.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy })) };
            }
          }
          return s;
        });
        updateStrokes(newStrokes);
      } else if (interactionMode.startsWith('resize_') && dragStartPoint) {
        const originalBb = getBoundingBox(dragOriginalStrokes);
        if (originalBb) {
          let scaleX = 1, scaleY = 1;
          const { x, y, width: w, height: h } = originalBb;
          
          if (interactionMode === 'resize_br') {
            scaleX = Math.max(0.1, (p.x - x) / w);
            scaleY = Math.max(0.1, (p.y - y) / h);
          } else if (interactionMode === 'resize_bl') {
            scaleX = Math.max(0.1, ((x + w) - p.x) / w);
            scaleY = Math.max(0.1, (p.y - y) / h);
          } else if (interactionMode === 'resize_tr') {
            scaleX = Math.max(0.1, (p.x - x) / w);
            scaleY = Math.max(0.1, ((y + h) - p.y) / h);
          } else if (interactionMode === 'resize_tl') {
            scaleX = Math.max(0.1, ((x + w) - p.x) / w);
            scaleY = Math.max(0.1, ((y + h) - p.y) / h);
          }
          
          let originX = x, originY = y;
          if (interactionMode === 'resize_br') { originX = x; originY = y; }
          else if (interactionMode === 'resize_bl') { originX = x + w; originY = y; }
          else if (interactionMode === 'resize_tr') { originX = x; originY = y + h; }
          else if (interactionMode === 'resize_tl') { originX = x + w; originY = y + h; }

          const newStrokes = strokes.map(s => {
            if (s.id && selectedStrokeIds.includes(s.id)) {
              const original = dragOriginalStrokes.find(os => os.id === s.id);
              if (original) {
                return {
                  ...s,
                  points: original.points.map(pt => ({
                    x: originX + (pt.x - originX) * scaleX,
                    y: originY + (pt.y - originY) * scaleY
                  }))
                };
              }
            }
            return s;
          });
          updateStrokes(newStrokes);
        }
      }
      return;
    }

    if (!currentStroke) return;

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
    if (!isDrawing) return;
    
    if (tool === 'selector' && interactionMode === 'select_box' && selectionBox) {
      const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
      const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
      const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
      const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);
      
      const newSelected = strokes.filter(s => {
        return s.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
      }).map(s => s.id as string).filter(Boolean);
      
      setSelectedStrokeIds(newSelected);
      setSelectionBox(null);
    }

    if (tool !== 'selector' && currentStroke) {
      const strokeWithId = { ...currentStroke, id: crypto.randomUUID() };
      updateStrokes([...strokes, strokeWithId]);
      setCurrentStroke(null);
    }
    
    setInteractionMode('draw');
    setDragStartPoint(null);
    setIsDrawing(false);
  };

  const deleteSelection = () => {
    updateStrokes(strokes.filter(s => !s.id || !selectedStrokeIds.includes(s.id)));
    setSelectedStrokeIds([]);
  };

  const copySelection = () => {
    const selected = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
    setClipboard(JSON.parse(JSON.stringify(selected)));
  };

  const cutSelection = () => {
    copySelection();
    deleteSelection();
  };

  const duplicateSelection = () => {
    const selected = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
    const copies = selected.map(s => {
      return {
        ...JSON.parse(JSON.stringify(s)),
        id: crypto.randomUUID(),
        points: s.points.map((p: Point) => ({ x: p.x + 20, y: p.y + 20 }))
      };
    });
    updateStrokes([...strokes, ...copies]);
    setSelectedStrokeIds(copies.map(c => c.id as string));
  };

  const pasteFromClipboard = () => {
    if (clipboard.length === 0) return;
    const copies = clipboard.map(s => {
      return {
        ...JSON.parse(JSON.stringify(s)),
        id: crypto.randomUUID(),
        points: s.points.map((p: Point) => ({ x: p.x + 20, y: p.y + 20 }))
      };
    });
    updateStrokes([...strokes, ...copies]);
    setSelectedStrokeIds(copies.map(c => c.id as string));
    setClipboard(copies);
  };

  const handleUndo = () => {
    if (strokes.length > 0) updateStrokes(strokes.slice(0, -1));
  };
  const handleClear = () => updateStrokes([]);

  let floatingMenuPos = null;
  if (selectedStrokeIds.length > 0) {
    const selectedStrokes = strokes.filter(s => s.id && selectedStrokeIds.includes(s.id));
    const bb = getBoundingBox(selectedStrokes);
    if (bb && containerRef.current) {
      floatingMenuPos = {
        left: bb.x * zoom + pan.x,
        top: Math.max(0, bb.y * zoom + pan.y - 40)
      };
    }
  }

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
            {(['selector', 'pen', 'pencil', 'highlighter', 'marker', 'eraser', 'shape'] as ToolType[]).map(t => (
              <button 
                key={t} 
                onClick={() => setTool(t)} 
                className={`p-2 rounded-md transition-all ${tool === t ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-white hover:bg-white/10'}`}
                title={t}
              >
                {t === 'selector' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
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
          <div className="flex gap-1.5 bg-white/5 p-1.5 rounded-lg flex-wrap items-center">
            {[...colores, ...customColors].map(c => (
              <button 
                key={c} 
                onClick={() => setColor(c)} 
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} 
                style={{ backgroundColor: c }} 
                title={c}
              />
            ))}
            <div className="w-px h-4 bg-gray-600 mx-1"></div>
            <label className="cursor-pointer w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center hover:bg-white/10" title="Color personalizado">
               <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
               <input 
                 type="color" 
                 className="opacity-0 absolute w-0 h-0" 
                 onChange={(e) => {
                   const newColor = e.target.value;
                   setColor(newColor);
                   if (!colores.includes(newColor) && !customColors.includes(newColor)) {
                     setCustomColors(prev => [newColor, ...prev].slice(0, 5));
                   }
                 }}
               />
            </label>
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
            backgroundSize: '100% 20px'
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              cursor: tool === 'selector' ? (interactionMode !== 'draw' && interactionMode !== 'select_box' ? 'grabbing' : 'crosshair') : 'crosshair'
            }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {/* Menú Flotante de Selección */}
          {floatingMenuPos && (
            <div 
              className="absolute bg-surface border border-gray-700 shadow-xl rounded-lg flex items-center p-1 gap-1 z-50 text-text-muted"
              style={{ left: floatingMenuPos.left, top: floatingMenuPos.top }}
            >
              <button onClick={cutSelection} className="p-1.5 hover:bg-white/10 hover:text-white rounded" title="Cortar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
              </button>
              <button onClick={copySelection} className="p-1.5 hover:bg-white/10 hover:text-white rounded" title="Copiar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
              <button onClick={duplicateSelection} className="p-1.5 hover:bg-white/10 hover:text-white rounded" title="Duplicar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
              </button>
              <div className="w-px h-4 bg-gray-600 mx-1"></div>
              <button onClick={deleteSelection} className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded" title="Eliminar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
          {/* Botón flotante para pegar (si hay algo en el portapapeles) */}
          {clipboard.length > 0 && (
            <button
              onClick={pasteFromClipboard}
              className="absolute top-4 right-4 bg-surface border border-gray-700 shadow-xl rounded-lg p-2 text-text-muted hover:text-white hover:bg-white/10 z-50 flex items-center gap-2"
              title="Pegar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <span className="text-sm font-medium">Pegar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
