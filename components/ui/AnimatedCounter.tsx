
import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  precision?: number;
  format?: (value: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ from = 0, to, duration = 1.5, precision = 0, format }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      ease: [0.43, 0.13, 0.23, 0.96], // easeOutQuint
      onUpdate(value) {
        let displayValue = value.toFixed(precision);
        if (format) {
            node.textContent = format(parseFloat(displayValue));
        } else {
            node.textContent = parseFloat(displayValue).toLocaleString();
        }
      },
    });

    return () => controls.stop();
  }, [from, to, duration, precision, format]);

  return <span ref={nodeRef} />;
};

export default AnimatedCounter;
