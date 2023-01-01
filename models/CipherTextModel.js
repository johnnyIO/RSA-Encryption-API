const mongoose = require("mongoose")

const cipherSchema = new mongoose.Schema({

    first_name:{
        type:"String",
        required:true
    },
   
    last_name:{
        type:"String",
        required:true
    },

    date_sent:{
        type:"String",
        required:true
    },

    time_sent:{
        type:"String",
        required:true
    },
   
    ciphertext:{
        type:"Object",
        required:true
    },

})


const CipherTextModel = mongoose.model("ciphertexts", cipherSchema)
module.exports = CipherTextModel