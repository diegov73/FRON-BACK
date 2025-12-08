// Función de seguridad
function verificarSesion() {
    // 1. Buscamos la cookie llamada 'jwt_token'
    const cookieExiste = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt_token='));

    // 2. Si NO existe, lo mandamos afuera
    if (!cookieExiste) {
        alert("Debes iniciar sesión para ver esta página.");
        window.location.href = 'landSite.html'; // Cambia esto por tu 'landSite' (ej: login.html)
    }
}

// EJECUTAR INMEDIATAMENTE
verificarSesion();
const api_load_url = 'http://localhost:4000/loadData';

document.addEventListener('DOMContentLoaded', ()=>{
    userData();
});

async function userData(){
    try{
        const respuesta = await fetch(api_load_url,{
            method: 'get',
            credentials: 'include'
        });

        const data = await respuesta.json();

        if(respuesta.ok){
            const usuario = data.usuario;

            const elementoNombre = document.getElementById('cuenta');
            if(elementoNombre) elementoNombre.textContent = usuario.username;
            
            const elementoSaldo = document.getElementById('saldo');
            if(elementoSaldo) elementoSaldo.textContent= `${usuario.balance}`;
        }
        else{
            console.warn('sesion invalida', data.error);
        }
    }
    catch(error){
        console.error('error al conectarse con el servido, loadData', error);
    }
}