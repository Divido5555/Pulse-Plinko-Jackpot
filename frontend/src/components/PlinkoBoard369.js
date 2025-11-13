import React, { useEffect, useState, useRef } from 'react';
import { SLOTS, MINI_CANDIDATE_INDICES, TOKEN_LOGOS } from '../config/slots';
import { PULSE369_LOGO } from '../config/tokenAssets';
import BLOCKER_SVG from '../assets/blocker.svg';

const ENTRY_FEE_PLS = 10000;

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
  const [blockerPositions, setBlockerPositions] = useState([]);
  const boardRef = useRef(null);
  const animationRef = useRef(null);
  const velocityRef = useRef({ vx: 0, vy: 0 });

  // Generate rectangular staggered Plinko grid with blockers at top
  useEffect(() => {
    const pegs = [];
    const numRows = 19; // 19 rows with expanded spacing
    const numColumns = 20; // 20 columns matching reference
    
    const boardWidth = 90; // Use 90% of board width
    const boardHeight = 80; // Use 80% of board height
    const startX = 5; // Start 5% from left
    
    // Blockers are positioned at the top, then pegs start below them
    const blockerHeight = 3; // Height space for blockers at top (in %)
    const pegStartY = 8 + blockerHeight; // Pegs start after blocker space
    
    const horizontalSpacing = boardWidth / numColumns; // Spacing for 20 columns
    const verticalSpacing = (boardHeight - blockerHeight) / numRows; // Spacing adjusted for blocker space
    
    for (let row = 0; row < numRows; row++) {
      // Determine if this is an even or odd row for staggering
      const isOddRow = row % 2 === 1;
      
      // Odd rows are offset by half the horizontal spacing (pegs sit in middle of gaps above)
      const offsetX = isOddRow ? horizontalSpacing / 2 : 0;
      
      // Number of pegs in this row
      // Even rows: 21 pegs (for 20 slots)
      // Odd rows: 20 pegs (offset, creating alternating pattern)
      const pegsInRow = isOddRow ? numColumns : numColumns + 1;
      
      for (let col = 0; col < pegsInRow; col++) {
        pegs.push({
          id: `${row}-${col}`,
          x: startX + offsetX + (col * horizontalSpacing),
          y: pegStartY + (row * verticalSpacing),
          row,
          col,
        });
      }
    }
    setPegPositions(pegs);
    
    // Add small horizontal blockers ABOVE first row of pegs
    const blockers = [];
    const blockerY = 8; // Position at top, before pegs start
    
    // Left blocker: starts at left margin (x=0), extends to about 2nd column
    const leftBlockerWidth = startX + (2 * horizontalSpacing); // Extends to 2nd peg position
    blockers.push({
      id: 'blocker-left',
      x: 0, // Start at left edge
      y: blockerY,
      width: leftBlockerWidth,
      side: 'left',
    });
    
    // Right blocker: extends from 2nd-to-last column to right edge
    const rightBlockerStart = startX + ((numColumns - 2) * horizontalSpacing);
    const rightBlockerWidth = (100 - rightBlockerStart); // Extend to right edge
    blockers.push({
      id: 'blocker-right',
      x: rightBlockerStart,
      y: blockerY,
      width: rightBlockerWidth,
      side: 'right',
    });
    
    setBlockerPositions(blockers);
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
      y: Math.max(0, Math.min(7, y)) 
    });
  };

  const handlePuckDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startPuckAnimation();
  };

  const checkBlockerCollision = (x, y, vx, vy) => {
    const blockerHeight = 3; // Height of horizontal blocker collision area
    
    for (const blocker of blockerPositions) {
      // Check if puck is within blocker's horizontal range and near its y position
      const isInHorizontalRange = x >= blocker.x && x <= (blocker.x + blocker.width);
      const dy = Math.abs(y - blocker.y);
      
      if (isInHorizontalRange && dy < blockerHeight) {
        // Bounce away from blocker (vertical bounce)
        return {
          blocker,
          newVx: vx * 0.7 + (Math.random() - 0.5) * 0.5,
          newVy: -Math.abs(vy) * 0.6, // Bounce upward/away
        };
      }
    }
    return null;
  };

  const checkPegCollision = (x, y, vx, vy) => {
    const collisionRadius = 2.5; // Increased collision detection radius
    
    for (const peg of pegPositions) {
      const dx = x - peg.x;
      const dy = y - peg.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < collisionRadius) {
        // Calculate bounce direction
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(vx * vx + vy * vy);
        
        return {
          peg,
          newVx: Math.cos(angle) * speed * 0.5 + (Math.random() - 0.5) * 0.8,
          newVy: Math.sin(angle) * speed * 0.4 + 0.5,
        };
      }
    }
    return null;
  };

  const startPuckAnimation = () => {
    setIsAnimating(true);
    setLandedSlot(null);
    
    let currentX = puckPosition.x;
    let currentY = puckPosition.y;
    velocityRef.current = { vx: (Math.random() - 0.5) * 0.5, vy: 0 };
    
    const gravity = 0.25;
    const friction = 0.99;
    const maxVelocity = 3;
    
    const animate = () => {
      // Apply gravity
      velocityRef.current.vy += gravity;
      
      // Limit velocity
      velocityRef.current.vx = Math.max(-maxVelocity, Math.min(maxVelocity, velocityRef.current.vx));
      velocityRef.current.vy = Math.min(maxVelocity, velocityRef.current.vy);
      
      // Update position
      currentX += velocityRef.current.vx;
      currentY += velocityRef.current.vy;
      
      // Check blocker collisions first
      const blockerCollision = checkBlockerCollision(
        currentX,
        currentY,
        velocityRef.current.vx,
        velocityRef.current.vy
      );
      
      if (blockerCollision) {
        // Apply bounce from blocker
        velocityRef.current.vx = blockerCollision.newVx;
        velocityRef.current.vy = blockerCollision.newVy;
        
        // Move puck away from blocker
        if (currentX < blockerCollision.blocker.x) {
          currentX = blockerCollision.blocker.x - 2;
        } else {
          currentX = blockerCollision.blocker.x + 2;
        }
      }
      
      // Check peg collisions
      const collision = checkPegCollision(
        currentX, 
        currentY, 
        velocityRef.current.vx, 
        velocityRef.current.vy
      );
      
      if (collision) {
        // Flash individual peg
        setFlashingPeg(collision.peg.id);
        setTimeout(() => setFlashingPeg(null), 120);
        
        // Apply bounce
        velocityRef.current.vx = collision.newVx;
        velocityRef.current.vy = collision.newVy;
        
        // Move puck away from peg slightly
        const angle = Math.atan2(currentY - collision.peg.y, currentX - collision.peg.x);
        currentX = collision.peg.x + Math.cos(angle) * 2.5;
        currentY = collision.peg.y + Math.sin(angle) * 2.5;
      }
      
      // Apply friction
      velocityRef.current.vx *= friction;
      
      // Side boundaries with bounce
      if (currentX < 3) {
        currentX = 3;
        velocityRef.current.vx = Math.abs(velocityRef.current.vx) * 0.7;
      }
      if (currentX > 97) {
        currentX = 97;
        velocityRef.current.vx = -Math.abs(velocityRef.current.vx) * 0.7;
      }
      
      setPuckPosition({ x: currentX, y: currentY });
      
      // Check if reached bottom (90% down)
      if (currentY >= 90) {
        // Map X position to slot (24 slots)
        const slotIndex = Math.round((currentX / 100) * 23);
        const finalSlot = Math.max(0, Math.min(23, slotIndex));
        
        setLandedSlot(finalSlot);
        setTimeout(() => {
          onBallLanded(finalSlot);
          setIsAnimating(false);
          setPuckPosition({ x: 50, y: 3 });
          velocityRef.current = { vx: 0, vy: 0 };
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

      {/* Extended Plinko Pegs Area with Staggered Layout */}
      <div className="pegs-area-extended">
        {/* Horizontal blockers at row 4 */}
        {blockerPositions.map((blocker) => (
          <div
            key={blocker.id}
            className={`blocker-horizontal blocker-${blocker.side}`}
            style={{
              left: `${blocker.x}%`,
              top: `${blocker.y}%`,
              width: `${blocker.width}%`,
            }}
          >
            <img src={BLOCKER_SVG} alt="Blocker" className="blocker-image" draggable={false} />
          </div>
        ))}

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
            pointerEvents: isAnimating ? 'none' : 'auto',
          }}
          onMouseDown={handlePuckDragStart}
          onTouchStart={handlePuckDragStart}
        >
          <img src={PULSE369_LOGO} alt="Pulse369 DAO" className="ball-logo" draggable={false} />
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