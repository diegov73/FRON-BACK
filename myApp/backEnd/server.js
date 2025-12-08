// archivos para instalar a traves de npm
// "mongoose mongodb jsonwebtoken patch express cors"

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const app = express();
const port = 4000;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET_KEY = 'TUTUTUDU_MAX_VERSTAPPEN';

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const adressDB = 'mongodb+srv://BTF6:tututuduMaxVerstappen@zzzerver.d9ofxax.mongodb.net/?retryWrites=true&w=majority&appName=zzzerver';
mongoose.connect(adressDB)
.then(() => {
    console.log('✅ Conectado exitosamente a MongoDB Atlas'); 
})
.catch((error) => {
    console.error('❌ Error de conexión a la Base de Datos:', error);
});

//---signUp---
app.post('/signUp',async(req, res) =>{
    console.log('peticion recibida en /signUp');
    console.log('body:', req.body);

    try{
        if(!req.body){
            throw new error('body vacio');
        }
        const{username, passWord1, password2} = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passWord1, salt);

        const newUser = new Usuario({
            username: username,
            password: hashedPassword
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

//---logIn---
app.post('/logIn', async(req,res)=>{
    console.log('peticion recibida en /logIn');
    console.log('body: ', req.body);

    try{
        if(!req.body){
            throw new error('body vacio');
        }
        const{username, password} = req.body;

        const User = await Usuario.findOne({username, password});
        
        if(!user){
            return res.status(400).json({
                mensaje: 'Usuario no existente',
                status: false
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({
                mensaje: 'Contraseña incorrecta',
                status: false
            })
        }

        const token = jwt.sign(
            {id: User._id, username: User.username},
            SECRET_KEY,
            {expiresIn: '1H'}
        );

        res.json({
            mensaje: 'bienvenido',
            status: true,
            token: token
        })
    }
    catch(error){
        console.error('error en el sevidor:', error.message);
        res.status(500).json({error: 'hubo un error interno en el servidor, logIn'})
    }
});

app.get('/loadData', async(req,res)=>{
    try{
        const cookies = req.headers.cookie;

        if(!cookies) return res.status(401).json({error: 'sesion no iniciada'});

        const tokenString = cookies.split('; ').find(row => row.startsWith('jwt_token='));

        if(!tokenString) return res.status(401).json({error: 'token no encontrado'});
        
        const token = tokenString.split('=')[1];

        const decoded = jwt.verify(token, SECRET_KEY);

        console.log('id recuperado desde el token', decoded.id);

        const usuarioEncontrado = await Usuario.findById(decoded.id).select('-password');

        if(!usuarioEncontrado) return res.status(404).json({error: ' usuario no encontrado en la DB'});

        res.json({
            mensaje: 'datos cargados',
            usuario:{
                username: usuarioEncontrado.username,
                balance: usuarioEncontrado.balance,
                historial: usuarioEncontrado.historial
            }
        });
    }
    catch(error){
        console.error(error);
        res.status(401).json({error: 'token invalido o expirado'});
    }
})

app.post('/api/actualizarJuego', async (req, res) => {
    try {
        // 1. Autenticar usuario desde el token en la cookie
        const cookies = req.headers.cookie;
        if (!cookies) {
            return res.status(401).json({ error: 'Sesión no iniciada, no se encontraron cookies.' });
        }

        const tokenString = cookies.split('; ').find(row => row.startsWith('jwt_token='));
        if (!tokenString) {
            return res.status(401).json({ error: 'Token no encontrado.' });
        }
        
        const token = tokenString.split('=')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // 2. Obtener datos del cuerpo de la petición
        const { gananciaNeta, detalles } = req.body;
        if (gananciaNeta === undefined || !detalles) {
            return res.status(400).json({ error: 'Datos del juego incompletos.' });
        }

        // 3. Encontrar y actualizar el usuario en la DB
        const usuario = await Usuario.findById(decoded.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado en la DB.' });
        }

        // 4. Actualizar balance y historial
        usuario.balance += gananciaNeta;

        const nuevoResultado = {
            numeroGanador: detalles.numeroGanador,
            colorGanador: detalles.colorGanador,
            tipoApuesta: detalles.tipoApuesta,
            totalApostado: detalles.totalApostado,
            variacion: gananciaNeta,
            fecha: new Date()
        };
        usuario.Resultados.push(nuevoResultado);

        // 5. Guardar y responder
        await usuario.save();

        res.json({
            mensaje: 'Juego guardado exitosamente.',
            nuevoSaldo: usuario.balance
        });

    } catch (error) {
        console.error('Error en /api/actualizarJuego:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido.' });
        }
        res.status(500).json({ error: 'Error interno del servidor al actualizar el juego.' });
    }
});

app.post('/api/wallet/update', async (req, res) => {
    try {
        const cookies = req.headers.cookie;
        if (!cookies) {
            return res.status(401).json({ error: 'Sesión no iniciada.' });
        }

        const tokenString = cookies.split('; ').find(row => row.startsWith('jwt_token='));
        if (!tokenString) {
            return res.status(401).json({ error: 'Token no encontrado.' });
        }

        const token = tokenString.split('=')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        const { amount, action } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Cantidad no válida.' });
        }

        const usuario = await Usuario.findById(userId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (action === 'add') {
            usuario.balance += amount;
        } else if (action === 'subtract') {
            if (usuario.balance < amount) {
                return res.status(400).json({ error: 'Saldo insuficiente.' });
            }
            usuario.balance -= amount;
        } else {
            return res.status(400).json({ error: 'Acción no válida.' });
        }

        await usuario.save();

        res.json({ nuevoSaldo: usuario.balance });

    } catch (error) {
        console.error('Error en /api/wallet/update:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido.' });
        }
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.listen(port, () =>{
    console.log(`backEend corriendo en http//locahost:${port}`);
})