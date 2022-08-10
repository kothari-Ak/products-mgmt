const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { isValidObjectId } = require("../validations/userValidation")

const authentication = async function (req, res, next) {
  try{

      let token = req.headers.authorization;
      console.log(req.headers)
      if (!token) {return res.status(401).send({status:false, message:"token is missing"})}

      let splitToken = token.split(" ")
      token = splitToken[1]
    
    jwt.verify(token,"s-cart49",(error,token)=>{
     
      if(error) return  res.status(401).send({status:false, message:error.message});
      req["decodedToken"] = token.id;
      next();
   });

  } catch (err) {
    res.status(500).send({status:false, message:err.message})
    }
}


const authorization = async function (req,res,next) {
  let userId = req.params.userId
  let validId = req.decodedToken

  if (!isValidObjectId(userId)) { return res.status(400).send({status:false, message:"please enter valid user Id"})}

  let checkUser = await userModel.findById(userId)
  if(!checkUser) { return res.status(404).send({status:false, message:"user not found"})}

  if (userId != validId) {return res.status(403).send({status: false, message: "you are not authorized to do this"})}

  next()
}


module.exports = { authentication, authorization };