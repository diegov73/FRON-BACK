// Función de seguridad inversa
function verificarSesionInversa() {
    // 1. Buscamos la cookie llamada 'jwt_token'
    const cookieExiste = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt_token='));

    // 2. Si SI existe, lo mandamos al perfil
    if (cookieExiste) {
        window.location.href = './perfil.html'; // Cambia esto por tu página de perfil
    }
}

// EJECUTAR INMEDIATAMENTE
verificarSesionInversa();
