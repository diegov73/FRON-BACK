const api_url = 'http://localhost:4000/logIn';

async function enviarFormulario(){
    const username = document.getElementById('username').value;
    const passWord1 = document.getElementById('password1').value;
    const passWord2 = document.getElementById('password2').value;
    const mensaje = document.getElementById('mensaje').value;

    console.log(`${username}, ${passWord1}, ${passWord2}`)
    if(username === '' || passWord1 === '' || passWord2 === ''){
        mensaje.textContent = 'rellena todos los valores';
        return;
    }

    try{
        const respuesta = await fetch(api_url,{
            method: 'post',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, passWord1, passWord2})
        });

        const data = await respuesta.json();
    }
    catch(error){
        resultadoSpan.textContent = 'Error: No se pudo conectar con el servidor 4000.';
    }
}