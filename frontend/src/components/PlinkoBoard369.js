import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SLOTS, MINI_CANDIDATE_INDICES, TOKEN_LOGOS } from '../config/slots';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const PlinkoBoard369 = ({
  isBallFalling,
  onLaunch,
  onBallLanded,
  miniAmountPLS,
  finalSlot,
}) => {
  const [miniIndex, setMiniIndex] = useState(
    () => MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)]
  );

  // Shuffle mini badge when not playing
  useEffect(() => {
    if (!isBallFalling) {
      const i = MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)];
      setMiniIndex(i);
    }
  }, [isBallFalling]);

  return (
    <div className="board-frame" data-testid="plinko-board-369">
      <div className="mini-banner-top">
        <span className="mini-chip">MINI</span>
        <b>{miniAmountPLS} PLS</b> — moves each play
      </div>

      {/* Plinko Pegs */}
      <div className="pegs-area">
        {[...Array(8)].map((_, rowIndex) => (
          <div key={rowIndex} className="peg-row">
            {[...Array(Math.min(10, rowIndex + 3))].map((_, pegIndex) => (
              <div key={pegIndex} className="peg" />
            ))}
          </div>
        ))}

        {/* Animated Ball */}
        {isBallFalling && (
          <motion.div
            data-testid="plinko-ball-369"
            className="plinko-ball"
            initial={{ top: 0, left: '50%', x: '-50%' }}
            animate={{
              top: [0, 50, 100, 150, 200, 250, 290],
              left: [
                '50%',
                `${45 + Math.random() * 10}%`,
                `${40 + Math.random() * 20}%`,
                `${35 + Math.random() * 30}%`,
                `${30 + Math.random() * 40}%`,
                `${25 + Math.random() * 50}%`,
                `${10 + (finalSlot * 4.5)}%`,
              ],
            }}
            transition={{
              duration: 2.5,
              ease: 'easeIn',
            }}
            onAnimationComplete={() => onBallLanded && onBallLanded(finalSlot)}
          />
        )}
      </div>

      {/* Slots Grid */}
      <div className="slots-grid">
        {SLOTS.map((s) => (
          <div
            key={s.index}
            data-testid={`slot-${s.index}`}
            className={`slot ${s.kind} ${finalSlot === s.index && isBallFalling ? 'landed' : ''}`}
          >
            {s.kind === 'win' ? (
              <>
                <div className="logo">{TOKEN_LOGOS[s.token]}</div>
                <div className="mult">x{Number(s.multiplier).toFixed(1)}</div>
              <>
            ) : (
              <div className="slot-peg" />
            )}
            {s.index === miniIndex && (
              <div className="mini-badge" title="Mini jackpot active here">
                MINI
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls">
        <Button
          data-testid="launch-ball-btn"
          disabled={isBallFalling}
          onClick={onLaunch}
          size="lg"
          className="launch-btn"
        >
          {isBallFalling ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-6 h-6 mr-2" />
              </motion.div>
              Launching...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-2" />
              Launch Ball • 1 PLS
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PlinkoBoard369;