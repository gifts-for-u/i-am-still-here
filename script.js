const MESSAGES = [
  'Ini pesan dummy 1. Nanti kamu ganti sendiri ya. 💗',
  'Ini pesan dummy 2. Kamu bisa nambah sebanyak yang kamu mau.',
  'Ini pesan dummy 3. Tetap semangat ya sayang.'
];

const INTRO_IN_DURATION = 2000;
const INTRO_OUT_DURATION = 2000;
const MESSAGE_IN_DURATION = 700;
const MESSAGE_OUT_DURATION = 500;

const stage = document.querySelector('.stage');
const introSection = document.querySelector('.intro');
const introTitle = document.querySelector('[data-role="intro-title"]');
const messageArea = document.querySelector('[data-role="message-area"]');
const messageText = document.querySelector('[data-role="message-text"]');
const heartsLayer = document.querySelector('[data-role="hearts-layer"]');
const progress = document.querySelector('.progress');
const progressFill = document.querySelector('[data-role="progress-fill"]');

const navKeys = new Set(['ArrowRight', ' ', 'Spacebar', 'Enter']);
let state = 'intro';
let currentIndex = -1;
let isAnimating = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateMotionDurations(matches) {
  const root = document.documentElement;
  if (matches) {
    root.style.setProperty('--intro-in-duration', '1ms');
    root.style.setProperty('--intro-out-duration', '1ms');
    root.style.setProperty('--message-in-duration', '1ms');
    root.style.setProperty('--message-out-duration', '1ms');
  } else {
    root.style.setProperty('--intro-in-duration', `${INTRO_IN_DURATION}ms`);
    root.style.setProperty('--intro-out-duration', `${INTRO_OUT_DURATION}ms`);
    root.style.setProperty('--message-in-duration', `${MESSAGE_IN_DURATION}ms`);
    root.style.setProperty('--message-out-duration', `${MESSAGE_OUT_DURATION}ms`);
  }
}

updateMotionDurations(prefersReducedMotion.matches);
const handleMotionChange = (event) => {
  updateMotionDurations(event.matches);
};
if (typeof prefersReducedMotion.addEventListener === 'function') {
  prefersReducedMotion.addEventListener('change', handleMotionChange);
} else if (typeof prefersReducedMotion.addListener === 'function') {
  prefersReducedMotion.addListener(handleMotionChange);
}

function animateWithClass(element, className) {
  return new Promise((resolve) => {
    const cleanup = () => {
      element.removeEventListener('animationend', onEnd);
      element.classList.remove(className);
      resolve();
    };

    const onEnd = () => {
      cleanup();
    };

    if (prefersReducedMotion.matches) {
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

function advanceFlow() {
  if (isAnimating) return;

  if (state === 'intro') {
    transitionFromIntro();
    return;
  }

  if (state === 'messages') {
    showNextMessage();
  }
}

async function transitionFromIntro() {
  if (isAnimating) return;
  isAnimating = true;

  introTitle.classList.remove('fade-in');
  introSection.style.pointerEvents = 'none';
  await animateWithClass(introSection, 'fade-out');
  introSection.classList.add('is-hidden');

  state = 'messages';
  isAnimating = false;
  showNextMessage();
}

async function showNextMessage() {
  if (isAnimating) return;
  const nextIndex = currentIndex + 1;
  if (nextIndex >= MESSAGES.length) {
    return;
  }

  isAnimating = true;

  if (currentIndex >= 0) {
    await animateWithClass(messageArea, 'fade-out-down');
    messageArea.classList.remove('message-area--visible');
  }

  currentIndex = nextIndex;
  messageText.textContent = MESSAGES[currentIndex];
  messageArea.classList.add('message-area--visible');
  await animateWithClass(messageArea, 'fade-in-up');
  updateProgress();
  spawnHearts();

  isAnimating = false;
}

function updateProgress() {
  const total = MESSAGES.length;
  const progressValue = ((currentIndex + 1) / total) * 100;
  progressFill.style.width = `${progressValue}%`;
  progress.setAttribute('aria-valuenow', String(Math.round(progressValue)));
}

function getHeartSizeRange() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  return isMobile ? [14, 32] : [18, 40];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function spawnHearts() {
  if (!heartsLayer) return;

  const [minSize, maxSize] = getHeartSizeRange();
  const heartCount = getRandomInt(2, 6);
  const messageRect = messageArea.getBoundingClientRect();
  const progressRect = progress.getBoundingClientRect();
  const layerRect = heartsLayer.getBoundingClientRect();

  for (let i = 0; i < heartCount; i += 1) {
    const heart = document.createElement('img');
    heart.src = 'heart.svg';
    heart.alt = '';
    heart.setAttribute('aria-hidden', 'true');
    heart.className = 'heart';

    const size = getRandomInt(minSize, maxSize);
    const baseLifetime = getRandomInt(1200, 2200);
    const lifetime = prefersReducedMotion.matches ? Math.min(baseLifetime, 400) : baseLifetime;
    const rotation = getRandomInt(-25, 25);

    let position = null;
    for (let attempts = 0; attempts < 8; attempts += 1) {
      const x = getRandomInt(0, Math.max(0, Math.floor(layerRect.width - size)));
      const y = getRandomInt(0, Math.max(0, Math.floor(layerRect.height - size)));
      const top = layerRect.top + y;
      const left = layerRect.left + x;

      const overlapsMessage = rectanglesOverlap(
        { left, top, right: left + size, bottom: top + size },
        messageRect
      );
      const overlapsProgress = rectanglesOverlap(
        { left, top, right: left + size, bottom: top + size },
        progressRect
      );

      if (!overlapsMessage && !overlapsProgress) {
        position = { x, y };
        break;
      }
    }

    if (!position) {
      position = {
        x: getRandomInt(0, Math.max(0, Math.floor(layerRect.width - size))),
        y: getRandomInt(0, Math.max(0, Math.floor(layerRect.height - size)))
      };
    }

    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    heart.style.left = `${position.x}px`;
    heart.style.top = `${position.y}px`;
    heart.style.color = '#ff8fb3';
    heart.style.setProperty('--heart-rotation', `${rotation}deg`);

    if (prefersReducedMotion.matches) {
      heart.style.animation = 'none';
      heart.style.opacity = '1';
      heart.style.transform = `translateY(0) scale(1) rotate(${rotation}deg)`;
    } else {
      heart.style.animation = `float-up-fade ${lifetime}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`;
    }

    heartsLayer.appendChild(heart);
  }
}

function rectanglesOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function handleKeyDown(event) {
  if (navKeys.has(event.key)) {
    event.preventDefault();
    advanceFlow();
  } else if (event.code === 'Space') {
    event.preventDefault();
    advanceFlow();
  }
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  touchStartTime = Date.now();
}

function handleTouchEnd(event) {
  if (event.changedTouches.length !== 1) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;

  const threshold = 40;
  const allowedTime = 600;

  if (dt <= allowedTime && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
    advanceFlow();
  } else {
    advanceFlow();
  }

  resetTouchState();
}

function initIntro() {
  animateWithClass(introTitle, 'fade-in');
}

function handleInitialTap() {
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    advanceFlow();
  });
}

function initEvents() {
  handleInitialTap();
  document.addEventListener('keydown', handleKeyDown);
  stage.addEventListener('touchstart', handleTouchStart, { passive: true });
  stage.addEventListener('touchend', handleTouchEnd);
  stage.addEventListener('touchcancel', resetTouchState);
}

function resetTouchState() {
  touchStartX = 0;
  touchStartY = 0;
  touchStartTime = 0;
}

initIntro();
initEvents();
