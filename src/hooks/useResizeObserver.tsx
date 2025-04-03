import { useEffect, useRef } from 'react';

interface ResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  target: Element;
}

type ResizeObserverCallback = (entry: ResizeObserverEntry) => void;

/**
 * Custom hook to observe and respond to element size changes
 * @param elementRef Reference to the element to observe
 * @param callback Function to call when the element size changes
 */
export function useResizeObserver(
  elementRef: React.RefObject<Element>,
  callback: ResizeObserverCallback
): void {
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Skip if no element or callback
    if (!elementRef.current || !callback) {
      return;
    }

    // Create new ResizeObserver and start observing
    const observer = new ResizeObserver((entries) => {
      if (entries && entries[0]) {
        callback({
          contentRect: entries[0].contentRect,
          target: entries[0].target,
        });
      }
    });

    observer.observe(elementRef.current);
    observerRef.current = observer;

    // Clean up on component unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, callback]);
} 