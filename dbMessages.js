//const mongoose = require('mongoose');
import mongoose from "mongoose";
//const Schema = mongoose.Schema;

const chatSchema = mongoose.Schema({ 
	message: String,
    name: String,
    timestamp: String,
    received: Boolean
});


export default mongoose.model("messageContent", chatSchema);

//module.exports = mongoose.model("User", userSchema);