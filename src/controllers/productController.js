const { isValidObjectId } = require('mongoose');
const { findOneAndUpdate } = require('../models/productModel');
const productModel = require('../models/productModel');
const { isValidAddress, isValidSize } = require('../validations/userValidation');
const {isBodyEmpty,IsNumuric,removeSpaces,isValidS3Url,validateEmail,checkAllSizes, checkAllSizesForUpdate,isValid, isValidMobileNo, isVerifyString,isValidJSONstr,acceptFileType,isEmpty}=require('../validations/validation');
const { uploadFile } = require('./aws-work');


// ================================================================================================================================================
//                                                       ⬇️ Create Product API ⬇️
// ================================================================================================================================================

let createProduct = async function(req,res){

    try{
    // let data = JSON.parse(JSON.stringify(req.body));
    let data = req.body

    // check body is empty or not
    if(isBodyEmpty(data)) return res.status(400).send({status:false, message:"Please provide required Data"}) 

    let {title, description , price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments  }=data;

    // check All Mandatory tag present or not , and it's contain proper value or not

    if(!isValid(title)) return res.status(400).send({status:false, message:"Title tag is Required"})
    title = removeSpaces(title) 

    if(!isValid(description )) return res.status(400).send({status:false, message:"Description tag is Required"}) 
    description=removeSpaces(description) 

    if(!isValid(price)) return res.status(400).send({status:false, message:"Price tag is Required"}) 
    if(!IsNumuric(price)) return res.status(400).send({status:false, message:"price must be a number"}) 

    if(currencyId || currencyId == ''){
        if(!isValid(currencyId)) return res.status(400).send({status:false, message:"CurrencyId tag is Required"}) 
        if(currencyId.toUpperCase()!="INR") return res.status(400).send({status:false, message:"Please provide currencyId only 'INR'"}) 
    }
   
   if(currencyFormat || currencyFormat==''){
    if(!isValid(currencyFormat)) return res.status(400).send({status:false, message:"CurrencyFormat tag is Required"}) 
    if(currencyFormat !="₹") return res.status(400).send({status:false, message:"Only Indian Currency ₹ accepted"}) 
   }
   

    if(isFreeShipping || isFreeShipping==''){
        let boolArr = ["true", "false"]
        // if(typeof isFreeShipping != 'Boolean') 
        if(!boolArr.includes(isFreeShipping)) return res.status(400).send({status:false, message:"isFreeShipping type must be boolean"}) 
    }

    if(style || style==''){
        if(!isValid(style)) return res.status(400).send({status:false, message:"If you are provide stype key then you have to provide some data"}) 
        style = removeSpaces(style)
    }


    if(!availableSizes) return res.status(400).send({ status: false, msg: "availableSizes should be present" })


    let allSizes = availableSizes.split(",");
    let bool = await checkAllSizes(allSizes);
    if(bool){
    availableSizes = [...allSizes]
    }



   if(!bool) return res.status(400).send({ status:false, Message: 'available size should be in uppercase and accepted sizes are: ["S", "XS", "M", "X", "L", "XXL", "XL"] !' })

   if(installments){
    if(!isValid(installments)) return res.status(400).send({status:false, message:"installments tag is required"}) 
    if(!IsNumuric(installments)) return res.status(400).send({status:false, message:"installments must be number"})
   }
   




   // files concept here

   let files = req.files;
   if(files.length==0) return res.status(400).send({ status: !true, message: "productImage is required" })
   if(!acceptFileType(files[0],'image/jpeg', 'image/png'))  return res.status(400).send({ status: false, message: "we accept jpg, jpeg or png as product image only" })
   let myUrl = await uploadFile(files[0]);
//    console.log(myUrl);
   productImage=myUrl;


   // db call for title
   let isTitleExist = await productModel.findOne({title:title});
   if(isTitleExist) return res.status(409).send({status:false, message:`"${title}" title already available, Please provide unique title`});
   

   // prepare object with all requirement
   let realData = {title,description , price, currencyId, currencyFormat, isFreeShipping, style, availableSizes:[...allSizes], installments,productImage}
   
   // perform db call for creating Document
   let my= await productModel.create(realData);
   res.status(201).send({status:true, data:my})


    }catch(err){
        res.status(500).send({status:false,message:err.message})
    }
}



// ===============================================================================================================================================
//                                                            ⬇️  GET API ⬇️
//================================================================================================================================================


const getProduct = async function (req, res) {
    let { name, size, priceGreaterThan, priceLessThan, priceSort } = req.query
    let filters = { isDeleted: false }

    if (name) {
        let findTitle = await productModel.find()
        let fTitle = findTitle.map(x => x.title).filter(x => x.includes(name))

        filters.title = {$in : fTitle} // title me agar is array elements me se kuch bhi milra ho na to le aao 
    }

    if (size) {
        let size1 = size.split(",").map(x => x.trim().toUpperCase())
        //-----------------------------------explain
        if (size1.map(x => isValidSize(x)).filter(x => x === false).length !== 0) return res.status(400).send({ status: false, message: "Size Should be among  S,XS,M,X,L,XXL,XL" })
        filters.availableSizes = { $in: size1 }
    }

    if (priceGreaterThan) {
        filters.price = { $gt: priceGreaterThan }
    }

    if (priceLessThan) {
        filters.price = { $lt: priceLessThan }
    }

    if (priceGreaterThan && priceLessThan) {
        filters.price = { $gt: priceGreaterThan, $lt: priceLessThan }
    }
    if (priceSort) {
        let arr = ["1","-1"]
        if (!arr.includes(priceSort)) {return res.status(400).send({status: false, message : "priceSort value can only be 1 or -1"})}
    }


    let getData = await productModel.find(filters).sort({ price: priceSort })

    if (getData.length == 0) { return res.status(404).send({ status: false, message: "product not found or may be deleted" }) }

    return res.status(200).send({ status: true, count: getData.length, message: "products details", data: getData })
}




// ===============================================================================================================================================
//                                                            ⬇️  GET BY ID API ⬇️
//================================================================================================================================================



const getProductById = async function (req, res) {
    try {

        const productId = req.params.productId
        if (!isValidObjectId(productId)) 
            return res.status(400).send({ status: false, message: "Product Id is not valid" });

            const prodDetails = await productModel.findOne({ _id : productId , isDeleted:false})
            if (!prodDetails)return res.status(404).send({ status: false, message: "Product Id does not exist" })
            
            res.status(200).send({status: true, message: "Success", data : prodDetails })
         }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }
}


// ===============================================================================================================================================
//                                                            ⬇️  UPDATE API ⬇️
//================================================================================================================================================

let updateProduct = async function(req,res){

    try{

        let productId = req.params.productId;
        if(!isValid(productId)) return res.status(400).send({status:false, message:"Please provide a productId"});
        if(!isValidObjectId(productId)) return res.status(400).send({status:false, message:"Invalid ProductId"});

        // db call , to check this id is present in db or not
        let isProductIdExist = await productModel.findOne({_id:productId, isDeleted:false});
        if(!isProductIdExist) return res.status(404).send({status:false, message:`${productId} doesn't exists`});

        let data = JSON.parse(JSON.stringify(req.body));
        let files = req.files;

        // if(isBodyEmpty(data)) return res.status(400).send({status:false, message:"please provide some data for filteration"});

        if (isBodyEmpty(req.body) && files == undefined) {
            return res.status(400).send({ status: false, message: "please provide some data for filteration" })
        }
        let {title,description , price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted}= data;
    
        let filter ={}
      
        if(title || title ==''){
            if(!isValid(title)) return res.status(400).send({status:false, message:"please provide valid title"});
            let isTitleExist = await productModel.findOne({title:title});
            if(isTitleExist) return res.status(409).send({status:false, message:`Please provide uniqe title ( ${title} ) name `})
            filter.title = removeSpaces(title)
        }

        if(description || description == ''){
            if(!isValid(description)) return res.status(400).send({status:false, message:"please provide valid title"});
            description = removeSpaces(description) 
            if(description == isProductIdExist.description) return res.status(400).send({status:false, message:" you provide same description as previous"})
            filter.description=description;
        }

        if(price || price ==''){
            if(!isValid(price)) return res.status(400).send({status:false, message:"Please provide price"});
            if(!IsNumuric(price)) return res.status(400).send({status:false, message:"price must be a number"});
            filter.price = removeSpaces(price) 
        }
        if(currencyId || currencyId==''){
            if(!isValid(currencyId)) return res.status(400).send({status:false, message:"CurrencyId tag is Required"}); 
            if(currencyId.toUpperCase()!="INR") return res.status(400).send({status:false, message:"Please provide currencyId only 'INR'"}); 
            if(currencyId==isProductIdExist.currencyId) return res.status(400).send({status:false, message:"already Available"})
            filter.currencyId=currencyId
        }
        if(currencyFormat || currencyFormat ==''){
            if(!isValid(currencyFormat)) return res.status(400).send({status:false, message:"CurrencyFormat tag is Required"});
            if(currencyFormat !="₹") return res.status(400).send({status:false, message:"Only Indian Currency ₹ accepted"});
            if(filter.currencyFormat==isProductIdExist.currencyFormat) return res.status(400).send({status:false, message:"already Available"})
            filter.currencyFormat=currencyFormat;
           
        }
        
        if(style || style == ''){
            if(!isValid(style)) return res.status(400).send({status:false, message:"Please provide valid data"});
            style=removeSpaces(style);
            if(style==isProductIdExist.style) return res.status(400).send({status:false, message:"already Available"}) 
            filter.style=style;
        }


        if(installments || installments == ''){
            if(!isValid(installments)) return res.status(400).send({status:false, message:"installments tag is required"}) 
            if(!IsNumuric(installments)) return res.status(400).send({status:false, message:"installments must be number"})
            if(installments==isProductIdExist.installments)return res.status(400).send({status:false, message:"already Available"})
            filter.installments = installments  
        }
        // yaha pr logic likhna hai .....
        if(availableSizes || availableSizes==''){

            let allSizes = availableSizes.split(",");
            let bool = await checkAllSizesForUpdate(allSizes,isProductIdExist.availableSizes);
            if(bool){
            availableSizes = [...isProductIdExist.availableSizes,...allSizes]
            filter.availableSizes= availableSizes
            }

         if(!bool) return res.status(400).send({ status:false, Message: 'Duplicates Values not Allowed or availableSizes allowed like [S,XS, M,X, L, XXL,XL] !' })

        }

        if(isFreeShipping || isFreeShipping==''){
            let boolArr = ["true", "false"]
            if(!boolArr.includes(isFreeShipping)) return res.status(400).send({status:false, message:"isFreeShipping type must be boolean"}) 
            if(isFreeShipping==isProductIdExist.isFreeShipping)return res.status(400).send({status:false, message:"already Available"})
            filter.isFreeShipping = isFreeShipping 
        }

        if(isDeleted=='') return res.status(400).send({status:false, message:"If 'isDeleted' key present then you have to send the value"})
        
        if (isDeleted) {
            let bool = ["true","false"]
            isDeleted = isDeleted.trim();
            if(!bool.includes(isDeleted)) return res.status(400).send({status:false, message:"isDeleted contains only true or false"})
            if (isDeleted == "true") {
                filter.deletedAt = Date.now(),
                filter.isDeleted = true
            }
        }
       
        if(files && files.length>0){
            if(!acceptFileType(files[0],'image/jpeg', 'image/png'))  return res.status(400).send({ status: false, message: "we accept jpg, jpeg or png as product image only" })
            
            // console.log(await uploadFile(files[0]))
            let myUrl = await uploadFile(files[0]);
            productImage=myUrl;
            if(productImage == isProductIdExist.productImage) return res.status(400).send({status:false, message:"This url is Already available"});
            filter.productImage = productImage
         
        }

        let updatedObject = await productModel.findOneAndUpdate({_id:productId},filter,{new:true})
        return res.status(200).send({status:true, message:'Success', data:updatedObject})
        
    }catch(error){
        res.status(500).send({status:false, message:error.message})
    }

}



// ===============================================================================================================================================
//                                                            ⬇️  DELETE API ⬇️
//================================================================================================================================================


const deleteProductById = async function (req, res) {
    try {
        
        const id = req.params.productId;
        if(!isValidObjectId(id)){
            return res.status(400).send({satus:false, message:"Please provide a valid id"
            })
        }

        const product = await productModel.findOne({_id:id, isDeleted:false});
         if (!product) return res.status(404).send({ status: false, message: "no such product exists" })  
 
         
        await productModel.findByIdAndUpdate(id, { $set: { isDeleted: true, deletedAt: Date.now()}});
        return res.status(200).send({ status: true, message: "deleted successfully"});

    } catch (error) {
        return res.status(500).send({ status: false, error: error.name, msg: error.message })
    }   }



module.exports={createProduct,updateProduct,deleteProductById,getProduct,getProductById}