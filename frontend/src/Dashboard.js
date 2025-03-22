import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, LogOut } from 'react-feather'; 
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null); 
    const navigate = useNavigate(); // Hook pour la redirection

    // Vérifie si la permission caméra est accordée
    useEffect(() => {
        navigator.permissions.query({ name: "camera" }).then((result) => {
            console.log("Statut de la permission caméra:", result.state);
            if (result.state === "denied") {
                alert("Accès à la caméra refusé ! Vérifiez vos permissions.");
            }
        });
    }, []);

    // Fonction pour démarrer la caméra
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

    // Affecte le flux vidéo après le rendu
    useEffect(() => {
        if (isCameraOpen && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    // Fonction pour arrêter la caméra
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    // Nettoyage du flux vidéo au démontage du composant
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Fonction pour se déconnecter
    const handleLogout = () => {
        localStorage.removeItem("userToken"); // Suppression du token utilisateur
        navigate("/login", { replace: true }); // Redirection vers la page de connexion
    };

    return (
        <div className="dashboard-container">
            {/* Bouton de déconnexion en haut à gauche */}
            <button className="logout-button" onClick={handleLogout}>
                <LogOut size={30} />
            </button>

            <h2 className="dashboard-title">Scannez l'empreinte !</h2>
            <img src="/empreintes.jpg" alt="Empreinte" className="empreinte-image" />

            {/* Zone d'affichage de la caméra */}
            {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="camera-feed"></video>}

            {/* Bouton pour activer la caméra */}
            {!isCameraOpen && (
                <button className="camera-button" onClick={startCamera}>
                    <Camera size={50} color="white" />
                </button>
            )}

            {/* Bouton pour arrêter la caméra */}
            {isCameraOpen && (
                <button className="stop-button" onClick={stopCamera}>
                    <X size={50} color="white" />
                </button>
            )}
        </div>
    );
}

export default Dashboard;
