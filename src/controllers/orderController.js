const { isBodyEmpty, isValid, } = require('../validations/validation')
const {  isValidStatus,  isValidObjectId,  } = require('../validations/userValidation')
const userModel = require('../models/userModel');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');

let createOrder = async function (req, res) {
    try {

        let userId = req.params.userId;

        if (!isValid(userId)) return res.status(400).send({ status: false, message: "userId is not Present...." });
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not valid Object Id...." });

        let isOrderExist = await orderModel.findOne({ userId: userId });
        console.log(isOrderExist)
        if (isOrderExist) return res.status(400).send({ status: false, message: "Order already exists with this userId ", data: isOrderExist })

        let data = req.body;
        if (isBodyEmpty(data)) return res.status(400).send({ status: false, message: "body doesn't contains Mandatory data...." });
        let { cartId, cancellable } = data;

        if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Cart Id is  Mandatory field...." });
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "cartId is not valid Object Id...." });

        if (cancellable || cancellable == '') {
            let bool = [true, false]
            if (!isValid(cancellable)) return res.status(400).send({ status: false, message: "If cancellable key is select then you have to send data ...." });
            if (!bool.includes(cancellable)) return res.status(400).send({ status: false, message: "It's contains only Boolean value [true, false] ...." });
            cancellable = cancellable;
        }

        let cart = await cartModel.findOne({ userId: userId });
        if (!cart) return res.status(400).send({ status: false, message: "Cart doesn't exists on this userId" });

        if (cart._id != cartId) return res.status(400).send({ status: false, message: "Invalid CartId" });

        let allItems = cart.items;


        let totalQuantity = allItems.reduce(function (acc, curr) {
            acc = acc + curr.quantity;
            return acc
        }, 0);
        console.log(totalQuantity)
        let { totalPrice, totalItems, items } = cart;

        let realObject = { userId, items, totalPrice, totalItems, totalQuantity, cancellable };

        let ans = await orderModel.create(realObject);

        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })

        res.status(201).send({ status: true, data: ans });

    } catch (err) {
        console.log(err);
        res.status(500).send({ status: false, message: err.message });
    }
}



const updateOrder = async function (req, res) {
    let { orderId, status } = req.body
    let userId = req.params.userId


    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid user Id.." })
    if (!await userModel.findById({ _id: userId })) return res.status(404).send({ status: false, message: "user not found" })

    if (!orderId) return res.status(400).send({ status: false, message: "Provide orderId " })
    if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "invalid order Id.." })


    let searchOrder = await orderModel.findById(orderId)

    if (searchOrder.status == 'cancelled') 
    {return res.status(400).send({ status: false, message: "this order has been cancelled, can't update anymore" })}
    
    if (!searchOrder) 
    {return res.status(404).send({ status: false, message: "order not found" })}
    if (searchOrder.userId != userId) return res.status(400).send({ status: false, message: "the order does not belongs to this user" })

    if (!status) return res.status(400).send({ status: false, message: "Provide Order Status" })
    if (!isValidStatus(status)) return res.status(400).send({ status: false, message: "status should be among 'pending','completed' and 'cancled' only" })

    if (status == 'cancelled' && searchOrder.cancellable !== true) return res.status(400).send({ status: false, message: "You can not cancel the order" })

    let updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
    if (updatedOrder.status == "completed") {
        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalItems: 0, totalPrice: 0 } }, { new: true })
    
    return res.status(200).send({ status: true, message: "Order status updated successfully", data: updatedOrder })
    }
    return res.status(200).send({ status: true, message: "Order status updated successfully", data: updatedOrder })
}



module.exports = { createOrder, updateOrder }