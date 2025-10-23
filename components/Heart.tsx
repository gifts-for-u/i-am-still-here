'use client';

import type { CSSProperties } from 'react';
import { HEARTS, HeartShape } from '../lib/flow';

type HeartProps = {
  heart: HeartShape;
  reducedMotion: boolean;
};

export function Heart({ heart, reducedMotion }: HeartProps) {
  const duration = reducedMotion ? Math.min(heart.duration, 400) : heart.duration;
  const animation = reducedMotion
    ? 'none'
    : `float-up-fade ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`;

  const style: CSSProperties & { '--heart-rotation': string } = {
    width: heart.size,
    height: heart.size,
    left: heart.left,
    top: heart.top,
    color: HEARTS.color,
    animation,
    opacity: reducedMotion ? 1 : undefined,
    transform: reducedMotion ? `translateY(0) scale(1) rotate(${heart.rotation}deg)` : undefined,
    '--heart-rotation': `${heart.rotation}deg`
  };

  return <img src="/heart.svg" alt="" aria-hidden="true" className="heart" style={style} />;
}
