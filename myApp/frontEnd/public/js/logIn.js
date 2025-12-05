const api_url = 'http://localhost:4000/logIn';

async function enviarFormulario(){
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const mensaje = document.getElementById('mensaje');

    console.log('datos a enviar');
    console.log(`${username}, ${password}`);

    if(username === '' || password === ''){
        mensaje.textContent = 'rellena todos los valores';
        return;
    }

    try{
        const respuesta  = await fetch(api_url,{
            method: 'post',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        const data = await respuesta.json();

        console.log('datos recibidos');
        console.log(data);

        document.cookie = `jwt_token=${data.token}; path=/; max-age-3600`;

        window.location.href = "/ruleta.html";
    }
    catch(error){
        resultadoSpan.textContent = 'Error: No se pudo conectar con el servidor';
    }
}