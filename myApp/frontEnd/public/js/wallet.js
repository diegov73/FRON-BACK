const api_load_url = 'http://localhost:4000/loadData';
const api_update_url = 'http://localhost:4000/api/wallet/update';

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

async function agregarDinero() {
    const amount = document.getElementById('add-amount').value;
    if (!amount || amount <= 0) {
        document.getElementById('mensaje').textContent = 'Por favor, introduce una cantidad válida para agregar.';
        return;
    }
    await updateWallet(parseFloat(amount), 'add');
}

async function retirarDinero() {
    const amount = document.getElementById('subtract-amount').value;
    if (!amount || amount <= 0) {
        document.getElementById('mensaje').textContent = 'Por favor, introduce una cantidad válida para retirar.';
        return;
    }
    await updateWallet(parseFloat(amount), 'subtract');
}

async function updateWallet(amount, action) {
    const mensaje = document.getElementById('mensaje');
    try {
        const response = await fetch(api_update_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ amount, action })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('saldo').textContent = `${data.nuevoSaldo}`;
            mensaje.textContent = `Transacción exitosa. Nuevo saldo: ${data.nuevoSaldo}`;
            // Limpiar campos de entrada
            document.getElementById('add-amount').value = '';
            document.getElementById('subtract-amount').value = '';
        } else {
            mensaje.textContent = `Error: ${data.error}`;
        }
    } catch (error) {
        console.error('Error al actualizar la billetera:', error);
        mensaje.textContent = 'Error de conexión con el servidor.';
    }
}