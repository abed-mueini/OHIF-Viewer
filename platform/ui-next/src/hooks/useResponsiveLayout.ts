import { useEffect, useMemo, useState } from 'react';

/**
 * Canonical OHIF responsive breakpoints.
 *
 * These values MUST stay in sync with:
 * - `screens` in `platform/ui/tailwind.config.js`
 * - `OHIF_RESPONSIVE` custom media queries in `platform/ui-next/src/tailwind.css`
 *
 * Changing a value here requires updating the CSS counterparts.
 */
export const BREAKPOINTS = {
  /** Small phones and below (default, no media query needed). */
  xs: 0,
  /** Large phones / small tablets, portrait. */
  sm: 640,
  /** Tablets portrait / small landscape. */
  md: 768,
  /** Tablets landscape / small laptops. */
  lg: 1024,
  /** Desktops. */
  xl: 1280,
  /** Large desktops. */
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const BREAKPOINT_ORDER: readonly Breakpoint[] = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/** Minimum interactive target size (width/height in px) per WCAG 2.5.5 / Apple HIG. */
export const TOUCH_TARGET_MIN = 44;

function subscribe(matcher: MediaQueryList, onChange: () => void): () => void {
  // Legacy Safari (>= 14) requires the deprecated API.
  if (typeof matcher.addEventListener === 'function') {
    matcher.addEventListener('change', onChange);
    return () => matcher.removeEventListener('change', onChange);
  }

  matcher.addListener(onChange);
  return () => matcher.removeListener(onChange);
}

function readMatches(queries: Record<Breakpoint, MediaQueryList>): Record<Breakpoint, boolean> {
  return BREAKPOINT_ORDER.reduce(
    (acc, name) => {
      acc[name] = queries[name].matches;
      return acc;
    },
    {} as Record<Breakpoint, boolean>
  );
}

export interface ResponsiveLayout {
  /** Raw viewport width in CSS pixels. `0` before first measurement. */
  width: number;
  /** Raw viewport height in CSS pixels. `0` before first measurement. */
  height: number;
  /** Active breakpoint name (largest matching min-width). */
  breakpoint: Breakpoint;
  /** True when viewport width is below the `md` breakpoint (phones). */
  isMobile: boolean;
  /** True from `md` up to (but excluding) `lg` (tablets). */
  isTablet: boolean;
  /** True from `lg` upwards (desktops). */
  isDesktop: boolean;
  /** True when the coarse-pointer media query matches (touch-first devices). */
  isTouch: boolean;
  /** Matches lookup, e.g. `matches.lg` is `(min-width: 1024px)`. */
  matches: Record<Breakpoint, boolean>;
  /** True on the first render, before the initial measurement completes. */
  isServerRender: boolean;
}

export const MOBILE_MAX_WIDTH = BREAKPOINTS.md - 1;

/**
 * Subscribes to canonical OHIF breakpoints and pointer media queries.
 *
 * All responsive JS behavior should read from this hook instead of calling
 * `window.innerWidth` directly, so that layout decisions are centralized,
 * SSR-safe and update live without a page reload.
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
 * if (isMobile) { ... }
 */
export function useResponsiveLayout(): ResponsiveLayout {
  // `null` = not yet measured (SSR / first render); `0` would be a valid width.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [matches, setMatches] = useState<Record<Breakpoint, boolean> | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const queries = BREAKPOINT_ORDER.reduce(
      (acc, name) => {
        acc[name] = window.matchMedia(`(min-width: ${BREAKPOINTS[name]}px)`);
        return acc;
      },
      {} as Record<Breakpoint, MediaQueryList>
    );

    const pointerQuery = window.matchMedia('(pointer: coarse)');

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const updateMatches = () => {
      setMatches(readMatches(queries));
    };

    const updatePointer = () => {
      setIsTouch(pointerQuery.matches);
    };

    const unsubscribers = BREAKPOINT_ORDER.map(name =>
      subscribe(queries[name], () => {
        updateMatches();
        // Breakpoint changes always imply a width change.
        updateSize();
      })
    );

    unsubscribers.push(
      subscribe(pointerQuery, updatePointer),
      subscribe(window.matchMedia('(orientation: change)'), updateSize)
    );

    updateSize();
    updateMatches();
    updatePointer();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return useMemo(() => {
    const isMeasured = size !== null;
    const resolvedMatches = matches ?? {
      xs: true,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      '2xl': false,
    };
    const width = size?.width ?? 0;

    const breakpoint = BREAKPOINT_ORDER.reduce<Breakpoint>(
      (current, name) => (resolvedMatches[name] ? name : current),
      'xs'
    );

    return {
      width,
      height: size?.height ?? 0,
      breakpoint,
      // Render desktop-first until the browser reports its real size. This
      // prevents components that depend on a measured panel group from
      // mounting their mobile branch before its refs exist.
      isMobile: isMeasured && (breakpoint === 'xs' || breakpoint === 'sm'),
      isTablet: isMeasured && breakpoint === 'md',
      isDesktop: !isMeasured || breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
      isTouch,
      matches: resolvedMatches,
      isServerRender: size === null,
    };
  }, [size, matches, isTouch]);
}

export default useResponsiveLayout;
