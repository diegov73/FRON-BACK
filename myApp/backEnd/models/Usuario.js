const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  historial: [{
      tipo: {
          type: String,
          enum: ['deposito', 'retiro'], 
          required: true
      },
      monto: {
          type: Number,
          required: true
      },
      fecha: {
          type: Date,
          default: Date.now 
      }
  }],
  Resultados: [{
    numeroGanador: Number,
    colorGanador: String,
    tipoApuesta: String, 
    totalApostado: Number,
    variacion: Number, 
    fecha: Date
  }]
}, {
  collection: 'Usuario'
});

module.exports = mongoose.model('Usuario', UsuarioSchema);