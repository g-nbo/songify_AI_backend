const Message = require('../models/Message');

module.exports = {
    getMessages,
    createMessage
};

async function getMessages(req, res) {
    try {
        const messages = await Message.find({});

        res.status(200).json(messages);
    } catch (err) {
        res.status(400).json(err);
    }
}

async function createMessage(req, res) {
    try {
        const message = await Message.create(req.body);

        res.status(200).json(message);
    } catch (err) {
        res.status(400).json(err);
    }
}