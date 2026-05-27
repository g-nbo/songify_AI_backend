const { Schema, model } = require('../config/db-connection');

const userSchema = Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  favorites: {
    type: Array,
    default: [],
  }
});

userSchema.index({ email: 1 });

module.exports = model('User', userSchema);
