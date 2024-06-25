const { Schema, model } = require('../config/db-connection');

const userSchema = Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: false,
  },
  password: {
    type: String,
    required: true,
    unique: false,
    min: 5,
  },
  favorites: {
    type: Array,
    required: true,
    
  }
});

module.exports = model('User', userSchema);
