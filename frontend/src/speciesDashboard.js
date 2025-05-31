import React, { useState, useEffect } from 'react';

// URL du backend depuis .env
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function SpeciesDashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      try {
        // Récupérer les scans depuis le backend MySQL
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token manquant. Veuillez vous reconnecter.");
        }
        const response = await fetch(`${BACKEND_URL}/scans`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        const data = await response.json();
        // Joindre les infos espèces depuis /species-info
        const enrichedScans = await Promise.all(
          data.map(async (scan) => {
            try {
              const speciesResponse = await fetch(`${BACKEND_URL}/species-info/${scan.species}`);
              if (!speciesResponse.ok) {
                throw new Error(`Erreur HTTP ${speciesResponse.status}`);
              }
              const speciesInfo = await speciesResponse.json();
              return { ...scan, ...speciesInfo };
            } catch (error) {
              console.error('Erreur pour l’espèce :', error);
              return { ...scan, description: 'N/A', fun_fact: 'N/A' };
            }
          })
        );
        setScans(enrichedScans);
      } catch (error) {
        console.error('Erreur lors de la récupération des scans :', error);
      }
      setLoading(false);
    };

    fetchScans();
  }, []);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Historique des Scans</h2>
      {scans.length === 0 ? (
        <p className="no-data">Aucun historique pour le moment</p>
      ) : (
        <div className="table-wrapper">
          <table className="species-table">
            <thead>
              <tr>
                <th>Espèce</th>
                <th>Nom Latin</th>
                <th>Famille</th>
                <th>Région</th>
                <th>Habitat</th>
                <th>Fait Amusant</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id}>
                  <td>{scan.species}</td>
                  <td>{scan.nom_latin || 'N/A'}</td>
                  <td>{scan.famille || 'N/A'}</td>
                  <td>{scan.region || 'N/A'}</td>
                  <td>{scan.habitat || 'N/A'}</td>
                  <td>{scan.fun_fact || 'N/A'}</td>
                  <td>{scan.description || 'N/A'}</td>
                  <td>{new Date(scan.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SpeciesDashboard;