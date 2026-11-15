import { useEffect, useRef, useState } from "react";

export function useChartBox(active = true) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const next = {
        width: Math.floor(node.clientWidth),
        height: Math.floor(node.clientHeight),
      };
      setBox((current) =>
        current.width === next.width && current.height === next.height ? current : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  return { ref, ...box };
}
