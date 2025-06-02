import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import SpeciesDashboard from './speciesDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <MainContent />
    </BrowserRouter>
  );
}

function MainContent() {
  const location = useLocation();

  return (
    <div>
      <div className="header">
        <img src="logo.png" alt="Logo de WildLens" className="logo" />
      </div>

      {location.pathname === '/' && (
        <div className="content">
          {/* Contenu vide comme dans ton code d'origine */}
        </div>
      )}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/species-dashboard" element={<SpeciesDashboard />} />
      </Routes>
    </div>
  );
}

export default App;