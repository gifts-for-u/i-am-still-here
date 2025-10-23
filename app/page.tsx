'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart } from '../components/Heart';
import {
  MESSAGES,
  animateWithClass,
  computeProgress,
  createHeartBurst,
  usePrefersReducedMotion,
  useSyncMotionDurations,
  HeartShape
} from '../lib/flow';

const NAV_KEYS = new Set(['ArrowRight', 'Enter', ' ', 'Spacebar']);

type Phase = 'intro' | 'messages';

export default function Page() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [introHidden, setIntroHidden] = useState(false);
  const [message, setMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [hearts, setHearts] = useState<HeartShape[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const introTitleRef = useRef<HTMLHeadingElement>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLSpanElement>(null);
  const heartsLayerRef = useRef<HTMLDivElement>(null);

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const phaseRef = useRef<Phase>('intro');
  const indexRef = useRef(-1);
  const animatingRef = useRef(false);

  const reducedMotion = usePrefersReducedMotion();
  const syncDurations = useSyncMotionDurations(reducedMotion);

  useEffect(() => {
    syncDurations();
  }, [syncDurations]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    animateWithClass(introTitleRef.current, 'fade-in', reducedMotion);
  }, [reducedMotion]);

  const updateProgress = useCallback((index: number) => {
    const percent = computeProgress(index, MESSAGES.length);
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${percent}%`;
    }
    if (progressRef.current) {
      progressRef.current.setAttribute('aria-valuenow', String(Math.round(percent)));
    }
  }, []);

  const spawnHearts = useCallback(() => {
    const layer = heartsLayerRef.current;
    const messageArea = messageAreaRef.current;
    const progressEl = progressRef.current;
    if (!layer || !messageArea || !progressEl) return;

    const burst = createHeartBurst(
      layer.getBoundingClientRect(),
      messageArea.getBoundingClientRect(),
      progressEl.getBoundingClientRect(),
      isMobile
    );

    setHearts((prev) => [...prev, ...burst]);
  }, [isMobile]);

  const showNextMessage = useCallback(async () => {
    if (animatingRef.current) return;

    const nextIndex = indexRef.current + 1;
    if (nextIndex >= MESSAGES.length) {
      return;
    }

    animatingRef.current = true;

    if (indexRef.current >= 0) {
      await animateWithClass(messageAreaRef.current, 'fade-out-down', reducedMotion);
      messageAreaRef.current?.classList.remove('message-area--visible');
    }

    indexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setMessage(MESSAGES[nextIndex]);
    messageAreaRef.current?.classList.add('message-area--visible');
    await animateWithClass(messageAreaRef.current, 'fade-in-up', reducedMotion);
    updateProgress(nextIndex);
    spawnHearts();

    animatingRef.current = false;
  }, [reducedMotion, spawnHearts, updateProgress]);

  const transitionFromIntro = useCallback(async () => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    introTitleRef.current?.classList.remove('fade-in');
    if (introRef.current) {
      introRef.current.style.pointerEvents = 'none';
      await animateWithClass(introRef.current, 'fade-out', reducedMotion);
      setIntroHidden(true);
    }

    phaseRef.current = 'messages';
    setPhase('messages');
    animatingRef.current = false;
    void showNextMessage();
  }, [reducedMotion, showNextMessage]);

  const advanceFlow = useCallback(() => {
    if (animatingRef.current) return;

    if (phaseRef.current === 'intro') {
      transitionFromIntro();
      return;
    }

    if (phaseRef.current === 'messages') {
      void showNextMessage();
    }
  }, [showNextMessage, transitionFromIntro]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      advanceFlow();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (NAV_KEYS.has(event.key) || event.code === 'Space') {
        event.preventDefault();
        advanceFlow();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStart.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStart.current || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      const threshold = 40;
      const allowedTime = 600;
      if (dt <= allowedTime && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        advanceFlow();
      } else {
        advanceFlow();
      }
      touchStart.current = null;
    };

    const handleTouchCancel = () => {
      touchStart.current = null;
    };

    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('touchstart', handleTouchStart, { passive: true });
    stage.addEventListener('touchend', handleTouchEnd);
    stage.addEventListener('touchcancel', handleTouchCancel);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      stage.removeEventListener('pointerdown', handlePointerDown);
      stage.removeEventListener('touchstart', handleTouchStart);
      stage.removeEventListener('touchend', handleTouchEnd);
      stage.removeEventListener('touchcancel', handleTouchCancel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [advanceFlow]);

  return (
    <main className="stage" ref={stageRef} role="main">
      <section
        ref={introRef}
        className={`intro${introHidden ? ' is-hidden' : ''}`}
        aria-live="polite"
      >
        <h1 ref={introTitleRef} className="intro__title">
          halo cantik aku
        </h1>
        <p className="intro__hint">tap layarnya buat lanjut sayang</p>
      </section>

      <section
        ref={messageAreaRef}
        className="message-area"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="message">{message}</p>
      </section>

      <div ref={heartsLayerRef} className="hearts" aria-hidden="true">
        {hearts.map((heart) => (
          <Heart key={heart.id} heart={heart} reducedMotion={reducedMotion} />
        ))}
      </div>

      <div
        ref={progressRef}
        className="progress"
        role="progressbar"
        aria-label="Progres pesan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        <span className="progress__track" />
        <span ref={progressFillRef} className="progress__fill" />
      </div>
    </main>
  );
}
