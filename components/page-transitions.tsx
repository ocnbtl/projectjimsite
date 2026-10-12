"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { createPageTransitionNavigator, type PageNavigationOptions } from "@/lib/page-transitions";

type Navigate = (href: string, options: PageNavigationOptions) => boolean;
const NavigationMotion = createContext<Navigate | null>(null);

export function PageTransitions({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigator = useRef<ReturnType<typeof createPageTransitionNavigator> | null>(null);
  useEffect(() => {
    const instance = createPageTransitionNavigator(router);
    navigator.current = instance;
    return () => { instance.dispose(); navigator.current = null; };
  }, [router]);
  const navigate = useCallback<Navigate>((href, options) => navigator.current?.navigate(href, options) ?? false, []);
  return <NavigationMotion.Provider value={navigate}>{children}</NavigationMotion.Provider>;
}

// Keep Next's prefetching, keyboard navigation, modified clicks and normal link semantics.
export function TransitionLink({ onNavigate, ...props }: ComponentProps<typeof NextLink>) {
  const navigate = useContext(NavigationMotion);
  return <NextLink {...props} onNavigate={(event) => {
    let cancelled = false;
    onNavigate?.({ preventDefault() { cancelled = true; event.preventDefault(); } });
    if (cancelled || !navigate || typeof props.href !== "string") return;
    if (navigate(props.href, { scroll: props.scroll, replace: props.replace })) event.preventDefault();
  }} />;
}
