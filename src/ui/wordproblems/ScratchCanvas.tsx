import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../../theme/themeProvider';

interface ScratchCanvasProps {
  problemId: string;
}

export function ScratchCanvas({ problemId }: ScratchCanvasProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      // Set drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    setContext(ctx);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Clear canvas when problem changes
  useEffect(() => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [problemId, context]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;

    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="lg:w-96 flex flex-col">
      <div
        className="flex-1 rounded-2xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: theme.colors.bgTopBar,
          borderColor: theme.colors.cardBorder,
          borderWidth: 2,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.cardBorder }}>
          <h3 className="text-sm font-bold text-gray-700">Scratch Paper</h3>
          <button
            onClick={clearCanvas}
            className="px-3 py-1 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>

        {/* Canvas */}
        <div className="relative bg-white" style={{ height: 'calc(100vh - 400px)', minHeight: '300px' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ cursor: 'crosshair' }}
          />
        </div>

        {/* Hint */}
        <div className="p-3 text-xs text-gray-500 text-center border-t" style={{ borderColor: theme.colors.cardBorder }}>
          Draw here to work out your answer
        </div>
      </div>
    </div>
  );
}