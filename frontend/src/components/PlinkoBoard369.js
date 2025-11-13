import React, { useEffect, useState, useRef } from 'react';
import { SLOTS, MINI_CANDIDATE_INDICES, TOKEN_LOGOS } from '../config/slots';
import { PULSE369_LOGO } from '../config/tokenAssets';

const ENTRY_FEE_PLS = 10000;
const NUM_PEGS_PER_ROW = 13; // Pegs across
const NUM_ROWS = 14; // 4 more rows added
const DROP_ZONES = 4; // 4 drop zones

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
  const [puckPosition, setPuckPosition] = useState({ x: 50, y: 3 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashingPeg, setFlashingPeg] = useState(null);
  const [landedSlot, setLandedSlot] = useState(null);
  const [pegPositions, setPegPositions] = useState([]);
  const boardRef = useRef(null);
  const animationRef = useRef(null);

  // Generate peg positions
  useEffect(() => {
    const pegs = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      const numPegsInRow = NUM_PEGS_PER_ROW + (row % 2);
      const offsetX = (row % 2) === 0 ? 0 : 2.5;
      
      for (let i = 0; i < numPegsInRow; i++) {
        pegs.push({
          id: `${row}-${i}`,
          x: offsetX + (i * 7.5),
          y: 8 + (row * 5.5),
          row,
          col: i,
        });
      }
    }
    setPegPositions(pegs);
  }, []);

  // Shuffle badges
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

  const handlePuckDragStart = (e) => {
    if (isAnimating || isBallFalling) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handlePuckDrag = (e) => {
    if (!isDragging || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!clientX || !clientY) return;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setPuckPosition({ 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(0, Math.min(8, y)) 
    });
  };

  const handlePuckDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startPuckAnimation();
  };

  const checkPegCollision = (x, y) => {
    for (const peg of pegPositions) {
      const dx = x - peg.x;
      const dy = y - peg.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 2) { // Collision threshold
        return peg;
      }
    }
    return null;
  };

  const startPuckAnimation = () => {
    setIsAnimating(true);
    setLandedSlot(null);
    
    let currentX = puckPosition.x;
    let currentY = puckPosition.y;
    let velocityX = 0;
    let velocityY = 0;
    const gravity = 0.3;
    const bounce = 0.6;
    const friction = 0.98;
    
    const animate = () => {
      // Apply gravity
      velocityY += gravity;
      
      // Update position
      currentX += velocityX;
      currentY += velocityY;
      
      // Check peg collisions
      const collidedPeg = checkPegCollision(currentX, currentY);
      if (collidedPeg) {
        // Flash individual peg
        setFlashingPeg(collidedPeg.id);
        setTimeout(() => setFlashingPeg(null), 150);
        
        // Bounce off peg
        const angle = Math.atan2(currentY - collidedPeg.y, currentX - collidedPeg.x);
        velocityX = Math.cos(angle) * 2 + (Math.random() - 0.5) * 1;
        velocityY = Math.abs(Math.sin(angle)) * 2;
      }
      
      // Apply friction
      velocityX *= friction;
      
      // Boundaries
      if (currentX < 2) {
        currentX = 2;
        velocityX = Math.abs(velocityX) * bounce;
      }
      if (currentX > 98) {
        currentX = 98;
        velocityX = -Math.abs(velocityX) * bounce;
      }
      
      setPuckPosition({ x: currentX, y: currentY });
      
      // Check if reached bottom
      if (currentY >= 88) {
        // Map X position to slot (24 slots)
        const slotIndex = Math.round((currentX / 100) * 23);
        const finalSlot = Math.max(0, Math.min(23, slotIndex));
        
        setLandedSlot(finalSlot);
        setTimeout(() => {
          onBallLanded(finalSlot);
          setIsAnimating(false);
          setPuckPosition({ x: 50, y: 3 });
        }, 400);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="board-frame" 
      data-testid="plinko-board-369"
      ref={boardRef}
      onMouseMove={handlePuckDrag}
      onMouseUp={handlePuckDragEnd}
      onMouseLeave={handlePuckDragEnd}
      onTouchMove={handlePuckDrag}
      onTouchEnd={handlePuckDragEnd}
    >
      <div className="mini-banner-top">
        <span className="mini-chip">MINI</span>
        <b>{miniAmountPLS} PLS</b> • 
        <span className="main-chip">MAIN</span>
        <b>Moving</b> — both move each play
      </div>

      {/* Extended Plinko Pegs Area */}
      <div className="pegs-area-extended">
        {pegPositions.map((peg) => (
          <div
            key={peg.id}
            className={`peg-individual ${flashingPeg === peg.id ? 'peg-flash' : ''}`}
            style={{
              left: `${peg.x}%`,
              top: `${peg.y}%`,
            }}
          />
        ))}

        {/* Draggable/Animating Puck */}
        <div
          className={`plinko-ball ${isDragging ? 'dragging' : ''} ${isAnimating ? 'animating' : ''}`}
          style={{
            left: `${puckPosition.x}%`,
            top: `${puckPosition.y}%`,
            cursor: isAnimating ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          }}
          onMouseDown={handlePuckDragStart}
          onTouchStart={handlePuckDragStart}
        >
          <img src={PULSE369_LOGO} alt="Pulse369 DAO" className="ball-logo" />
        </div>
      </div>

      {/* 24 Slots at Bottom */}
      <div className="slots-row-24">
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
          <p><strong>Drag the puck</strong> and release to drop!</p>
        ) : (
          <p>Puck falling...</p>
        )}
      </div>
    </div>
  );
};

export default PlinkoBoard369;