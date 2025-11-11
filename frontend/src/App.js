import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PlinkoGame369 from './pages/PlinkoGame369';
import AdminDashboard from './pages/AdminDashboard';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PlinkoGame369 />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;