import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ResultBanner = ({ kind, text, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="result-banner"
          className={`result-banner ${kind}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.26 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultBanner;