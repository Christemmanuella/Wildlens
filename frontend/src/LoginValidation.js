// Fonction de validation des champs du formulaire de connexion
function LoginValidation(values) {
    let errors = {}; // Objet qui stockera les erreurs détectées

    // Expression régulière pour valider une adresse e-mail standard
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validation du champ email
    if (!values.email || values.email.trim() === "") { // Vérifie si l'email est vide ou contient uniquement des espaces
        errors.email = "L'email ne doit pas être vide"; // Ajoute un message d'erreur si l'email est vide
    } else if (!email_pattern.test(values.email)) { // Vérifie si l'email ne respecte pas le format standard
        errors.email = "L'email ne correspond pas"; // Ajoute un message d'erreur si l'email est invalide
    }

    // Validation du champ mot de passe
    if (!values.password || values.password.trim() === "") { // Vérifie si le mot de passe est vide ou contient uniquement des espaces
        errors.password = "Le mot de passe ne doit pas être vide"; // Ajoute un message d'erreur si le mot de passe est vide
    }

    return errors; // Retourne l'objet contenant les erreurs détectées
}

export default LoginValidation; 