import React from 'react'; 
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'; 
import Login from './Login'; 
import Signup from './Signup'; 
import Dashboard from './Dashboard'; 
import "./App.css"; 

// Définition du composant principal App
function App() {
  return (
    <BrowserRouter> {/* Fournit un contexte de routage pour l'application */}
      <MainContent /> {/* Affiche le contenu principal */}
    </BrowserRouter>
  );
}

// Définition du composant qui gère le contenu principal et les routes
function MainContent() {
  const location = useLocation(); // Obtient l'URL actuelle pour conditionner l'affichage

  return (
    <div>
      {/* Affichage du logo sur toutes les pages */}
      <div className="header">
        <img src="logo.png" alt="Logo" className="logo" />
      </div>

      {/* Affiche un contenu spécifique uniquement sur la page d'accueil */}
      {location.pathname === '/' && (
        <div className="content">
          {/* Contenu spécifique pour la page d'accueil, peut être ajouté ici */}
        </div>
      )}

      {/* Définition des différentes routes de l'application */}
      <Routes>
        <Route path="/" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/dashboard" element={<Dashboard />} /> 
      </Routes>
    </div>
  );
}

export default App; // Exportation du composant App pour qu'il soit utilisé ailleurs
