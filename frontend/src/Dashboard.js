import React, { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import './App.css';

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
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const navigate = useNavigate();

    // Vérifie les permissions caméra
    useEffect(() => {
        navigator.permissions.query({ name: "camera" }).then((result) => {
            console.log("Statut de la permission caméra:", result.state);
            if (result.state === "denied") {
                alert("Accès à la caméra refusé ! Vérifiez vos permissions.");
            }
        });
    }, []);

    // Demande de géolocalisation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    console.log("Position obtenue :", { latitude, longitude });
                },
                (error) => {
                    console.error("Erreur de géolocalisation :", error.message);
                    alert("Impossible d'accéder à la localisation. Vérifiez vos permissions.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            console.error("Géolocalisation non supportée par ce navigateur.");
            alert("Votre navigateur ne supporte pas la géolocalisation.");
        }
    }, []);

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
            alert("Impossible d'activer la caméra. Vérifiez vos permissions.");
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

    // Simulation d'analyse
    const analyzeImage = (imageData) => {
        const speciesList = ['Loup', 'Renard', 'Ours', 'Cerf'];
        const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
        const mysqlTimestamp = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
        return {
            species: randomSpecies,
            timestamp: mysqlTimestamp,
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
                longitude: location ? location.longitude : null
            });
            const response = await fetch('http://localhost:3000/scans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de l’envoi du scan: ${response.status} ${response.statusText} - ${errorText}`);
            }
            console.log("Scan enregistré avec succès !");
        } catch (error) {
            console.error("Erreur lors de l’envoi au serveur :", error);
            alert(`Erreur lors de l’enregistrement du scan: ${error.message}`);
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
        setRejectMessage("Certaines fonctionnalités nécessitant le traitement des données seront désactivées.");
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
        navigate("/login", { replace: true });
    };

    return (
        <div>
            {/* En-tête avec le bouton de déconnexion et logo centré */}
            <div className="header">
                <img src="/logo.png" alt="Logo" className="logo" />
                <button className="logout-button" onClick={handleLogout}>
                    Déconnexion
                </button>
            </div>

            <div className="dashboard-container">
                <h2 className="dashboard-title">Scannez l'empreinte !</h2>
                <img src="/empreinte.jpg" alt="Empreinte" className="empreinte-image" />

                {/* Section pour uploader une image */}
                <div className="upload-section">
                    <label htmlFor="image-upload" className="upload-label">
                        Télécharger une image
                    </label>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Zone caméra */}
                {isCameraOpen && (
                    <div className="camera-container">
                        <video ref={videoRef} autoPlay playsInline className="camera-feed" />
                        <button className="capture-button" onClick={captureImage}>
                            <Camera size={30} color="white" /> Scanner
                        </button>
                        <button className="stop-button" onClick={stopCamera}>
                            <X size={50} color="white" />
                        </button>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                )}

                {/* Bouton pour démarrer la caméra */}
                {!isCameraOpen && (
                    <button className="camera-button" onClick={startCamera}>
                        <Camera size={50} color="white" />
                    </button>
                )}

                {/* Affichage de l'image et des résultats */}
                {image && (
                    <div className="result-container">
                        <h3>Image scannée</h3>
                        <img src={image} alt="Empreinte capturée" className="captured-image" />
                    </div>
                )}
                {results && (
                    <div className="result-container">
                        <h3>Résultats</h3>
                        <p>Provenance : {results.source}</p>
                        <p>Espèce : {results.species}</p>
                        <p>Heure : {new Date(results.timestamp).toLocaleString()}</p>
                        <p>Nombre d’images : {results.imageCount}</p>
                        <p>Temps moyen : {results.averageTime}</p>
                        {results.note && <p>{results.note}</p>}
                        {location ? (
                            <p>Localisation : {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                        ) : (
                            <p>Localisation : Non disponible</p>
                        )}
                    </div>
                )}

                {/* Modale pour le consentement des cookies */}
                {showCookieConsent && (
                    <div className="consent-modal side-modal">
                        <p>Nous utilisons des cookies pour améliorer votre expérience. Acceptez-vous ?</p>
                        <div className="consent-buttons">
                            <button onClick={handleCookieAccept}>Oui</button>
                            <button onClick={handleCookieReject} className="reject-button">Non</button>
                        </div>
                    </div>
                )}

                {/* Modale pour le consentement RGPD */}
                {showRgpdConsent && !showCookieConsent && (
                    <div className="consent-modal side-modal">
                        <p>Nous collectons vos données conformément au Règlement Général sur la Protection des Données (RGPD), une loi européenne qui protège vos informations personnelles. Voulez-vous consentir ?</p>
                        <div className="consent-buttons">
                            <button onClick={handleRgpdAccept}>Oui</button>
                            <button onClick={handleRgpdReject} className="reject-button">Non</button>
                        </div>
                    </div>
                )}

                {/* Modale pour les messages de rejet */}
                {showRejectMessage && (
                    <div className="consent-modal side-modal reject-message">
                        <p>{rejectMessage}</p>
                        <button onClick={() => setShowRejectMessage(false)} className="close-button">OK</button>
                    </div>
                )}

                {/* Modale pour la provenance de l'image */}
                {showImageSourceModal && (
                    <div className="consent-modal side-modal">
                        <p>Cette photo a-t-elle été téléchargée depuis un site extérieur ? (Oui pour externe, Non pour prise avec l'app)</p>
                        <div className="consent-buttons">
                            <button onClick={handleImageSourceAccept}>Oui</button>
                            <button onClick={handleImageSourceReject} className="reject-button">Non</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;