const {  isValid, IsNumuric } = require('../validations/validation')
const {  isValidObjectId,  } = require('../validations/userValidation')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')

// ===============================================================================================================================================
//                                                            ⬇️  CREATE CART API ⬇️
//================================================================================================================================================


const createCart = async function (req, res) {
  try {
    let { cartId, productId } = req.body
    let userId = req.params.userId

    let prodObj = {
      productId: productId,
      quantity: 1
    }

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter valid user id" })
    let checkUser = await userModel.findOne({ _id: userId })
    if (!checkUser) return res.status(404).send({ status: false, message: "user not found" })

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please enter valid product id" })
    let checkProduct = await productModel.findOne({ isDeleted: false, _id: productId })
    if (!checkProduct) return res.status(404).send({ status: false, message: "product not found" })
    let productPrice = checkProduct.price

    if (cartId) {
      if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "please enter valid cartId id" })
      let cartCall = await cartModel.findOne({_id : cartId})
      if (!cartCall) return res.status(404).send({status: false, message : "cart not found"})
    }
    let checkCart = await cartModel.findOne({ userId: userId })
    console.log(checkCart);

    if (checkCart) {

      let checkProductId = checkCart.items.map(x => x.productId.toString())

      if (checkProductId.includes(productId)) {
        let array = checkCart.items
        for (let i = 0; i < array.length; i++) {
          if (checkCart.items[i].productId == productId) {
            array[i].quantity = array[i].quantity + 1
          }
        }
        let increaseQuantity = await cartModel.findOneAndUpdate({ userId: userId }, { items: array, totalPrice: checkCart.totalPrice + productPrice }, { new: true })
        return res.status(200).send({ status: true, message: "items added successfully", data: increaseQuantity })

      } else {
        let addProduct = await cartModel.findOneAndUpdate({ userId: userId }, { $push: { items: prodObj }, $inc: { totalItems: 1, totalPrice: productPrice } }, { new: true })
        return res.status(200).send({ status: true, message: "items added successfully", data: addProduct })
      }

    }

    // create cart
    let createCartObject = {
      userId: userId,
      items: [prodObj],
      totalItems: 1,
      totalPrice: productPrice
    }

    let savedData = await cartModel.create(createCartObject)

    return res.status(201).send({ status: true,message: "Success", data: savedData })
  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}





// ===============================================================================================================================================
//                                                            ⬇️  UPDATE  CART API ⬇️
//================================================================================================================================================

let updateCart = async function (req, res) {
  try {

    // userId
    let userId = req.params.userId;
    console.log(userId)
    if (!isValid(userId)) return res.status(400).send({ status: false, message: " UserId is Mandatory" })
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Provide a valid Object Id " })

    // check userId exist or not in db....
    const isUserIdExist = await userModel.findOne({ _id: userId });

    // If userId is not Exists
    if (!isUserIdExist) return res.status(400).send({ status: false, message: `${userId} userId is not Exists` });

    let data = req.body;
    console.log(typeof data)

    let { cartId, productId, removeProduct } = data;

    if (!isValid(productId)) return res.status(400).send({ status: false, message: "productId tag is required" })
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product Id" })

    // check prodcut id Exists or not in db
    const isProductIdExist = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!isProductIdExist) return res.status(400).send({ status: false, message: `${productId} productId is not exists` })


    if (!isValid(cartId)) return res.status(400).send({ status: false, message: "cartId tag is required" })
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Invalid cartId" })

    // check cartId exists or not in db
    const isCartIdExist = await cartModel.findOne({ _id: cartId });

    if (!isCartIdExist) return res.status(400).send({ status: false, message: `${cartId} cartId is not exists` })

    // cart exists with this user or not 
    const cart = await cartModel.findOne({ userId: userId })

    if (cart._id != cartId) return res.status(400).send({ status: false, message: "This user cartId and cartID both are diff..." })

    if (!isValid(removeProduct)) return res.status(400).send({ status: false, message: "please provide removeProduct key " });
    if (!IsNumuric(removeProduct)) return res.status(400).send({ status: false, message: "Please Provide a Number " })
    console.log(typeof removeProduct)

    let no = [1, 0];
    if (!no.includes(removeProduct)) return res.status(400).send({ status: false, message: "Please provide a valid value for remove product  " });


    let totalItems = isCartIdExist.totalItems;
    console.log(totalItems)
    let totalPrice = isCartIdExist.totalPrice
    console.log(totalPrice)

    let allItems = isCartIdExist.items;

    // here getting specific product ......
    let specificProductInItems = allItems.find(i => i.productId.toString() == productId);
  
    if (!specificProductInItems) return res.status(404).send({ status: false, message: "product doesn't exists" });
    let index = allItems.indexOf(specificProductInItems);
  



    if (removeProduct == 0) {

      let total = isCartIdExist.totalPrice - (isProductIdExist.price * isCartIdExist.items[index].quantity)
      isCartIdExist.totalPrice = Math.round(total * 100) / 100
      isCartIdExist.items.splice(index, 1)
      isCartIdExist.totalItems = totalItems - 1;

    }



    if (removeProduct == 1) {


      if (allItems[index].quantity == 1) {
        let total = isCartIdExist.totalPrice - (isProductIdExist.price * isCartIdExist.items[index].quantity)
        console.log(total)

        isCartIdExist.totalPrice = Math.round(total * 100) / 100
        isCartIdExist.items.splice(index, 1)
        isCartIdExist.totalItems = totalItems - 1;
      }
      else {
        let total = isCartIdExist.totalPrice - (isProductIdExist.price)
        console.log(isProductIdExist.price)
        isCartIdExist.items[index].quantity = allItems[index].quantity - 1;
        isCartIdExist.totalPrice = Math.round(total * 100) / 100
        isCartIdExist.totalItems = isCartIdExist.items.length
      }
    }
    await isCartIdExist.save()
    res.status(200).send({ status: true,message: "Success", data: isCartIdExist })

  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }

}

// ===============================================================================================================================================
//                                                            ⬇️  GET  CART API ⬇️
//================================================================================================================================================


const getCartByUserId = async function (req, res) {
  try {
    const userId = req.params.userId
    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Invalid user id" })
    const userDetails = await userModel.findById({ _id: userId })
    if (!userDetails)
      return res.status(404).send({ status: false, message: "user doesnot exist" })
    const cartDetails = await cartModel.findOne({ userId })
    if (!cartDetails)
      return res.status(404).send({ status: false, message: "cart doesnot exist for the given user id" })

    return res.status(200).send({ status: true, message: "Success", data: cartDetails })

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message })

  }

}


// ===============================================================================================================================================
//                                                            ⬇️  DELETE  CART API ⬇️
//================================================================================================================================================




const deleteCartbyId = async function (req, res) {
  try {
    const user = req.params.userId

    if (!isValidObjectId(user)) { return res.status(400).send({ status: false, message: "please enter valid user Id" }) }

    const findUser = await userModel.findById(user)
    if (!findUser) {
      return res.status(404).send({ status: false, message: "user doesn't exist" })
    }
    const findCart = await cartModel.findOne({ userId: user })
    if (findCart.totalPrice === 0 || findCart.totalItems === 0)
      return res.status(404).send({ staus: false, message: "cart already deleted" })

    if (!findCart) {
      return res.status(404).send({ staus: false, message: "cart doesn't exist" })
    }
    await cartModel.findOneAndUpdate({ userId: user }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
    return res.status(204).send({ status: true, message: "deleted successfully" });
  }
  catch (error) {
    return res.status(500).send({ status: false, error: error.name, msg: error.message })
  }
}




module.exports = { updateCart, createCart, deleteCartbyId, getCartByUserId }