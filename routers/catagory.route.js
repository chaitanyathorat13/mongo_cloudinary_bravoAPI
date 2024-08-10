const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/catagory.controller');

router.post('/', categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.get('/', categoryController.getAllCategories);

module.exports = router;
