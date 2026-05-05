'use client';

/**
 * Lightweight client-side ring buffer of recent user-visible events. When
 * the user submits feedback, the buffer is attached to the payload so an
 * admin can reproduce the bug instead of guessing at the steps.
 *
 * Captured event kinds:
 *   - "route":    pathname changed
 *   - "click":    a clickable element with [data-event] was tapped
 *               (or any button/anchor — captures tag + label)
 *   - "fetch":    a non-2xx fetch response (status + url)
 *   - "error":    a window.onerror or unhandledrejection event
 *
 * The buffer is in-memory only — it disappears on hard reload. That's fine:
 * users typically submit feedback within seconds of hitting the bug.
 */

export interface ActivityEvent {
  /** tenths of a second since page load. */
  t: number;
  kind: 'route' | 'click' | 'fetch' | 'error';
  /** Free-form description (URL, selector, status, etc.). */
  detail: string;
}

const MAX_EVENTS = 80;
const buffer: ActivityEvent[] = [];
let installed = false;
const startedAt =
  typeof performance !== 'undefined' ? performance.now() : Date.now();

function push(kind: ActivityEvent['kind'], detail: string) {
  if (typeof window === 'undefined') return;
  const t =
    Math.round(
      ((typeof performance !== 'undefined' ? performance.now() : Date.now()) -
        startedAt) /
        100
    ) / 10;
  buffer.push({ t, kind, detail: detail.slice(0, 200) });
  if (buffer.length > MAX_EVENTS) buffer.shift();
}

export function getActivityTrail(): ActivityEvent[] {
  return buffer.slice();
}

export function installActivityTrail(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Initial route
  push('route', window.location.pathname);

  // Route changes (Next.js App Router) — popstate + pushState/replaceState patches.
  let lastPath = window.location.pathname;
  function checkPath() {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      push('route', lastPath);
    }
  }
  window.addEventListener('popstate', checkPath);
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    origPush.apply(this, args as Parameters<typeof origPush>);
    setTimeout(checkPath, 0);
  };
  history.replaceState = function (...args) {
    origReplace.apply(this, args as Parameters<typeof origReplace>);
    setTimeout(checkPath, 0);
  };

  // Clicks on tagged elements (or any button/anchor)
  window.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      const tagged = target?.closest('[data-event]') as HTMLElement | null;
      if (tagged) {
        push('click', tagged.getAttribute('data-event') ?? 'click');
      } else if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'button' || tag === 'a' || target.closest('button,a')) {
          const el = target.closest('button,a') as HTMLElement | null;
          if (el) {
            const label = (el.textContent ?? '').trim().slice(0, 40);
            push('click', `${el.tagName.toLowerCase()}: ${label}`);
          }
        }
      }
    },
    { capture: true }
  );

  // Wrap fetch to capture failures
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const res = await origFetch(...args);
      if (!res.ok) {
        const url =
          typeof args[0] === 'string'
            ? args[0]
            : args[0] instanceof URL
              ? args[0].toString()
              : (args[0] as Request).url;
        push('fetch', `${res.status} ${url}`);
      }
      return res;
    } catch (err) {
      const url =
        typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof URL
            ? args[0].toString()
            : (args[0] as Request).url;
      push('fetch', `network error ${url}`);
      throw err;
    }
  };

  // Errors
  window.addEventListener('error', (e) => {
    push(
      'error',
      `${e.message ?? 'Error'} @ ${e.filename ?? '?'}:${e.lineno ?? '?'}`
    );
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason =
      e.reason instanceof Error
        ? e.reason.message
        : String(e.reason ?? 'Unknown rejection');
    push('error', `unhandled: ${reason}`);
  });
}
