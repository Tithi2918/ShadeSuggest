import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when the element enters the viewport.
 * Returns [ref, inView] — attach ref to the element you want to watch.
 *
 * @param {IntersectionObserverInit} options
 */
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el); // Only trigger once — no re-hiding on scroll back
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}
