const { Router } = require('express');
const usersCtrl = require('../controllers/users.js');
const router = Router();

router.post('/register', usersCtrl.createUser);
router.post('/login', usersCtrl.loginUser);
router.post('/refresh', usersCtrl.refreshToken);
router.post('/logout', usersCtrl.logoutUser);
router.patch('/update', usersCtrl.updateName);

module.exports = router;
