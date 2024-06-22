const { Router } = require('express');
const messagesCtrl = require('../controllers/messages.js');

const router = Router();

router.get('/', messagesCtrl.getMessages);
router.post('/', messagesCtrl.createMessage);
router.post('/spotify/song', messagesCtrl.getSong);


module.exports = router;