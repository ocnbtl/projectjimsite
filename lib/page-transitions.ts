const publicPages = new Set(["/", "/services", "/gallery", "/about", "/contact", "/masonry-staining", "/privacy"]);

export type PageNavigationOptions = { scroll?: boolean; replace?: boolean };
type Router = {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
};

export function getPageTransitionTarget(href: string, currentHref: string) {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    const path = target.pathname.replace(/\/$/, "") || "/";
    const currentPath = current.pathname.replace(/\/$/, "") || "/";
    if (target.origin !== current.origin || !publicPages.has(path) || path === currentPath) return null;
    return { path, href: `${target.pathname}${target.search}${target.hash}` };
  } catch {
    return null;
  }
}

// Wait for the destination's actual server-rendered panel, not only its URL.
// No animation delay is added to navigation. A slow route releases the snapshot.
function waitForPanel(path: string, signal: AbortSignal, doc: Document, browser: Window & typeof globalThis) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) { resolve(false); return; }
    let settled = false;
    function finish(ready: boolean) {
      if (settled) return;
      settled = true;
      observer.disconnect();
      browser.clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
      resolve(ready);
    }
    const cancel = () => finish(false);
    function inspect() {
      const panel = doc.querySelector<HTMLElement>(`[data-page-panel][data-page-route="${path}"]`);
      if (panel && panel.getClientRects().length > 0) finish(true);
    }
    const observer = new browser.MutationObserver(inspect);
    observer.observe(doc.querySelector("#main-content") ?? doc.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["style", "hidden", "data-page-route"],
    });
    signal.addEventListener("abort", cancel, { once: true });
    const timeout = browser.setTimeout(() => finish(false), 1200);
    inspect();
  });
}

export function createPageTransitionNavigator(
  router: Router,
  doc: Document = document,
  browser: Window & typeof globalThis = window,
) {
  const reducedMotion = browser.matchMedia("(prefers-reduced-motion: reduce)");
  let active: { transition: ViewTransition; controller: AbortController } | null = null;

  function cancelActive(reason = "superseded") {
    active?.controller.abort(reason);
    active?.transition.skipTransition();
  }
  function onMotionChange() { if (reducedMotion.matches) cancelActive("preference"); }
  function onVisibilityChange() { if (doc.visibilityState !== "visible") cancelActive("hidden"); }
  // Snapshots are visual, not controls. Release them as soon as the visitor
  // starts their next interaction, without canceling the requested route.
  function onInteraction() { cancelActive("interaction"); }
  reducedMotion.addEventListener("change", onMotionChange);
  doc.addEventListener("visibilitychange", onVisibilityChange);
  for (const event of ["pointermove", "pointerdown", "keydown", "wheel"]) {
    doc.addEventListener(event, onInteraction, { capture: true, passive: true });
  }

  return {
    navigate(href: string, options: PageNavigationOptions = {}) {
      const target = getPageTransitionTarget(href, browser.location.href);
      if (!target || !doc.startViewTransition || reducedMotion.matches || doc.visibilityState !== "visible") return false;
      cancelActive();
      const controller = new AbortController();
      const header = doc.querySelector(".site-header")?.getBoundingClientRect();
      // Links lower on a page get a quick fade rather than flying an offscreen panel into view.
      doc.documentElement.dataset.routeMotion = header && header.bottom > 0 && header.top < browser.innerHeight ? "morph" : "fade";
      doc.documentElement.dataset.routeMotionPhase = "pending";
      doc.documentElement.dataset.routeMotionTarget = target.path;
      let navigated = false;
      const navigateRoute = () => {
        if (navigated) return;
        navigated = true;
        const method = options.replace ? router.replace : router.push;
        method(target.href, { scroll: options.scroll ?? true });
      };
      try {
        const transition = doc.startViewTransition(async () => {
          if (controller.signal.aborted && ["superseded", "dispose"].includes(controller.signal.reason)) return;
          const panelReady = waitForPanel(target.path, controller.signal, doc, browser);
          navigateRoute();
          if (!await panelReady) transition.skipTransition();
        });
        const request = { transition, controller };
        active = request;
        const cleanup = () => {
          controller.abort();
          if (active !== request) return;
          active = null;
          delete doc.documentElement.dataset.routeMotion;
          delete doc.documentElement.dataset.routeMotionPhase;
          delete doc.documentElement.dataset.routeMotionTarget;
        };
        // A browser may skip a snapshot. Navigation must still work and promises must be handled.
        void transition.ready.then(() => {
          if (active === request) doc.documentElement.dataset.routeMotionPhase = "animating";
        }, () => {
          if (active === request) doc.documentElement.dataset.routeMotionPhase = "skipped";
        });
        void transition.updateCallbackDone.catch(() => { controller.abort(); transition.skipTransition(); });
        void transition.finished.then(cleanup, cleanup);
      } catch {
        controller.abort();
        active = null;
        delete doc.documentElement.dataset.routeMotion;
        delete doc.documentElement.dataset.routeMotionPhase;
        delete doc.documentElement.dataset.routeMotionTarget;
        navigateRoute();
      }
      return true;
    },
    dispose() {
      cancelActive("dispose");
      active = null;
      delete doc.documentElement.dataset.routeMotion;
      delete doc.documentElement.dataset.routeMotionPhase;
      delete doc.documentElement.dataset.routeMotionTarget;
      reducedMotion.removeEventListener("change", onMotionChange);
      doc.removeEventListener("visibilitychange", onVisibilityChange);
      for (const event of ["pointermove", "pointerdown", "keydown", "wheel"]) {
        doc.removeEventListener(event, onInteraction, true);
      }
    },
  };
}
