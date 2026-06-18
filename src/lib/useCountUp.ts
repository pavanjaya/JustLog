import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 500) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + diff * eased));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    }

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);

    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}
