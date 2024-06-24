const { Router } = require('express');
const songifyCtrl = require('../controllers/songify.js');

const router = Router();

router.post('/favorite', songifyCtrl.createFavorite);
router.post('/song', songifyCtrl.getSong);
router.delete('/favorite/delete', songifyCtrl.deleteFavorite);
router.get('/favorite/:id', songifyCtrl.readFavorites);




module.exports = router;