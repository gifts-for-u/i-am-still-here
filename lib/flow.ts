'use client';

import { useCallback, useEffect, useState } from 'react';

export const MESSAGES: string[] = [
  'Ini pesan dummy 1. Nanti kamu ganti sendiri ya. 💗',
  'Ini pesan dummy 2. Kamu bisa nambah sebanyak yang kamu mau.',
  'Ini pesan dummy 3. Tetap semangat ya sayang.'
];

export const DURATIONS = {
  introIn: 2000,
  introOut: 2000,
  messageIn: 700,
  messageOut: 500
} as const;

export const HEARTS = {
  min: 2,
  max: 6,
  lifetime: [1200, 2200] as const,
  rotation: [-25, 25] as const,
  color: '#ff8fb3'
} as const;

export const HEART_SIZES = {
  mobile: [14, 32] as const,
  desktop: [18, 40] as const
} as const;

export type HeartShape = {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  rotation: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getHeartSizeRange(isMobile: boolean): readonly [number, number] {
  return isMobile ? HEART_SIZES.mobile : HEART_SIZES.desktop;
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export function createHeartBurst(
  layerRect: DOMRect,
  messageRect: DOMRect,
  progressRect: DOMRect,
  isMobile: boolean
): HeartShape[] {
  const [minSize, maxSize] = getHeartSizeRange(isMobile);
  const count = randomInt(HEARTS.min, HEARTS.max);
  const hearts: HeartShape[] = [];

  for (let i = 0; i < count; i += 1) {
    const size = randomInt(minSize, maxSize);
    const duration = randomInt(HEARTS.lifetime[0], HEARTS.lifetime[1]);
    const rotation = randomInt(HEARTS.rotation[0], HEARTS.rotation[1]);

    let position: { left: number; top: number } | null = null;

    for (let attempts = 0; attempts < 8; attempts += 1) {
      const left = randomInt(0, Math.max(0, Math.floor(layerRect.width - size))) + layerRect.left;
      const top = randomInt(0, Math.max(0, Math.floor(layerRect.height - size))) + layerRect.top;
      const heartRect = new DOMRect(left, top, size, size);

      if (!rectsOverlap(heartRect, messageRect) && !rectsOverlap(heartRect, progressRect)) {
        position = { left, top };
        break;
      }
    }

    if (!position) {
      position = {
        left:
          randomInt(0, Math.max(0, Math.floor(layerRect.width - size))) + layerRect.left,
        top:
          randomInt(0, Math.max(0, Math.floor(layerRect.height - size))) + layerRect.top
      };
    }

    hearts.push({
      id: Date.now() + i + Math.random(),
      size,
      left: position.left - layerRect.left,
      top: position.top - layerRect.top,
      duration,
      rotation
    });
  }

  return hearts;
}

export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = (event: MediaQueryListEvent) => setPrefers(event.matches);

    setPrefers(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handle);
      return () => mq.removeEventListener('change', handle);
    }

    if (typeof mq.addListener === 'function') {
      mq.addListener(handle);
      return () => mq.removeListener(handle);
    }

    return undefined;
  }, []);

  return prefers;
}

export function useSyncMotionDurations(prefers: boolean) {
  return useCallback(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--intro-in-duration', prefers ? '1ms' : `${DURATIONS.introIn}ms`);
    root.style.setProperty('--intro-out-duration', prefers ? '1ms' : `${DURATIONS.introOut}ms`);
    root.style.setProperty('--message-in-duration', prefers ? '1ms' : `${DURATIONS.messageIn}ms`);
    root.style.setProperty('--message-out-duration', prefers ? '1ms' : `${DURATIONS.messageOut}ms`);
  }, [prefers]);
}

export function animateWithClass(
  element: HTMLElement | null,
  className: string,
  reducedMotion: boolean
): Promise<void> {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const cleanup = () => {
      element.removeEventListener('animationend', onEnd);
      element.classList.remove(className);
      resolve();
    };

    const onEnd = () => {
      cleanup();
    };

    if (reducedMotion) {
      requestAnimationFrame(() => {
        element.classList.add(className);
        requestAnimationFrame(() => {
          cleanup();
        });
      });
      return;
    }

    element.addEventListener('animationend', onEnd, { once: true });
    requestAnimationFrame(() => {
      element.classList.add(className);
    });
  });
}

export function computeProgress(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return ((currentIndex + 1) / total) * 100;
}
