const { Router } = require('express');
const messagesCtrl = require('../controllers/messages.js');

const router = Router();

router.get('/', messagesCtrl.getMessages);
router.post('/', messagesCtrl.createMessage);
router.post('/ai', messagesCtrl.sendToAI);
router.post('/spotify/song', messagesCtrl.getSong);
router.post('/spotify/auth', messagesCtrl.getAuth);


module.exports = router;