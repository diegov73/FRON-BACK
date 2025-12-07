const api_url = 'http://localhost:4000/loadData';

document.addEventListener('DOMContentLoaded', ()=>{
    userData();
});

async function userData(){
    try{
        const respuesta = await fetch(api_url,{
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