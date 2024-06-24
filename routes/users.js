const { Router } = require('express');
const usersCtrl = require('../controllers/users.js');
const router = Router();



  
router.post('/register', usersCtrl.createUser);

router.post('/login', usersCtrl.loginUser)

router.patch('/update', usersCtrl.updateName)


module.exports = router;
