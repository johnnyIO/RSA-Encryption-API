const mongoose = require("mongoose")

const KeySchema = new mongoose.Schema({
   public_key:{
    required:true,
    type:"Object"
   },
   private_key:{
     required:true,
     type:"Object"
   }, 
   date_of_gen:{
      type:String,
      required:true
   }
})

const KeyModel = mongoose.model("key_table", KeySchema)
module.exports = KeyModel
