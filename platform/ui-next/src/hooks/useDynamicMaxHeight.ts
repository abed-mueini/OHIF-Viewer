import { useRef, useState, useEffect, RefObject } from 'react';

/**
 * Calculates the maximum height for an element based on its position
 * relative to the bottom of the viewport.
 *
 * @param data The data that, when changed, should trigger a recalculation.
 * @param buffer Optional buffer space (in pixels) to leave below the element. Defaults to 20.
 * @param minHeight Optional minimum height (in pixels) for the element. Defaults to 100.
 * @returns An object containing:
 *  - `ref`: A RefObject to attach to the target DOM element.
 *  - `maxHeight`: The calculated maximum height string (e.g., "500px").
 */
export function useDynamicMaxHeight(
  data: any,
  buffer = 20,
  minHeight = 100
): {
  ref: RefObject<HTMLDivElement>;
  maxHeight: string;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>('100vh');

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    let frameId: number | undefined;
    const calculateMaxHeight = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const nextMaxHeight = `${Math.max(minHeight, viewportHeight - rect.top - buffer)}px`;
      setMaxHeight(current => (current === nextMaxHeight ? current : nextMaxHeight));
    };

    const scheduleCalculation = () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(calculateMaxHeight);
    };

    const visualViewport = window.visualViewport;
    const resizeObserver = new ResizeObserver(scheduleCalculation);
    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener('resize', scheduleCalculation);
    window.addEventListener('orientationchange', scheduleCalculation);
    visualViewport?.addEventListener('resize', scheduleCalculation);
    visualViewport?.addEventListener('scroll', scheduleCalculation);
    scheduleCalculation();

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleCalculation);
      window.removeEventListener('orientationchange', scheduleCalculation);
      visualViewport?.removeEventListener('resize', scheduleCalculation);
      visualViewport?.removeEventListener('scroll', scheduleCalculation);
    };
  }, [data, buffer, minHeight]);

  return { ref, maxHeight };
}

export default useDynamicMaxHeight;
