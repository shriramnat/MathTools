import { useEffect, useState } from 'react';
import { useTheme } from '../../theme/themeProvider';

interface SessionResultOverlayProps {
  type: 'celebration' | 'feedback';
  correct: number;
  total: number;
  onClose: () => void;
}

/** Confetti particle */
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'star';
}

const CONFETTI_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 40,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

export function SessionResultOverlay({
  type,
  correct,
  total,
  onClose,
}: SessionResultOverlayProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [particles] = useState(() => generateParticles(type === 'celebration' ? 60 : 0));

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss celebration after 5 seconds
  useEffect(() => {
    if (type === 'celebration') {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleClose}
    >
      {/* Confetti particles (celebration only) */}
      {type === 'celebration' && particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            ...(p.shape === 'star' ? {
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              backgroundColor: p.color,
            } : {}),
          }}
        />
      ))}

      {/* Modal card */}
      <div
        className={`relative rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transition-all duration-300 ${
          visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'
        }`}
        style={{ backgroundColor: theme.colors.bgCard }}
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'celebration' ? (
          <>
            {/* Star burst animation */}
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: theme.colors.accent }}
            >
              Perfect Score!
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              You got all <span className="font-bold" style={{ color: theme.colors.success }}>{total}</span> questions right!
            </p>
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: Math.min(total, 10) }, (_, i) => (
                <span
                  key={i}
                  className="text-2xl"
                  style={{
                    animation: `star-pop 0.4s ease-out ${i * 0.1}s both`,
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-400">Amazing work! 🌟</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📝</div>
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme.colors.accent }}
            >
              Session Complete
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              You got{' '}
              <span className="font-bold" style={{ color: correct > 0 ? theme.colors.success : theme.colors.error }}>
                {correct}
              </span>{' '}
              out of{' '}
              <span className="font-bold">{total}</span>{' '}
              questions right!
            </p>
            <p className="text-sm text-gray-400 mb-4">Better luck next time. Keep practicing! 💪</p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: theme.colors.accent }}
            >
              OK
            </button>
          </>
        )}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes star-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}