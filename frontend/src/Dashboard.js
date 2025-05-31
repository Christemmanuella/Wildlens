import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, MapPin } from 'react-feather';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// URL du backend configurable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function Dashboard() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [location, setLocation] = useState(null);
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [showRgpdConsent, setShowRgpdConsent] = useState(true);
  const [isExternalImage, setIsExternalImage] = useState(false);
  const [imageSource, setImageSource] = useState('');
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [showRejectMessage, setShowRejectMessage] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // Position par défaut si la géolocalisation échoue (Europe centrale)
  const defaultPosition = [54.5260, 15.2551];

  // Données simulées pour les pourcentages d'espèces par région
  const speciesData = [
    { region: 'Europe', position: [54.5260, 15.2551], percentage: 30 },
    { region: 'Afrique', position: [1.2861, 34.2984], percentage: 25 },
    { region: 'Asie', position: [34.0479, 100.6197], percentage: 20 },
    { region: 'Amérique du Nord', position: [54.5259, -105.2551], percentage: 15 },
    { region: 'Amérique du Sud', position: [-14.2350, -51.9253], percentage: 10 },
  ];

  // Vérifie les permissions caméra
  useEffect(() => {
    navigator.permissions.query({ name: "camera" }).then((result) => {
      console.log("Statut de la permission caméra:", result.state);
      if (result.state === "denied") {
        setErrorMessage("Accès à la caméra refusé ! Vérifiez vos permissions.");
        setShowErrorModal(true);
      }
    });
  }, []);

  // Fonction pour demander la géolocalisation
  const requestGeolocation = () => {
    setIsGeolocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          console.log("Position obtenue :", { latitude, longitude });
          setShowMap(true);
          setIsGeolocationLoading(false);
        },
        (error) => {
          console.error("Erreur de géolocalisation :", error.message, "Code:", error.code);
          setErrorMessage("Impossible d'accéder à la localisation. Utilisation d'une position par défaut.");
          setShowErrorModal(true);
          setShowMap(true);
          setLocation(null);
          setIsGeolocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error("Géolocalisation non supportée.");
      setErrorMessage("Géolocalisation non supportée. Utilisation d'une position par défaut.");
      setShowErrorModal(true);
      setShowMap(true);
      setLocation(null);
      setIsGeolocationLoading(false);
    }
  };

  // Démarre la caméra
  const startCamera = async () => {
    if (!cookiesAccepted || !rgpdAccepted) {
      setRejectMessage("Veuillez accepter les cookies et le RGPD pour utiliser la caméra.");
      setShowRejectMessage(true);
      setTimeout(() => setShowRejectMessage(false), 5000);
      return;
    }
    console.log("Tentative d'accès à la caméra...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Erreur d'accès à la caméra :", error);
      setErrorMessage("Impossible d'activer la caméra. Vérifiez vos permissions.");
      setShowErrorModal(true);
    }
  };

  // Affecte le flux vidéo
  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // Arrête la caméra
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setImage(null);
    setResults(null);
    setImageSource('');
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Capture une image via la caméra
  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas n'est pas défini");
      setErrorMessage("Erreur interne : Canvas non disponible.");
      setShowErrorModal(true);
      return;
    }
    const maxWidth = 320;
    const maxHeight = 240;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = canvas.toDataURL('image/jpeg', 0.2);
    console.log("Taille de l'image (en octets) :", imageData.length);
    setImage(imageData);
    setImageSource('Capturée avec la caméra');
    setShowImageSourceModal(true);
  };

  // Upload d'une image depuis le disque
  const handleImageUpload = async (event) => {
    if (!cookiesAccepted || !rgpdAccepted) {
      setRejectMessage("Veuillez accepter les cookies et le RGPD pour uploader une image.");
      setShowRejectMessage(true);
      setTimeout(() => setShowRejectMessage(false), 5000);
      return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageData = reader.result;
      setImage(imageData);
      setImageSource('Téléchargée depuis le disque');
      setShowImageSourceModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Simulation d'analyse avec les 13 espèces
  const analyzeImage = (imageData) => {
    const speciesList = [
      'Castor', 'Chat', 'Chien', 'Coyote', 'Ecureuil', 'Lapin', 'Loup',
      'Lynx', 'Ours', 'Puma', 'Rat', 'Raton laveur', 'Renard'
    ];
    const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
    const now = new Date();
    const mysqlTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');
    const displayTimestamp = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    return {
      species: randomSpecies,
      timestamp: mysqlTimestamp,
      displayTimestamp: displayTimestamp,
      imageCount: 1,
      averageTime: '10s',
      note: isExternalImage ? 'Métadonnées non utilisées (image externe)' : '',
      source: imageSource
    };
  };

  // Envoi des données au backend
  const saveScan = async (analysis, imageData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token manquant. Veuillez vous reconnecter.");
      }
      const body = JSON.stringify({
        species: analysis.species,
        timestamp: analysis.timestamp,
        imageCount: analysis.imageCount,
        averageTime: analysis.averageTime,
        image: imageData,
        latitude: location ? location.latitude : null,
        longitude: location ? location.longitude : null,
      });
      const response = await fetch(`${BACKEND_URL}/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l’enregistrement du scan : ${response.status} ${response.statusText} - ${errorText}`);
      }
      console.log("Scan enregistré avec succès !");
    } catch (error) {
      console.error("Erreur lors de l’envoi au serveur :", error);
      setErrorMessage("Erreur lors de l’enregistrement du scan : " + error.message);
      setShowErrorModal(true);
    }
  };

  // Gestion du consentement cookies
  const handleCookieAccept = () => {
    setCookiesAccepted(true);
    setShowCookieConsent(false);
  };

  const handleCookieReject = () => {
    setCookiesAccepted(false);
    setShowCookieConsent(false);
    setRejectMessage("Certaines fonctionnalités nécessitant les cookies seront désactivées.");
    setShowRejectMessage(true);
    setTimeout(() => setShowRejectMessage(false), 5000);
  };

  // Gestion du consentement RGPD
  const handleRgpdAccept = () => {
    setRgpdAccepted(true);
    setShowRgpdConsent(false);
  };

  const handleRgpdReject = () => {
    setRgpdAccepted(false);
    setShowRgpdConsent(false);
    setRejectMessage("Consentement refusé pour le RGPD. Certaines fonctionnalités seront désactivées.");
    setShowRejectMessage(true);
    setTimeout(() => setShowRejectMessage(false), 5000);
  };

  // Gestion de la modale de provenance de l'image
  const handleImageSourceAccept = () => {
    setIsExternalImage(true);
    setShowImageSourceModal(false);
    const analysis = analyzeImage(image);
    setResults(analysis);
    saveScan(analysis, image);
  };

  const handleImageSourceReject = () => {
    setIsExternalImage(false);
    setShowImageSourceModal(false);
    const analysis = analyzeImage(image);
    setResults(analysis);
    saveScan(analysis, image);
  };

  // Logique de déconnexion
  const handleLogout = () => {
    console.log("Déconnexion déclenchée");
    navigate('/');
  };

  return (
    <div>
      {/* En-tête avec le bouton de déconnexion, logo centré et bouton de localisation */}
      <div className="header">
        <img src="/logo.png" alt="Logo de WildLens" className="logo" />
        <button className="logout-button" onClick={handleLogout} aria-label="Déconnexion">
          Déconnexion
        </button>
        <button
          onClick={() => {
            console.log("Bouton de localisation cliqué");
            if (!showMap) {
              requestGeolocation();
            } else {
              setShowMap(false);
            }
          }}
          className="location-button"
          aria-label="Afficher la carte des espèces"
          disabled={isGeolocationLoading}
        >
          {isGeolocationLoading ? (
            <span>Chargement...</span>
          ) : (
            <MapPin size={24} color="white" />
          )}
        </button>
      </div>

      <div className="dashboard-container">
        <h2 className="dashboard-title">Scannez l'empreinte !</h2>
        <Link to="/species-dashboard" className="history-button">
          Historique des Scans
        </Link>
        <img src="/empreinte.jpg" alt="Exemple d'empreinte animale" className="empreinte-image" />

        {/* Section pour uploader une image */}
        <div className="upload-section">
          <label htmlFor="image-upload" className="upload-label" aria-label="Télécharger une image">
            Télécharger une image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>

        {/* Zone caméra */}
        {isCameraOpen && (
          <div className="camera-container">
            <video ref={videoRef} autoPlay className="camera-feed" />
            <button className="capture-button" onClick={captureImage} aria-label="Scanner l'empreinte">
              <Camera size={30} /> Scanner
            </button>
            <button className="stop-button" onClick={stopCamera} aria-label="Arrêter la caméra">
              <X size={30} />
            </button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {!isCameraOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button className="camera-button" onClick={startCamera} aria-label="Démarrer la caméra">
              <Camera size={30} />
            </button>
          </div>
        )}

        {/* Affichage conditionnel de la carte avec légende */}
        {showMap && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ height: '400px', width: '100%' }}>
              <MapContainer
                center={location ? [location.latitude, location.longitude] : defaultPosition}
                zoom={location ? 10 : 2}
                className="leaflet-container"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {location && (
                  <CircleMarker
                    center={[location.latitude, location.longitude]}
                    radius={10} // Taille fixe pour la position utilisateur
                    color="blue"
                    fillColor="blue"
                    fillOpacity={0.5}
                  >
                    <Popup>Votre position actuelle</Popup>
                  </CircleMarker>
                )}
                {speciesData.map((data, index) => (
                  <CircleMarker
                    key={index}
                    center={data.position}
                    radius={data.percentage * 1.5} // Taille proportionnelle au pourcentage (ajustable)
                    color="red"
                    fillColor="red"
                    fillOpacity={0.5}
                  >
                    <Popup>
                      {data.region}: {data.percentage}% des espèces
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            {/* Légende des pourcentages */}
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              <h4>Légende : Pourcentages d'espèces par région</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {speciesData.map((data) => (
                  <li key={data.region} style={{ margin: '5px 0' }}>
                    {data.region}: {data.percentage}% <span style={{ color: 'red' }}>●</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Affichage de l'image et des résultats */}
        {image && (
          <div className="result-container" role="region" aria-live="polite">
            <h3>Image scannée</h3>
            <img src={image} alt="Empreinte capturée" className="captured-image" />
          </div>
        )}
        {results && (
          <div className="result-container" role="region" aria-live="polite">
            <h3>Résultats</h3>
            <p>Provenance : {results.source}</p>
            <p>Espèce : {results.species}</p>
            <p>Heure : {results.displayTimestamp}</p>
            <p>Nombre d’images : {results.imageCount}</p>
            <p>Temps moyen : {results.averageTime}</p>
            {results.note && <p>{results.note}</p>}
          </div>
        )}

        {/* Modales (inchangées, juste copiées pour intégrité) */}
        {showCookieConsent && (
          <div className="consent-modal side-modal" role="dialog" aria-labelledby="cookie-consent-title">
            <p id="cookie-consent-title">Nous utilisons des cookies pour améliorer votre expérience. Acceptez-vous ?</p>
            <div className="consent-buttons">
              <button onClick={handleCookieAccept} aria-label="Accepter les cookies">Oui</button>
              <button onClick={handleCookieReject} className="reject-button" aria-label="Refuser les cookies">Non</button>
            </div>
          </div>
        )}

        {showRgpdConsent && !showCookieConsent && (
          <div className="consent-modal side-modal" role="dialog" aria-labelledby="rgpd-consent-title">
            <p id="rgpd-consent-title">Nous collectons vos données conformément au RGPD. Voulez-vous consentir ?</p>
            <div className="consent-buttons">
              <button onClick={handleRgpdAccept} aria-label="Accepter le RGPD">Oui</button>
              <button onClick={handleRgpdReject} className="reject-button" aria-label="Refuser le RGPD">Non</button>
            </div>
          </div>
        )}

        {showRejectMessage && (
          <div className="consent-modal side-modal reject-message" role="alertdialog" aria-labelledby="reject-message-title">
            <p id="reject-message-title">{rejectMessage}</p>
            <button onClick={() => setShowRejectMessage(false)} className="close-button" aria-label="Fermer le message">OK</button>
          </div>
        )}

        {showImageSourceModal && (
          <div className="consent-modal side-modal" role="dialog" aria-labelledby="image-source-title">
            <p id="image-source-title">Cette photo a-t-elle été téléchargée depuis un site extérieur ?</p>
            <div className="consent-buttons">
              <button onClick={handleImageSourceAccept} aria-label="Oui, image externe">Oui</button>
              <button onClick={handleImageSourceReject} className="reject-button" aria-label="Non, prise avec l'app">Non</button>
            </div>
          </div>
        )}

        {showErrorModal && (
          <div className="consent-modal side-modal error-modal" role="alertdialog" aria-labelledby="error-message-title">
            <p id="error-message-title">{errorMessage}</p>
            <button onClick={() => setShowErrorModal(false)} className="close-button" aria-label="Fermer l'erreur">OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;