'use client';

import { useEffect } from 'react';
import { HEARTS, HeartShape } from '../lib/flow';

type HeartProps = {
  heart: HeartShape;
  reducedMotion: boolean;
  onComplete: (id: number) => void;
};

export function Heart({ heart, reducedMotion, onComplete }: HeartProps) {
  const duration = reducedMotion ? Math.min(heart.duration, 800) : heart.duration;

  useEffect(() => {
    if (!reducedMotion) return undefined;
    const timeout = window.setTimeout(() => {
      onComplete(heart.id);
    }, Math.min(duration, 400));

    return () => window.clearTimeout(timeout);
  }, [duration, heart.id, onComplete, reducedMotion]);

  return (
    <img
      src="/heart.svg"
      alt=""
      aria-hidden="true"
      className="heart"
      style={{
        width: heart.size,
        height: heart.size,
        left: heart.left,
        top: heart.top,
        color: HEARTS.color,
        animation: `float-up-fade ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        transform: `rotate(${heart.rotation}deg)`
      }}
      onAnimationEnd={() => onComplete(heart.id)}
    />
  );
}
