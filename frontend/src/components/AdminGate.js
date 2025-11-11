import React from 'react';

// Simple admin gate - in production, integrate with wallet connection
const HOST_ADDRESS = process.env.REACT_APP_HOST_ADDRESS || '';

const AdminGate = ({ children, connectedAddress }) => {
  const isHost = connectedAddress?.toLowerCase() === HOST_ADDRESS.toLowerCase();
  
  if (!isHost) return null;
  
  return <>{children}</>;
};

export default AdminGate;