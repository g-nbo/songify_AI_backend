const { Schema, model } = require('../config/db-connection');

const messageSchema = Schema({
  owner: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

module.exports = model('Message', messageSchema);