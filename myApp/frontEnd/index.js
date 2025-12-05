const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'public', 'landSite.html'))
});

app.get('/logIn', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'logIn.html'))
})

app.get('/ruleta',(req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'ruleta.html'))
})

app.listen(PORT, () => {
    console.log(`Frontend Servidor corriendo en: http://localhost:${PORT}`);
})