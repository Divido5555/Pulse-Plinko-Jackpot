import React, { useEffect, useState, useRef } from 'react';
import { SLOTS, MINI_CANDIDATE_INDICES, TOKEN_LOGOS } from '../config/slots';
import { PULSE369_LOGO } from '../config/tokenAssets';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const ENTRY_FEE_PLS = 10000;
const DROP_ZONES = [0, 5, 10, 15]; // 4 drop zones across the top

const PlinkoBoard369 = ({
  isBallFalling,
  onLaunch,
  onBallLanded,
  miniAmountPLS,
  finalSlot,
  onJackpotIndicesChange,
}) => {
  const [miniIndex, setMiniIndex] = useState(
    () => MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)]
  );
  
  const [mainIndex, setMainIndex] = useState(
    () => MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [puckPosition, setPuckPosition] = useState({ x: 50, y: 5 }); // Start centered at top
  const [dropZone, setDropZone] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPath, setAnimationPath] = useState([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [flashingPegs, setFlashingPegs] = useState([]);
  const [landedSlot, setLandedSlot] = useState(null);
  const boardRef = useRef(null);

  // Shuffle both badges when not playing
  useEffect(() => {
    if (!isBallFalling && !isAnimating) {
      const miniIdx = MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)];
      setMiniIndex(miniIdx);
      
      let mainIdx;
      do {
        mainIdx = MINI_CANDIDATE_INDICES[Math.floor(Math.random() * MINI_CANDIDATE_INDICES.length)];
      } while (mainIdx === miniIdx);
      setMainIndex(mainIdx);
      
      if (onJackpotIndicesChange) {
        onJackpotIndicesChange(miniIdx, mainIdx);
      }
    }
  }, [isBallFalling, isAnimating, onJackpotIndicesChange]);

  // Handle puck drag
  const handlePuckDragStart = (e) => {
    if (isAnimating || isBallFalling) return;
    setIsDragging(true);
  };

  const handlePuckDrag = (e) => {
    if (!isDragging || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPuckPosition({ x: Math.max(5, Math.min(95, x)), y: Math.max(0, Math.min(15, y)) });
  };

  const handlePuckDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determine drop zone (0-3)
    const zone = Math.floor(puckPosition.x / 25);
    setDropZone(Math.min(3, Math.max(0, zone)));
    
    // Start animation
    startPuckAnimation(zone);
  };

  const startPuckAnimation = (zone) => {
    setIsAnimating(true);
    setLandedSlot(null); // Clear previous landing
    
    // Generate path with peg collisions
    const path = generatePuckPath(DROP_ZONES[zone]);
    setAnimationPath(path);
    setCurrentPathIndex(0);
  };

  const generatePuckPath = (startX) => {
    const path = [];
    let x = startX + Math.random() * 5; // Add randomness
    
    // Generate 10 rows of movement
    for (let row = 0; row < 10; row++) {
      const y = 10 + (row * 35);
      
      // Random horizontal movement (-2 to +2 slots)
      x += (Math.random() - 0.5) * 8;
      x = Math.max(2.5, Math.min(17.5, x));
      
      path.push({
        x: (x / 20) * 100,
        y: (y / 400) * 100,
        pegRow: row,
      });
    }
    
    // Final position maps to slot
    const finalSlotIndex = Math.round(x);
    path.push({
      x: (finalSlotIndex / 20) * 100,
      y: 92,
      isEnd: true,
      slot: finalSlotIndex,
    });
    
    return path;
  };

  // Animate puck along path
  useEffect(() => {
    if (isAnimating && currentPathIndex < animationPath.length) {
      const timeout = setTimeout(() => {
        const currentPoint = animationPath[currentPathIndex];
        setPuckPosition({ x: currentPoint.x, y: currentPoint.y });
        
        // Flash peg on collision
        if (currentPoint.pegRow !== undefined) {
          setFlashingPegs(prev => [...prev, currentPoint.pegRow]);
          setTimeout(() => {
            setFlashingPegs(prev => prev.filter(r => r !== currentPoint.pegRow));
          }, 150);
        }
        
        // Check if at end
        if (currentPoint.isEnd) {
          setLandedSlot(currentPoint.slot); // Highlight slot AFTER landing
          setTimeout(() => {
            onBallLanded(currentPoint.slot);
            setIsAnimating(false);
            setCurrentPathIndex(0);
            setPuckPosition({ x: 50, y: 5 }); // Reset to top
          }, 500);
        } else {
          setCurrentPathIndex(prev => prev + 1);
        }
      }, 250);
      
      return () => clearTimeout(timeout);
    }
  }, [isAnimating, currentPathIndex, animationPath, onBallLanded]);

  return (
    <div 
      className="board-frame" 
      data-testid="plinko-board-369"
      ref={boardRef}
      onMouseMove={handlePuckDrag}
      onMouseUp={handlePuckDragEnd}
      onMouseLeave={handlePuckDragEnd}
    >
      <div className="mini-banner-top">
        <span className="mini-chip">MINI</span>
        <b>{miniAmountPLS} PLS</b> • 
        <span className="main-chip">MAIN</span>
        <b>Moving</b> — both move each play
      </div>

      {/* Plinko Pegs */}
      <div className="pegs-area">
        {[...Array(10)].map((_, rowIndex) => (
          <div key={rowIndex} className="peg-row">
            {[...Array(Math.min(20, rowIndex + 5))].map((_, pegIndex) => (
              <div 
                key={pegIndex} 
                className={`peg ${flashingPegs.includes(rowIndex) ? 'peg-flash' : ''}`}
              />
            ))}
          </div>
        ))}

        {/* Draggable Puck */}
        {(!isAnimating || isDragging) && (
          <div
            className={`plinko-ball ${isDragging ? 'dragging' : ''}`}
            style={{
              left: `${puckPosition.x}%`,
              top: `${puckPosition.y}%`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handlePuckDragStart}
          >
            <img src={PULSE369_LOGO} alt="Pulse369 DAO" className="ball-logo" />
          </div>
        )}

        {/* Animating Puck */}
        {isAnimating && !isDragging && (
          <div
            className="plinko-ball animating"
            style={{
              left: `${puckPosition.x}%`,
              top: `${puckPosition.y}%`,
            }}
          >
            <img src={PULSE369_LOGO} alt="Pulse369 DAO" className="ball-logo" />
          </div>
        )}
      </div>

      {/* Slots - Single Row at Bottom */}
      <div className="slots-row">
        {SLOTS.map((s) => (
          <div
            key={s.index}
            data-testid={`slot-${s.index}`}
            className={`slot ${s.kind} ${landedSlot === s.index ? 'landed' : ''}`}
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
            {s.index === mainIndex && (
              <div className="main-badge" title="Main jackpot active here">
                MAIN
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="puck-instructions">
        {!isAnimating ? (
          <p><strong>Drag the puck</strong> to one of 4 zones and release to drop!</p>
        ) : (
          <p>Puck falling...</p>
        )}
      </div>
    </div>
  );
};

export default PlinkoBoard369;