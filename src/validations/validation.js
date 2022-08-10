// check body is empty or not 
const isBodyEmpty = function(data)
{
    if(Object.keys(data).length == 0) return true
    return false;
}

// 
const isValid = function(value)
{
    if(typeof value === 'undefined' || value === null ) return false
    if(typeof value === 'string' && value.trim().length === 0) return false 
    return true;
}


// verify fname lname 
const regex = /[`/\d/!@#$%^&*()_+\=\[\]{};':"\\|.<>\/?~]/
const isVerifyString = function (string) {
    return regex.test(string)
};

// Mobile no regex
const regEx=/^[6-9]\d{9}$/
const isValidMobileNo = function(mobno)
{
    return regEx.test(mobno)
}

const isValidPincode = function (pincode) {
    const pattern = /^[1-9]{1}[0-9]{2}\s?[0-9]{3}$/;
    return pattern.test(pincode); // returns a boolean
  };


// aws-link is valid or not
const isValidS3Url = function(url)
{
    if(/^https?:\/\/.*\/.*\.(png|gif|webp|jpeg|jpg)\??.*$/gmi.test(url))
    {
        return true;
    }
    else return false;
}


const acceptFileType = (file, ...types) => {
    console.log(file.mimetype);
    return types.indexOf(file.mimetype) !== -1 ? true : false
}


let isEmpty = function (value) {
    if(!value) return true
    if (typeof value === 'undefined' || value === null) return true;
    if (value.trim().length === 0) return true;
    return false;
}

let isValidJSONstr = (json) => {
    try {
        return JSON.parse(json)
    } catch (_) {
        return false
    }
}



function removeSpaces(x){
    return x.split(" ").filter((y)=> y ).join(" ")
}


let validateEmail = (email) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};


//=================================================================== product validations ===================================

let IsNumuric = function (input) {
	var RE = /^-{0,1}\d*\.{0,1}\d+$/;
	return (RE.test(input));
}


let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
let checkAllSizes = async function (allSizes){
    for(let i=0;i<allSizes.length;i++){
        allSizes[i]=allSizes[i].trim();
      if(!arr.includes(allSizes[i])) return false
    }
    return true;
   }



   let checkAllSizesForUpdate = async function (allSizes,available){
    for(let i=0;i<allSizes.length;i++){
        allSizes[i]=allSizes[i].trim();
      if(!arr.includes(allSizes[i])) return false
      if(available.includes(allSizes[i])) return false
    }
    return true;
   }



module.exports={isBodyEmpty,isValidS3Url,checkAllSizes,checkAllSizesForUpdate,removeSpaces, isValid, isValidMobileNo, isVerifyString,isValidPincode,isValidJSONstr,acceptFileType,isEmpty,validateEmail,IsNumuric}