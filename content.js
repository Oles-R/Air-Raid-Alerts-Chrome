(() => {
  // Prevent double-injection
  if (window.__ukraineAlarmToastInit) return;
  window.__ukraineAlarmToastInit = true;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const STYLE = `
    #ua-toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .ua-toast {
      pointer-events: all;
      min-width: 300px;
      max-width: 380px;
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      cursor: pointer;
      user-select: none;
    }

    .ua-toast.ua-toast--visible {
      transform: translateX(0);
      opacity: 1;
    }

    .ua-toast.ua-toast--hiding {
      transform: translateX(120%);
      opacity: 0;
    }

    /* Red — missiles/ballistic */
    .ua-toast--red {
      background: rgba(30, 10, 10, 0.92);
      border-color: rgba(213, 91, 80, 0.5);
    }

    /* Yellow — drones */
    .ua-toast--yellow {
      background: rgba(30, 22, 5, 0.92);
      border-color: rgba(255, 194, 0, 0.5);
    }

    /* Generic */
    .ua-toast--generic {
      background: rgba(15, 23, 42, 0.92);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .ua-toast__icon {
      flex-shrink: 0;
      margin-top: 2px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: currentColor;
      filter: drop-shadow(0 0 6px currentColor);
    }

    .ua-toast__icon svg {
      display: block;
      width: 18px;
      height: 18px;
    }

    .ua-toast--red    .ua-toast__icon { color: #D55B50; }
    .ua-toast--yellow .ua-toast__icon { color: #FFC200; }
    .ua-toast--generic .ua-toast__icon { color: #3b82f6; }

    .ua-toast__body {
      flex: 1;
      min-width: 0;
    }

    .ua-toast__title {
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 4px 0;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ua-toast--red    .ua-toast__title { color: #fca5a5; }
    .ua-toast--yellow .ua-toast__title { color: #fcd34d; }
    .ua-toast--generic .ua-toast__title { color: #93c5fd; }

    .ua-toast__regions {
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      margin: 0 0 6px 0;
      line-height: 1.5;
      word-break: break-word;
    }

    .ua-toast__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .ua-toast__time {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
    }

    .ua-toast__close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.35);
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }
    .ua-toast__close:hover { color: rgba(255,255,255,0.8); }

    /* Progress bar */
    .ua-toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 0 14px 14px;
      width: 100%;
      transform-origin: left;
      animation: ua-shrink var(--ua-duration, 10s) linear forwards;
    }
    .ua-toast { position: relative; overflow: hidden; }
    .ua-toast--red    .ua-toast__progress { background: #D55B50; }
    .ua-toast--yellow .ua-toast__progress { background: #FFC200; }
    .ua-toast--generic .ua-toast__progress { background: #3b82f6; }

    @keyframes ua-shrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    @keyframes ua-pulse-red {
      0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 0 rgba(213,91,80,0.4); }
      50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 8px rgba(213,91,80,0); }
    }
    @keyframes ua-pulse-yellow {
      0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 0 rgba(255,194,0,0.3); }
      50%       { box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 8px rgba(255,194,0,0); }
    }

    .ua-toast--red    { animation: ua-pulse-red    2s ease-in-out 3; }
    .ua-toast--yellow { animation: ua-pulse-yellow 2.5s ease-in-out 3; }
  `;

  // ── DOM setup ───────────────────────────────────────────────────────────────
  function ensureContainer() {
    let c = document.getElementById('ua-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'ua-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function injectStyles() {
    if (document.getElementById('ua-toast-styles')) return;
    const s = document.createElement('style');
    s.id = 'ua-toast-styles';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  // ── Show toast ──────────────────────────────────────────────────────────────
  function showToast({ title, regions, level, duration = 10000 }) {
    injectStyles();
    const container = ensureContainer();

    const variant = level === 'red' ? 'red' : level === 'yellow' ? 'yellow' : 'generic';
    const iconKey = (level === 'red' || level === 'yellow') ? 'air' : 'warning';

    getLanguage((lang) => {
      const now = new Date().toLocaleTimeString(LOCALE_TAGS[lang], { hour: '2-digit', minute: '2-digit' });

      const toast = document.createElement('div');
      toast.className = `ua-toast ua-toast--${variant}`;
      toast.style.setProperty('--ua-duration', `${duration / 1000}s`);
      toast.innerHTML = `
        <div class="ua-toast__icon">${ICONS[iconKey]}</div>
        <div class="ua-toast__body">
          <p class="ua-toast__title">${title}</p>
          <p class="ua-toast__regions">${regions}</p>
          <div class="ua-toast__footer">
            <span class="ua-toast__time">${now}</span>
            <button class="ua-toast__close" title="${t(lang, 'closeBtnTitle')}">✕</button>
          </div>
        </div>
        <div class="ua-toast__progress"></div>
      `;

      container.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('ua-toast--visible'));
      });

      // Auto-dismiss
      let dismissTimer = setTimeout(() => dismiss(toast), duration);

      // Click to dismiss
      toast.querySelector('.ua-toast__close').addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(dismissTimer);
        dismiss(toast);
      });

      // Click anywhere on toast = dismiss
      toast.addEventListener('click', () => {
        clearTimeout(dismissTimer);
        dismiss(toast);
      });
    });
  }

  function dismiss(toast) {
    toast.classList.remove('ua-toast--visible');
    toast.classList.add('ua-toast--hiding');
    setTimeout(() => toast.remove(), 400);
  }

  // ── Listen for messages from background ─────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'showToast') {
      showToast(msg.payload);
    }
  });
})();
