const userModel = require('../models/userModel')
const validation = require('../validations/validation')
const aws = require('./aws-work')
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require('jsonwebtoken')
const {isBodyEmpty,isValidS3Url,validateEmail, isValid, isValidMobileNo, isVerifyString,isValidJSONstr,acceptFileType,isEmpty}=require('../validations/validation')

const {isValidRequest, isValidAddress, isValidFile, isValidObjectId, isValidPhone, isValidPassword, isValidString, isValidEmail, isValidPincode, removeSpaces} = require('../validations/userValidation')


// const encryption = require('./encryption')

// user register API 
let register = async function (req, res) {

    try {
        let data = req.body;
        // console.log(req.body)
       
        // let data = JSON.parse(JSON.)

      
        if (isBodyEmpty(data)) return res.send({ status: false, message: "Please provide required data" });
        const { fname, lname, email, phone, password, address } = data
        // console.log(address)

        if (!isValid(fname)) return res.status(400).send({ status: false, message: "fname tag is required" })
        if (isVerifyString(fname)) return res.status(400).send({ status: false, message: "Please provide valid fname" })

        if (!isValid(lname)) return res.status(400).send({ status: false, message: "lname tag is required" })
        if (isVerifyString(lname)) return res.status(400).send({ status: false, message: "Please provide valid lname" })

        if (!isValid(email)) return res.status(400).send({ status: false, message: "email tag is required" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "Please provide valid email" })

        if (!isValid(phone)) return res.status(400).send({ status: false, message: "phone tag is required" })
        if (!isValidMobileNo(phone)) return res.status(400).send({ status: false, message: "Please provide valid Mobile Number" })

        if (!isValid(password)) return res.status(400).send({ status: false, message: "password field is required" })


        if(!isValidPassword(password)) return res.status(400).send({status:false, message: "please enter valid password length should be between 8-15, one uppercase, one lowercase, one digit, one special character"})

        

        let parseAddress=null;

        if(!address || address == ''){
            res.status(400).send({status:false, message:"Address is required"})
        }
        try{
         parseAddress = JSON.parse(address)
        }catch(err){
           return res.status(400).send({status:false, message:"address is not in JSON or may be Pincode Invalid"})
        }
        

        console.log(parseAddress.shipping)
        if(parseAddress){
            if(parseAddress.shipping != undefined){
                if(!isValid(parseAddress.shipping.street)) return  res.status(400).send({status:false,message:"street tag is required"})
                if(!isValid(parseAddress.shipping.city)) return  res.status(400).send({status:false,message:"city tag is required"})
                if(isVerifyString(parseAddress.shipping.city)) return res.status(400).send({status:false,message:"Please provide a valid city name"})
               
                if(!isValid(parseAddress.shipping.pincode)) return res.status(400).send({status:false,message:"pincode tag is required"})
                
                if(!isValidPincode(parseAddress.shipping.pincode)) return res.status(400).send({status:false,message:"Please provide a valid pincode"})
                    
            }
            else{
                if(!isValid(parseAddress.shipping)) return  res.status(400).send({status:false,message:"Please provide shipping address"})  
            }
            if(parseAddress.billing != undefined){
                if(!isValid(parseAddress.billing.street)) return  res.status(400).send({status:false,message:"street tag is required"})

                if(!isValid(parseAddress.billing.street)) return  res.status(400).send({status:false,message:"street tag is required"})
                if(!isValid(parseAddress.billing.city)) return  res.status(400).send({status:false,message:"city tag is required"})
                if(isVerifyString(parseAddress.billing.city)) return res.status(400).send({status:false,message:"Please provide a valid city name"})
                if(!isValid(parseAddress.billing.pincode)) return res.status(400).send({status:false,message:"pincode tag is required"})
                if(!isValidPincode(parseAddress.billing.pincode)) return res.status(400).send({status:false,message:"Please provide a valid pincode"})

            }
            else{
                if(!isValid(parseAddress.billing)) return  res.status(400).send({status:false,message:"Please provide billing address"})


            }
        }
   

        const isEmailExist = await userModel.findOne({ email: email })
        if (isEmailExist) return res.status(409).send({ status: false, message: "email is already exist" })
        const isPhoneExist = await userModel.findOne({ phone: phone })
        if (isPhoneExist) return res.status(409).send({ status: false, message: "phone is already exist" })

        // files aws 
        let files = req.files;
        if(files.length==0){
           return  res.status(400).send({status:false, message:"profileImage is Required"})
        }
        // if (!validation.acceptFileType(files[0], 'image/jpeg', 'image/png')) return res.status(400).send({ status: false, Message: "we accept jpg, jpeg or png as profile picture only" });
        let profilePicture = await aws.uploadFile(files[0])

        // bcrpt logic implementation
        const encryptedPassword = await bcrypt.hash(password, saltRounds)
        console.log(encryptedPassword)
        const userrequestBody = { fname, lname, email, phone, profileImage: profilePicture, password: encryptedPassword , address:parseAddress}

          const newUser = await userModel.create(userrequestBody);

        res.status(201).send({
            status: true,
            message: "User created successfully",
            data: newUser
        });



    } catch (error) {
        
        res.status(500).send({ status: false, message: error.message })
        
    }
}


// =========================================================== Login API =======================================================================






const loginUser = async function (req, res) {
    try {
        let { email, password } = data = req.body;;

        if (isBodyEmpty(data)) { return res.status(400).send({ status: false, message: "required details (email and password) are missing" }) }

        if (!isValid(email)) { return res.status(400).send({ status: false, message: "enter the email" }) }

        if (!isValid(password)) { return res.status(400).send({ status: false, message: "enter the password" }) }

        if (!validateEmail(email)) { return res.status(400).send({ status: false, message: "enter valid email" }) }

        let User = await userModel.findOne({ email: email })
        
        if (!User)
         return res.status(400).send({ status: false, message: "Invalid credentials" }) 

        
        let decrypt = await bcrypt.compare(password, User.password) 
       
            if (!decrypt) {
                return res.status(401).send({ status: false, msg: "Invalid credentials" })}

                let key = jwt.sign(
                    {
                        id: User._id.toString(),
                    },
                    "s-cart49", { expiresIn: "10h" })

                res.setHeader("Authorization", key)
            

            let savedData = { userId: User._id, token: key }
            res.status(200).send({ status: true, message: "User login successfull", data: savedData })  
        

    } catch (error) {
        res.status(500).send({ msg: error.message })
    }
};


// ==================================================== GET API =========================================================================


const getUserProf = async function (req, res) {
    try {

        const userId = req.params.userId
        if (!isValidObjectId(userId)) 
            return res.status(400).send({ status: false, message: "User Id is not valid" });

            const profDetails = await userModel.findById({ _id : userId })
            if (!profDetails)
               { return res.status(404).send({ status: false, message: "User Id does not exist" }) }
            // console.log(req["decodedToken"])
            // if (req.headers["userId"] !== userId)
            if (req["decodedToken"] !== userId)
            return res.status(403).send({ status: false, msg: "User Id is not correct" })
    
       return res.status(200).send({status: true, message: "User profile details", data : profDetails })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }
}



// ====================================================== Update API ===========================================================

const updateUser = async function (req, res) {
    
    let { fname, lname, email, phone, password, address } = data = req.body
    let obj = {}
    let userId = req.params.userId
 
    let files = req.files

    if (!isValidRequest(req.body) && files == undefined) {
        return res.status(400).send({ status: false, message: "please enter valid request" })
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message: "please enter valid user Id" })
    }

    let checkUser = await userModel.findOne({ _id: userId })
    if (!checkUser) {
        return res.sstatus(400).send({status: false, message: "user does not exists" })
    }

    if (fname) {
        if (!isValidString(fname)) {
            return res.status(400).send({ status: false, message: "please enter valid string input" })
        } else {
            obj.fname = removeSpaces(fname)
        }
    }

    if (lname) {
        if (!isValidString(lname)) {
            return res.status(400).send({ status: false, message: "please enter valid lname input" })
        } else {
            obj.lname = removeSpaces(lname)
        }
    }

    if (email) {
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "please enter valid email input" })
        }

        let checkUniqueEmail = await userModel.findOne({ email: email })
        if (checkUniqueEmail) {
            return res.status(409).send({ status: false, message: `${email} already exists, please enter unique email` })
        } else {
            obj.email = email
        }
    }

    // profile image ka krna hai validation - done



    if (files && files.length > 0) {
        if (!isValidFile(files)) {
            return res.status(400).send({status: false, message: "please send a valid photo file"})
        } else {
        let updateProfileImage = await aws.uploadFile(files[0])
        obj.profileImage = updateProfileImage
    }
    }

    if (phone) {
        if (!isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "please enter valid phone number input" })
        }

        let checkUniquePhone = await userModel.findOne({ phone: phone })
        if (checkUniquePhone) {
            return res.status(409).send({ status: false, message: `${phone} already exists, please enter unique phone number` })
        } else {
            obj.phone = phone
        }
    }

    if (password) {
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "please enter valid password, one uppercase, one lowercase, one digit, one special character" })
        } else {
            obj.password = await bcrypt.hash(password, 10)
        }
    }

    // check password with bcrypt 

    let address1 = null;
    if (address) {
        console.log(address)
        try{
            address1 = JSON.parse(address)
           }catch(err){
               res.status(400).send({status:false, message:"address is not in JSON or may be Pincode Invalid"})
         }
       
         address1 = JSON.parse(address)
        // let address1 = address
        console.log(address1)
     

        let findAddress = await userModel.findOne({ _id: userId })

        if (address1.shipping) {
            let { street, city, pincode } = address1.shipping

            if (street) {
                if (!isValidAddress(street)) {
                    return res.status(400).send({ status: false, message: "please enter valid shipping street input" })
                } else {
                    findAddress.address.shipping.street = removeSpaces(street)
                }
            }

            if (city) {
                if (!isValidAddress(city)) {
                    return res.status(400).send({ status: false, message: "please enter valid shipping city input" })
                } else {
                    findAddress.address.shipping.city = removeSpaces(city)
                }
            }

            if (pincode) {
              
                if (!isValidPincode(pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid shipping pincode input" })
                } else {
                    findAddress.address.shipping.pincode = pincode
                }
            }
        }


        if (address1.billing) {
            let { street, city, pincode } = address1.billing
            if (street) {
                if (!isValidAddress(street)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing street input" })
                } else {
                    findAddress.address.billing.street = removeSpaces(street)
                }
            }

            if (city) {
                if (!isValidAddress(city)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing city input" })
                } else {
                    findAddress.address.billing.city = removeSpaces(city)
                }
            }

            if (pincode) {
              
                if (!isValidPincode(pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing pincode input" })
                } else {
                    findAddress.address.billing.pincode = pincode
                }
            }
        }

        obj.address = findAddress.address
    }

    let updatedUser = await userModel.findOneAndUpdate({ _id: userId }, obj, { new: true })
    return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser })
}








module.exports = { getUserProf,register,loginUser,updateUser}