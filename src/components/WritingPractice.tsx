'use client';
import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Eraser } from 'lucide-react';

interface WritingPracticeProps {
  letter: string;
}

export function WritingPractice({ letter }: WritingPracticeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawLetter = (context: CanvasRenderingContext2D, char: string) => {
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height); // Clear canvas first
    context.fillStyle = 'hsl(var(--muted-foreground) / 0.2)';
    context.font = `bold ${width * 0.7}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(char, width / 2, height / 2);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        drawLetter(context, letter);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          const { width, height } = canvas.getBoundingClientRect();
          canvas.width = width;
          canvas.height = height;
          drawLetter(context, letter);
        }
      }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // initial draw

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [letter]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) { // Touch event
        return {
          offsetX: e.touches[0].clientX - rect.left,
          offsetY: e.touches[0].clientY - rect.top,
        };
    }
    // Mouse event
    return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { offsetX, offsetY } = getCoords(e);
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      context.strokeStyle = 'hsl(var(--accent))';
      context.lineWidth = 10;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const finishDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      context.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoords(e);
    const context = canvasRef.current?.getContext('2d');
    if (context) {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }
  };


  return (
    <Card className="w-full aspect-square max-w-md mx-auto p-4">
      <div className="relative w-full h-full">
         <canvas
            ref={canvasRef}
            className="w-full h-full rounded-md bg-muted/50 cursor-crosshair touch-none"
            onMouseDown={(e) => startDrawing(e)}
            onMouseUp={(e) => finishDrawing(e)}
            onMouseMove={(e) => draw(e)}
            onMouseLeave={(e) => finishDrawing(e)}
            onTouchStart={(e) => startDrawing(e)}
            onTouchEnd={(e) => finishDrawing(e)}
            onTouchMove={(e) => draw(e)}
         />
      </div>
      <div className="mt-4 flex justify-center">
        <Button variant="outline" onClick={clearCanvas}>
          <Eraser className="mr-2" /> Clear
        </Button>
      </div>
    </Card>
  );
}
