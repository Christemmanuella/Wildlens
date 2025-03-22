import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Validation from './SignupValidation'; 
import axios from 'axios'; //Pour les requêtes HTTP

function Signup() {
    // Déclaration de l'état pour stocker les valeurs du formulaire
    const [values, setValues] = useState({
        surname: '',
        firstname: '',
        email: '',
        password: '',
        confirmpassword: '',
    });

    const navigate = useNavigate(); // Hook pour rediriger l'utilisateur après l'inscription

    // États pour la gestion des erreurs et des messages de retour
    const [errors, setErrors] = useState({}); // Stocke les erreurs de validation
    const [serverError, setServerError] = useState(''); // Stocke les erreurs renvoyées par le serveur
    const [successMessage, setSuccessMessage] = useState(''); // Stocke un message de succès en cas d'inscription réussie

    // Fonction pour mettre à jour les valeurs du formulaire à chaque saisie
    const handleInput = (event) => {
        setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    // Fonction pour gérer la soumission du formulaire
    const handleSubmit = (event) => {
        event.preventDefault(); // Empêche le rechargement de la page lors de la soumission du formulaire
        
        console.log("Formulaire soumis avec :", values); // Affiche les valeurs du formulaire dans la console

        // Validation des champs du formulaire
        const validationErrors = Validation(values);
        setErrors(validationErrors);
        setServerError('');
        setSuccessMessage(''); // Réinitialise le message de succès

        // Vérifie s'il y a des erreurs de validation avant d'envoyer la requête au serveur
        if (Object.keys(validationErrors).length === 0) {
            console.log("Aucun problème de validation, envoi des données...");

            // Envoi des données au serveur via une requête POST
            axios.post('http://localhost:3000/signup', values)
                .then(res => {
                    console.log('Réponse du serveur:', res.data);
                    setSuccessMessage("Utilisateur enregistré avec succès !"); // Affiche un message de succès
                    setServerError('');

                    // Attente de 5 secondes avant de rediriger vers la page de connexion
                    setTimeout(() => {
                        navigate('/');
                    }, 5000);
                })
                .catch(err => {
                    if (err.response) {
                        console.error('Réponse du serveur:', err.response.data);
                        setServerError(err.response.data.message); // Stocke le message d'erreur du serveur
                    } else {
                        console.error('Erreur Axios:', err.message);
                    }
                });
        } else {
            console.log('Erreurs de validation détectées:', validationErrors);
        }
    };

    return (
        <div className='form-container'>
            <div className='form-box'>
                {/* Titre du formulaire */}
                <h2
                    style={{
                        backgroundColor: '#31C48D',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        textAlign: 'center'
                    }}
                >
                    Inscription
                </h2>

                {/* Affichage du message de succès si l'inscription est réussie */}
                {successMessage && <p style={{ color: '#31C48D', textAlign: 'center', fontWeight: 'bold' }}>{successMessage}</p>}
                {/* Affichage de l'erreur serveur s'il y en a une */}
                {serverError && <p className='text-danger text-center'>{serverError}</p>} 

                <form onSubmit={handleSubmit}>
                    {/* Champ Nom */}
                    <div className='mb-3'>
                        <label htmlFor="surname"><strong>Nom</strong></label>
                        <input
                            type="text"
                            placeholder='Entrer le nom'
                            name='surname'
                            value={values.surname}
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                        {errors.surname && <span className='text-danger'>{errors.surname}</span>}
                    </div>

                    {/* Champ Prénom */}
                    <div className='mb-3'>
                        <label htmlFor="firstname"><strong>Prénoms</strong></label>
                        <input
                            type="text"
                            placeholder='Entrer les prénoms'
                            name='firstname'
                            value={values.firstname}
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                        {errors.firstname && <span className='text-danger'>{errors.firstname}</span>}
                    </div>

                    {/* Champ Email */}
                    <div className='mb-3'>
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input
                            type="email"
                            placeholder='Entrer un email'
                            name='email'
                            value={values.email}
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                        {errors.email && <span className='text-danger'>{errors.email}</span>}
                        {serverError && <span className='text-danger'>{serverError}</span>}
                    </div>

                    {/* Champ Mot de passe */}
                    <div className='mb-3'>
                        <label htmlFor="password"><strong>Mot de passe</strong></label>
                        <input
                            type="password"
                            placeholder='Entrer un mot de passe'
                            name='password'
                            value={values.password}
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                        {errors.password && <span className='text-danger'>{errors.password}</span>}
                    </div>

                    {/* Champ Confirmation du mot de passe */}
                    <div className='mb-3'>
                        <label htmlFor="confirmpassword"><strong>Confirmer le mot de passe</strong></label>
                        <input
                            type="password"
                            placeholder='Confirmer le mot de passe'
                            name='confirmpassword'
                            value={values.confirmpassword}
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                        {errors.confirmpassword && <span className='text-danger'>{errors.confirmpassword}</span>}
                    </div>

                    {/* Bouton d'inscription */}
                    <button
                        type='submit'
                        className='btn btn-success w-100'
                        style={{
                            backgroundColor: '#31C48D',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            textAlign: 'center',
                            marginBottom: '10px'
                        }}
                    >
                        S'inscrire
                    </button>

                    {/* Lien vers la page de connexion */}
                    <Link
                        to="/"
                        className='btn border w-100 rounded-0 text-decoration-none text-center d-block'
                        style={{
                            backgroundColor: '#31C48D',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '5px'
                        }}
                    >
                        Se Connecter
                    </Link>
                </form>
            </div>
        </div>
    );
}

export default Signup; // Exporte le composant pour l'utiliser ailleurs

