import { Eraser, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type Point = { x: number; y: number };

export type SignaturePadProps = {
  /** Receives a PNG data URL, or null when cleared. */
  onChange?: (dataUrl: string | null) => void;
  height?: number;
  /** Stroke color; defaults to the text color. */
  color?: string;
  placeholder?: string;
  clearLabel?: string;
  undoLabel?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Draw-to-sign canvas with undo and clear. Scales for high-DPI screens and
 * works with mouse, pen and touch (pointer events).
 */
export function SignaturePad({
  onChange,
  height = 180,
  color,
  placeholder = 'Sign here',
  clearLabel = 'Clear',
  undoLabel = 'Undo',
  disabled,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const drawing = useRef<Point[] | null>(null);

  const paint = (all: Point[][]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = color ?? getComputedStyle(canvas).color;
    for (const stroke of all) {
      ctx.beginPath();
      stroke.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (stroke.length === 1) ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y);
      ctx.stroke();
    }
  };

  // Size the backing store to the element (and device pixel ratio).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      paint(strokes);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
    // Repaint uses the latest strokes through the closure on each resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const point = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const commit = (next: Point[][]) => {
    setStrokes(next);
    onChange?.(next.length ? (canvasRef.current?.toDataURL('image/png') ?? null) : null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative overflow-hidden rounded-lg border border-dashed bg-muted/30">
        {strokes.length === 0 && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-muted-foreground/40" />
        <canvas
          ref={canvasRef}
          aria-label={placeholder}
          role="img"
          style={{ height }}
          className={cn(
            'block w-full touch-none text-foreground',
            disabled ? 'cursor-not-allowed' : 'cursor-crosshair',
          )}
          onPointerDown={(e) => {
            if (disabled) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = [point(e)];
            paint([...strokes, drawing.current]);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            drawing.current.push(point(e));
            paint([...strokes, drawing.current]);
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            const stroke = drawing.current;
            drawing.current = null;
            commit([...strokes, stroke]);
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || strokes.length === 0}
          onClick={() => commit(strokes.slice(0, -1))}
        >
          <Undo2 /> {undoLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || strokes.length === 0}
          onClick={() => commit([])}
        >
          <Eraser /> {clearLabel}
        </Button>
      </div>
    </div>
  );
}
