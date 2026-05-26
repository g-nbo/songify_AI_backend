const { Router } = require('express');
const songifyCtrl = require('../controllers/songify.js');
const verifyToken = require('../middleware/auth.js');

const router = Router();

router.use(verifyToken);

router.post('/favorite', songifyCtrl.createFavorite);
router.post('/song', songifyCtrl.getSong);
router.delete('/favorite/delete', songifyCtrl.deleteFavorite);
router.get('/favorite/:id', songifyCtrl.readFavorites);

module.exports = router;
