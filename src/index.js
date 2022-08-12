const express = require('express');
const mongoose = require('mongoose');
const router = require('./routes/route')
const multer= require("multer");
const aws= require('aws-sdk');

const app  = express();


// raw data -->body
app.use(express.json())

app.use( multer().any())

const url="mongodb+srv://Anjali-11:Krishna@cluster0.hhecqj7.mongodb.net/Anjali100";
mongoose.connect(url,{useNewUrlParser: true})
.then(()=>console.log("MongoDb is Connected"))
.catch(err=>console.log(err))

app.use('/',router);

app.listen(process.env.PORT || 3000, function (){
    console.log('Server Started: '+3000)
})