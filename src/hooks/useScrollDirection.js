import { useState, useEffect, useRef } from 'react';

/**
 * Returns 'up' | 'down' based on scroll direction.
 * Always shows at top of page.
 */
export function useScrollDirection(threshold = 40, showAtTop = 80) {
  const [direction, setDirection] = useState('up');
  const lastY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < showAtTop) {
            setDirection('up');
          } else if (Math.abs(y - lastY.current) >= threshold) {
            setDirection(y > lastY.current ? 'down' : 'up');
          }
          lastY.current = y;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, showAtTop]);

  return direction;
}
