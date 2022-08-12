const express = require('express');
const router = express.Router();
const { getUserProf,register,loginUser,updateUser} = require('../controllers/userController')
const {createProduct,updateProduct,deleteProductById,getProduct,getProductById} = require('../controllers/productController')
const {authentication, authorization} = require('../middleware/auth')
const {updateCart,createCart,deleteCartbyId,getCartByUserId}= require('../controllers/cartController');
const {createOrder ,updateOrder} = require('../controllers/orderController');


// user API's
router.post('/register',register)
router.post('/login',loginUser)
router.get('/user/:userId/profile', authentication, getUserProf)
router.put('/user/:userId/profile',  authentication, authorization, updateUser)


// product API's
router.post('/products', createProduct);
router.get('/products',getProduct)
router.get('/products/:productId',getProductById)
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProductById);

// cart API's
router.post('/users/:userId/cart',authentication,authorization,createCart)
router.put('/users/:userId/cart',authentication,authorization,updateCart)
router.get('/users/:userId/cart',authentication,authorization,getCartByUserId)
router.delete('/users/:userId/cart',authentication,authorization,deleteCartbyId)

// order API's
router.post('/users/:userId/orders',authentication,authorization,createOrder)
router.put('/users/:userId/orders',authentication,authorization,updateOrder)









router.all("/*", function(req, res) {
    res.status(400).send({ msg: "No such Api found" })
})



module.exports=router;