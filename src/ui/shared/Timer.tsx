import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  startedAt: number;
  stoppedAt?: number;
  className?: string;
  style?: React.CSSProperties;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function Timer({ startedAt, stoppedAt, className = '', style }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stoppedAt) {
      // Timer is stopped — show final elapsed time
      setElapsed(Math.floor((stoppedAt - startedAt) / 1000));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Timer is running
    const update = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };
    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt, stoppedAt]);

  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${className}`} style={style}>
      ⏱ {formatTime(elapsed)}
    </span>
  );
}