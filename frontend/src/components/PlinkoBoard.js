import React from 'react';
import { motion } from 'framer-motion';

const TOKEN_LOGOS = {
  HEX: '🔷',
  PULSE: '💗',
  PULSEX: '⚡',
  INCENTIVE: '🎁',
  JACKPOT: '🏆'
};

const SLOT_CONFIG = [
  { id: 0, type: 'empty', multiplier: 0 },
  { id: 1, type: 'empty', multiplier: 0 },
  { id: 2, type: 'empty', multiplier: 0 },
  { id: 3, type: 'empty', multiplier: 0 },
  { id: 4, type: 'empty', multiplier: 0 },
  { id: 5, type: 'empty', multiplier: 0 },
  { id: 6, type: 'empty', multiplier: 0 },
  { id: 7, type: 'empty', multiplier: 0 },
  { id: 8, type: 'empty', multiplier: 0 },
  { id: 9, type: 'empty', multiplier: 0 },
  { id: 10, type: 'JACKPOT', multiplier: 'MAIN', label: 'Main' },
  { id: 11, type: 'empty', multiplier: 0 },
  { id: 12, type: 'INCENTIVE', multiplier: 1.1, label: 'INC' },
  { id: 13, type: 'PULSEX', multiplier: 1.5, label: 'PulseX' },
  { id: 14, type: 'empty', multiplier: 0 },
  { id: 15, type: 'HEX', multiplier: 3.0, label: 'HEX' },
  { id: 16, type: 'PULSE', multiplier: 5.0, label: 'PULSE' },
  { id: 17, type: 'empty', multiplier: 0 },
  { id: 18, type: 'empty', multiplier: 0 },
  { id: 19, type: 'empty', multiplier: 0 },
];

const PlinkoBoard = ({ isPlaying, result }) => {
  const getSlotColor = (slot) => {
    if (slot.type === 'empty') return 'bg-gray-100 border-gray-300';
    if (slot.type === 'JACKPOT') return 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-500';
    if (slot.type === 'PULSE') return 'bg-gradient-to-br from-pink-400 to-rose-500 border-pink-500';
    if (slot.type === 'HEX') return 'bg-gradient-to-br from-blue-400 to-indigo-500 border-blue-500';
    if (slot.type === 'PULSEX') return 'bg-gradient-to-br from-purple-400 to-violet-500 border-purple-500';
    if (slot.type === 'INCENTIVE') return 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-500';
    return 'bg-gray-200';
  };

  const isWinningSlot = result && result.slot !== undefined;

  return (
    <div data-testid="plinko-board" className="w-full">
      {/* Plinko Pegs - Visual representation */}
      <div className="mb-8 relative" style={{ height: '300px' }}>
        <div className="absolute inset-0 flex flex-col justify-around">
          {[...Array(8)].map((_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-12">
              {[...Array(Math.min(10, rowIndex + 3))].map((_, pegIndex) => (
                <div
                  key={pegIndex}
                  className="w-3 h-3 rounded-full bg-purple-300 shadow-md"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Animated Ball */}
        {isPlaying && (
          <motion.div
            data-testid="plinko-ball"
            className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg z-10"
            initial={{ top: 0, left: '50%', x: '-50%' }}
            animate={{
              top: [0, 50, 100, 150, 200, 250, 280],
              left: [
                '50%',
                `${45 + Math.random() * 10}%`,
                `${40 + Math.random() * 20}%`,
                `${35 + Math.random() * 30}%`,
                `${30 + Math.random() * 40}%`,
                `${25 + Math.random() * 50}%`,
                `${(result?.slot || 10) * 5}%`,
              ],
            }}
            transition={{
              duration: 2,
              ease: 'easeIn',
            }}
          />
        )}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-20 gap-1">
        {SLOT_CONFIG.map((slot) => (
          <motion.div
            key={slot.id}
            data-testid={`plinko-slot-${slot.id}`}
            className={`
              relative h-20 rounded-lg border-2 flex flex-col items-center justify-center
              transition-all duration-300
              ${getSlotColor(slot)}
              ${isWinningSlot && result.slot === slot.id ? 'ring-4 ring-yellow-400 scale-110 shadow-xl' : ''}
            `}
            animate={{
              scale: isWinningSlot && result.slot === slot.id ? [1, 1.1, 1.05] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {slot.type !== 'empty' && (
              <>
                <span className="text-2xl mb-1">{TOKEN_LOGOS[slot.type]}</span>
                <span className="text-xs font-semibold text-white">
                  {slot.type === 'JACKPOT' ? slot.label : `${slot.multiplier}x`}
                </span>
              </>
            )}
            
            {slot.type === 'empty' && (
              <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-emerald-500" />
          <span className="text-gray-700">INCENTIVE (1.1x)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-400 to-violet-500" />
          <span className="text-gray-700">PulseX (1.5x)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400 to-indigo-500" />
          <span className="text-gray-700">HEX (3x)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-400 to-rose-500" />
          <span className="text-gray-700">PULSE (5x)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-yellow-400 to-orange-500" />
          <span className="text-gray-700">JACKPOT</span>
        </div>
      </div>
    </div>
  );
};

export default PlinkoBoard;