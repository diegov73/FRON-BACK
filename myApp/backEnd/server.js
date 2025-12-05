const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const app = express();
const port = 4000;
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'TUTUTUDU_MAX_VERSTAPPEN';

app.use(cors());
app.use(express.json());

const adressDB = 'mongodb+srv://BTF6:tututuduMaxVerstappen@zzzerver.d9ofxax.mongodb.net/?retryWrites=true&w=majority&appName=zzzerver';
mongoose.connect(adressDB)
.then(() => {
    console.log('✅ Conectado exitosamente a MongoDB Atlas'); 
})
.catch((error) => {
    console.error('❌ Error de conexión a la Base de Datos:', error);
});

app.post('/signUp',async(req, res) =>{
    console.log('peticion recibida en /logIn');
    console.log('body:', req.body);

    try{
        if(!req.body){
            throw new error('body vacio');
        }
        const{username, passWord1, password2} = req.body;

        const newUser = new Usuario({
            username: username,
            password: passWord1
        });

        await newUser.save();

        const token = jwt.sign(
                {id: newUser._id, username:newUser.username},
                SECRET_KEY,
                {expiresIn: '1H'}
            );

        res.json({
            mensaje: 'Usuario registrado',
            token: token,
            usuario: newUser.username
        });
    }
    catch(error){
        console.error('error en el sevidor:', error.message);
        res.status(500).json({error: 'hubo un error interno en el servidor, logIn'})
    }
})

app.listen(port, () =>{
    console.log(`backEend corriendo en http//locahost:${port}`);
})