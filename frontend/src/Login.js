import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import "./App.css";
import Validation from './LoginValidation';

function Login() {
    const [values, setValues] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [serverMessage, setServerMessage] = useState(null); // Message d'erreur ou de succès
    const navigate = useNavigate();

    // Fonction pour mettre à jour les valeurs du formulaire
    const handleInput = (event) => {
        setValues(prev => ({ ...prev, [event.target.name]: event.target.value }));
    };

    // Fonction de soumission du formulaire de connexion
    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors(Validation(values)); 

        // Vérifier si les champs email et password sont remplis
        if (!values.email || !values.password) {
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();
            console.log("Réponse du serveur :", data); 

            if (response.ok) {
                // Stockage du token JWT dans le stockage local (localStorage)
                localStorage.setItem("token", data.token);

                
                setServerMessage({ text: "Connexion réussie !", type: "success" });

                setTimeout(() => {
                    navigate('/dashboard');  
                }, 2000);
            } else {
             
                setServerMessage({ text: data.message, type: "error" });
            }
        } catch (error) {
            setServerMessage({ text: "Erreur de connexion au serveur", type: "error" });
        }
    };

    return (  
        <div className='form-container-login'>
            <div className='form-box'>
            <h1>Bienvenue sur Wildlens !</h1>
                <h2 style={{ backgroundColor: '#31C48D', color: 'white', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>Connexion</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>       
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input 
                            type="email" 
                            placeholder='Entrer un email' 
                            name='email'
                            onChange={handleInput} 
                            className='form-control rounded-0'
                        />
                        {errors.email && <span className='text-danger'>{errors.email}</span>}
                    </div>
                    <div className='mb-3'>       
                        <label htmlFor="password"><strong>Mot de passe</strong></label>
                        <input 
                            type="password" 
                            placeholder='Entrer le mot de passe' 
                            name='password' 
                            onChange={handleInput} 
                            className='form-control rounded-0'
                        />
                        {errors.password && <span className='text-danger'>{errors.password}</span>}
                    </div>

                    {serverMessage && (
                        <div style={{ 
                            color: serverMessage.type === "success" ? "#31C48D" : "red", 
                            fontWeight: 'bold',
                            marginBottom: '10px'
                        }}>
                            {serverMessage.text}
                        </div>
                    )}

                    <button 
                        style={{ backgroundColor: '#31C48D', color: 'white', padding: '10px 20px', borderRadius: '5px' }} 
                        type='submit' 
                        className='btn btn-success'
                    >
                        Se connecter
                    </button>
                    
                    <Link 
                        style={{ backgroundColor: '#31C48D', color: 'white', padding: '10px 10px', borderRadius: '5px'}} 
                        to="/signup" 
                        className='btn btn-default border w-100 bg-light rounded-0 text-decoration-none'
                    >
                        Créer un compte
                    </Link>
                </form>
            </div>  
        </div>
    );
}

export default Login;