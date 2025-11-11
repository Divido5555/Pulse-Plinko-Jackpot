import React from 'react';

const GameHeader = ({ miniAmountPLS, mainAmountPLS }) => {
  return (
    <header className="game-header">
      <div className="header-content">
        <h1 className="game-title">Pulse369 DAO • PulseChain Plinko Jackpot</h1>
        <div className="jackpot-tickers">
          <div className="ticker mini-ticker">
            <span className="tag">MINI JACKPOT</span>
            <span className="value">{miniAmountPLS} PLS</span>
          </div>
          <div className="ticker main-ticker">
            <span className="tag">MAIN JACKPOT</span>
            <span className="value">{mainAmountPLS} PLS</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;