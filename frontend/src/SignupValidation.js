function SignupValidation(values) {
    let errors = {}; // Objet qui stockera les erreurs de validation

    // Définition des patterns pour l'email et le mot de passe
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Vérifie si l'email est bien formaté
    const password_pattern = /^.{8,}$/;  // Vérifie si le mot de passe contient au moins 8 caractères

    // Validation du nom
    if (!values.surname || values.surname.trim() === "") {
        errors.surname = "Le nom ne doit pas être vide";
    }

    // Validation du prénom
    if (!values.firstname || values.firstname.trim() === "") {
        errors.firstname = "Le prénom ne doit pas être vide";
    }

    // Validation de l'email
    if (!values.email || values.email.trim() === "") {
        errors.email = "L'email ne doit pas être vide";
    } else if (!email_pattern.test(values.email)) {
        errors.email = "L'email n'est pas valide"; // Si l'email ne correspond pas au format attendu
    }

    // Validation du mot de passe
    if (!values.password || values.password.trim() === "") {
        errors.password = "Le mot de passe ne doit pas être vide";
    } else if (!password_pattern.test(values.password)) {
        errors.password = "Le mot de passe doit contenir au moins 8 caractères"; // Vérifie la longueur minimale
    }

    // Validation de la confirmation du mot de passe
    if (!values.confirmpassword || values.confirmpassword.trim() === "") {
        errors.confirmpassword = "Veuillez confirmer votre mot de passe";
    } else if (values.confirmpassword !== values.password) {
        errors.confirmpassword = "Les mots de passe ne correspondent pas"; // Vérifie si les deux mots de passe sont identiques
    }

    return errors; // Retourne l'objet contenant toutes les erreurs détectées
}

export default SignupValidation; // Exporte la fonction pour l'utiliser ailleurs
