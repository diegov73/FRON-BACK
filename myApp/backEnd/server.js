const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.post('/logIn',(req, res) =>{
    console.log('peticion recibida en /logIn');
    console.log('body:', req.body);

    try{
        if(!req.body){
            throw new error('body vacio');
        }
        const{username, passWord1, password2} = req.body;
    }
    catch(error){
        console.error('error en el sevidor:', error.message);
        res.status(500).json({error: 'hubo un error interno en el servidor, logIn'})
    }
})

app.listen(port, () =>{
    console.log(`backEend corriendo en http//locahost:${port}`);
})