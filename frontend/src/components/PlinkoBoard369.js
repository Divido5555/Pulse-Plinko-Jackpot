import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SLOTS, MINI_CANDIDATE_INDICES, TOKEN_LOGOS } from '../config/slots';
import { PULSE369_LOGO } from '../config/tokenAssets';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const ENTRY_FEE_PLS = 10000; // 10,000 PLS

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
  
  const [mainIndex, setMainIndex] = useState(
    () => MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)]
  );

  // Shuffle both badges when not playing
  useEffect(() => {
    if (!isBallFalling) {
      // Mini badge
      const miniIdx = MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)];
      setMiniIndex(miniIdx);
      
      // Main badge - ensure it's different from mini
      let mainIdx;
      do {
        mainIdx = MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)];
      } while (mainIdx === miniIdx);
      setMainIndex(mainIdx);
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
        {[...Array(10)].map((_, rowIndex) => (
          <div key={rowIndex} className="peg-row">
            {[...Array(Math.min(20, rowIndex + 5))].map((_, pegIndex) => (
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
              top: [0, 40, 80, 120, 160, 200, 240, 280, 320, 350, 370],
              left: [
                '50%',
                `${48 + Math.random() * 4}%`,
                `${45 + Math.random() * 10}%`,
                `${42 + Math.random() * 16}%`,
                `${38 + Math.random() * 24}%`,
                `${34 + Math.random() * 32}%`,
                `${30 + Math.random() * 40}%`,
                `${26 + Math.random() * 48}%`,
                `${22 + Math.random() * 56}%`,
                `${18 + Math.random() * 64}%`,
                `${10 + (finalSlot * 4.3)}%`,
              ],
            }}
            transition={{
              duration: 3,
              ease: 'easeIn',
            }}
            onAnimationComplete={() => onBallLanded && onBallLanded(finalSlot)}
          >
            <img src={PULSE369_LOGO} alt="Pulse369 DAO" className="ball-logo" />
          </motion.div>
        )}
      </div>

      {/* Slots - Single Row at Bottom */}
      <div className="slots-row">
        {SLOTS.map((s) => (
          <div
            key={s.index}
            data-testid={`slot-${s.index}`}
            className={`slot ${s.kind} ${finalSlot === s.index && isBallFalling ? 'landed' : ''}`}
          >
            {s.kind === 'win' ? (
              <>
                <img src={TOKEN_LOGOS[s.token]} alt={s.token} className="logo" />
                <div className="mult">x{Number(s.multiplier).toFixed(1)}</div>
              </>
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
              Launch Ball • {ENTRY_FEE_PLS.toLocaleString()} PLS
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PlinkoBoard369;