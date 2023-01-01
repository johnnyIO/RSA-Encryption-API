const mongoose = require("mongoose")

const keydis = new mongoose.Schema({

    public_key :{
        type:"Object",
        required:true
    },
   
    first_name:{
        type:"String",
        required:true
    },

    last_name:{
        type:"String",
        required:true
    },

    date_of_dis:{
        type:"String",
        required:true
    },

    user_confirmed:{
        type:Number,
        required:true
    }



})


const keydisModel = mongoose.model("key_distribution", keydis)
module.exports = keydisModel