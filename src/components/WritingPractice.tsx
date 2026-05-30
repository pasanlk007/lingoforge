'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Eraser, Pen, Highlighter, RotateCcw } from 'lucide-react';
import { Slider } from './ui/slider';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { cn } from '@/lib/utils';

interface WritingPracticeProps {
  letter: string;
}

const COLORS = ['#FFFFFF', '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#A855F7'];

export function WritingPractice({ letter }: WritingPracticeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter'>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(10);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const drawGuide = useCallback((ctx: CanvasRenderingContext2D, char: string, width: number, height: number) => {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgHsl = computedStyle.getPropertyValue('--muted').trim() || '240 4% 20%';
    const fgHsl = computedStyle.getPropertyValue('--muted-foreground').trim() || '0 0% 63.9%';

    // 1. Clear and setup background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `hsl(${bgHsl} / 0.5)`;
    ctx.fillRect(0, 0, width, height);
    
    // 2. Precise Auto-fit logic
    const maxWidth = width;
    const maxHeight = height;
    
    let fontSize = Math.min(width, height); // Base scale
    ctx.font = `bold ${fontSize}px sans-serif`;
    
    // Measure exact ink bounds
    const metrics = ctx.measureText(char);
    const charWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const charHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    // Calculate ratios based on precise dimensions
    const widthRatio = maxWidth / charWidth;
    const heightRatio = maxHeight / charHeight;
    
    // Apply 85% scale for comfortable padding
    const fitRatio = Math.min(widthRatio, heightRatio) * 0.85;
    fontSize *= fitRatio;
    
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = `hsl(${fgHsl} / 0.2)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw centered guide
    ctx.fillText(char, width / 2, height / 2);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    
    context.resetTransform();
    context.scale(dpr, dpr);
    contextRef.current = context;

    drawGuide(context, letter, width, height);
  }, [letter, drawGuide]);

  useEffect(() => {
    initCanvas();
    
    const observer = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width > 0) {
        initCanvas();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [initCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const container = containerRef.current;
    if (canvas && context && container) {
      const { width, height } = container.getBoundingClientRect();
      drawGuide(context, letter, width, height);
    }
  };

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const context = contextRef.current;
    if (!context) return;
    
    const { offsetX, offsetY } = getCoords(e);
    context.globalAlpha = tool === 'pen' ? 1.0 : 0.4;
    context.strokeStyle = tool === 'highlighter' ? '#FBBF24' : color;
    context.lineWidth = size;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    const context = contextRef.current;
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoords(e);
    const context = contextRef.current;
    if (context) {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <Card ref={containerRef} className="w-full aspect-square p-0 overflow-hidden relative border-2 bg-muted/20 shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none absolute inset-0"
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={finishDrawing}
          onTouchMove={draw}
          style={{ touchAction: 'none' }}
        />
      </Card>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-card border shadow-lg">
          <ToggleGroup type="single" value={tool} onValueChange={(value: 'pen' | 'highlighter') => value && setTool(value)} className="gap-1">
            <ToggleGroupItem value="pen" aria-label="Pen" className="h-9 w-9 data-[state=on]:bg-primary/20">
              <Pen className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="highlighter" aria-label="Highlighter" className="h-9 w-9 data-[state=on]:bg-yellow-500/20">
              <Highlighter className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <div className="flex-1 flex items-center gap-3 px-2">
            <Slider
                value={[size]}
                onValueChange={(v) => setSize(v[0])}
                min={4}
                max={40}
                step={2}
                className="w-full"
              />
          </div>

          <Button variant="ghost" size="icon" onClick={clearCanvas} className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-card border shadow-lg overflow-x-auto no-scrollbar">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              disabled={tool === 'highlighter'}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shrink-0",
                color === c && tool === 'pen' ? "border-primary ring-2 ring-primary/20 scale-110" : "border-background/10",
                tool === 'highlighter' && 'opacity-30 cursor-not-allowed grayscale'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
