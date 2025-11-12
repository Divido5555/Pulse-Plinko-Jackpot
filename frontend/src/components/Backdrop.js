import React, { useMemo } from 'react';
import { FLOATING_BALLS } from '../config/slots';

const Backdrop = () => {
  const balls = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      img: FLOATING_BALLS[i % FLOATING_BALLS.length],
      top: Math.random() * 80 + 5,
      left: Math.random() * 80 + 5,
      duration: 12 + Math.random() * 18,
      size: 32 + Math.round(Math.random() * 28),
      delay: Math.random() * 8,
    }));
  }, []);

  return (
    <div className="space-bg" aria-hidden="true">
      <div className="stars layer-1" />
      <div className="stars layer-2" />
      {balls.map((b, idx) => (
        <img
          key={idx}
          src={b.img}
          alt=""
          className="float-ball"
          style={{
            top: `${b.top}vh`,
            left: `${b.left}vw`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Backdrop;