'use client';
import { useRef, useState, useEffect } from 'react';
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter'>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(10);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Function to draw the background guide letter
  const drawGuideLetter = (ctx: CanvasRenderingContext2D, char: string, cssWidth: number, cssHeight: number) => {
    ctx.clearRect(0, 0, cssWidth, cssHeight); // Use CSS dimensions for clearing in scaled context
    ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.2)';
    ctx.font = `bold ${cssWidth * 0.7}px sans-serif`; // Font size based on CSS width
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, cssWidth / 2, cssHeight / 2);
  };

  // Effect for initial setup and resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    contextRef.current = context;

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect(); // CSS pixels
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      context.resetTransform(); // Reset transform before scaling
      context.scale(dpr, dpr); // Scale once

      // All subsequent drawing operations should use CSS pixel dimensions.
      drawGuideLetter(context, letter, width, height);
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial setup

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [letter]);

  // Function to clear user drawings and redraw the guide letter
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      const { width, height } = canvas.getBoundingClientRect();
      // No transform changes needed, just redraw the guide letter which clears everything
      drawGuideLetter(context, letter, width, height);
    }
  };

  // Helper to get coordinates correctly on mouse and touch events
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
    e.preventDefault();
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

  const finishDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const context = contextRef.current;
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoords(e);
    const context = contextRef.current;
    if (context) {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }
  };

  return (
    <Card className="w-full aspect-square max-w-md mx-auto p-4 overflow-hidden">
      <div className="relative w-full h-full">
         <canvas
            ref={canvasRef}
            className="w-full h-full rounded-md bg-muted/50 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={finishDrawing}
            onTouchMove={draw}
         />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-background/50 border">
          <ToggleGroup type="single" value={tool} onValueChange={(value: 'pen' | 'highlighter') => value && setTool(value)} className="gap-2">
            <ToggleGroupItem value="pen" aria-label="Pen">
              <Pen className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="highlighter" aria-label="Highlighter">
              <Highlighter className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2 h-6 rounded-full" style={{ backgroundColor: tool === 'pen' ? color : '#FBBF24', opacity: tool === 'pen' ? 1 : 0.3 }}/>
            <Slider
                value={[size]}
                onValueChange={(v) => setSize(v[0])}
                min={2}
                max={40}
                step={2}
              />
          </div>
          <Button variant="ghost" size="icon" onClick={clearCanvas}>
            <Eraser className="h-5 w-5" />
          </Button>
        </div>
        {/* Color Palette */}
        <div className="flex items-center justify-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              disabled={tool === 'highlighter'}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                color === c && tool === 'pen' ? "border-primary scale-110" : "border-transparent",
                tool === 'highlighter' && 'opacity-30 cursor-not-allowed'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
