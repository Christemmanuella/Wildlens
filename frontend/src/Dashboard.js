import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, LogOut } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [image, setImage] = useState(null);
    const [results, setResults] = useState(null);
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

    // Démarre la caméra
    const startCamera = async () => {
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
    };

    // Nettoyage au démontage
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Capture une image
    const captureImage = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas n'est pas défini");
            return;
        }
        // Réduire la résolution de l'image
        const maxWidth = 320; 
        const maxHeight = 240; 
        let width = video.videoWidth;
        let height = video.videoHeight;

        // Ajuster les dimensions tout en conservant le ratio
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
        // Compression de l'image (qualité réduite à 0.2)
        const imageData = canvas.toDataURL('image/jpeg', 0.2);
        console.log("Taille de l'image (en octets) :", imageData.length);
        setImage(imageData);

        // Analyse simulée
        const analysis = analyzeImage(imageData);
        setResults(analysis);

        // Envoi au backend
        await saveScan(analysis, imageData);
    };

    // Simulation d'analyse
    const analyzeImage = (imageData) => {
        const speciesList = ['Loup', 'Renard', 'Ours', 'Cerf'];
        const randomSpecies = speciesList[Math.floor(Math.random() * speciesList.length)];
        // Convertir la date au format compatible avec MySQL
        const mysqlTimestamp = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
        return {
            species: randomSpecies,
            timestamp: mysqlTimestamp,
            imageCount: 1,
            averageTime: '10s',
        };
    };

    // Envoi des données au backend
    const saveScan = async (analysis, imageData) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Token manquant. Veuillez vous reconnecter.");
            }
            console.log("Token envoyé :", token);
            const body = JSON.stringify({
                species: analysis.species,
                timestamp: analysis.timestamp,
                imageCount: analysis.imageCount,
                averageTime: analysis.averageTime,
                image: imageData,
            });
            console.log("Taille de la requête (en octets) :", body.length);
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

    // Déconnexion
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    return (
        <div className="dashboard-container">
            <button className="logout-button" onClick={handleLogout}>
                <LogOut size={30} />
            </button>

            <h2 className="dashboard-title">Scannez l'empreinte !</h2>
            <img src="/empreintes.jpg" alt="Empreinte" className="empreinte-image" />

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
                    <p>Espèce : {results.species}</p>
                    <p>Heure : {new Date(results.timestamp).toLocaleString()}</p>
                    <p>Nombre d’images : {results.imageCount}</p>
                    <p>Temps moyen : {results.averageTime}</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;