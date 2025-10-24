import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Sparkles } from 'lucide-react';

const JackpotDisplay = ({ type, amount, odds }) => {
  const isMain = type === 'main';
  
  return (
    <Card
      data-testid={`jackpot-${type}`}
      className={`
        relative overflow-hidden
        ${isMain
          ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500'
          : 'bg-gradient-to-br from-purple-400 via-pink-400 to-rose-500'
        }
        border-0 shadow-2xl
      `}
    >
      <div className="absolute inset-0 bg-black/10" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-white flex items-center gap-2">
          {isMain ? (
            <Trophy className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
          {isMain ? 'Main Jackpot' : 'Mini Jackpot'}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <p className="text-4xl font-bold text-white mb-2">
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>
        <p className="text-white/90 text-sm">
          Odds: {odds}
        </p>
        <p className="text-white/70 text-xs mt-2">
          {isMain ? '60% to winner, 10% burn, 10% host, 10% dev, 10% reset' : '80% to winner, 10% host, 10% reset'}
        </p>
      </CardContent>
    </Card>
  );
};

export default JackpotDisplay;