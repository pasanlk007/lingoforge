'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Eraser, Pen, Highlighter } from 'lucide-react';
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

  // Helper to draw the background guide letter
  const drawGuide = useCallback((ctx: CanvasRenderingContext2D, char: string, width: number, height: number) => {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgHsl = computedStyle.getPropertyValue('--muted').trim() || '240 4% 20%';
    const fgHsl = computedStyle.getPropertyValue('--muted-foreground').trim() || '0 0% 63.9%';

    // Clear and fill background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = `hsl(${bgHsl} / 0.5)`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw the guide letter
    ctx.fillStyle = `hsl(${fgHsl} / 0.2)`;
    ctx.font = `bold ${Math.min(width, height) * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.resetTransform();
    context.scale(dpr, dpr);
    contextRef.current = context;

    drawGuide(context, letter, width, height);
  }, [letter, drawGuide]);

  useEffect(() => {
    initCanvas();
    
    const observer = new ResizeObserver(() => {
      initCanvas();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [initCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      const { width, height } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
      if (width > 0 && height > 0) {
        drawGuide(context, letter, width, height);
      }
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
    context.globalAlpha = tool === 'pen' ? 1.0 : 0.3;
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
      <Card ref={containerRef} className="w-full aspect-square p-0 overflow-hidden relative border-2 bg-muted/20">
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
          <div className="flex-1 flex items-center gap-2 px-2">
            <div className="w-2 h-6 rounded-full shrink-0" style={{ backgroundColor: tool === 'pen' ? color : '#FBBF24', opacity: tool === 'pen' ? 1 : 0.3 }}/>
            <Slider
                value={[size]}
                onValueChange={(v) => setSize(v[0])}
                min={2}
                max={40}
                step={2}
              />
          </div>
          <Button variant="ghost" size="icon" onClick={clearCanvas} className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive">
            <Eraser className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-card border shadow-lg">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              disabled={tool === 'highlighter'}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95",
                color === c && tool === 'pen' ? "border-primary scale-110" : "border-transparent",
                tool === 'highlighter' && 'opacity-30 cursor-not-allowed'
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
