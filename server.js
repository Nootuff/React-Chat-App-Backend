//Import
//const express = require('express');
//const mongoose = require('mongoose');

import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import mongoose from 'mongoose';
import Messages from "./dbMessages.js";
import Pusher from "pusher"; //Pusher is installed on the backend. 
import Cors from "cors" //



//App config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: process.env.PUSHER_APPID,
    key: "18f85386a870e4130e7d",
    secret: process.env.PUSHER_SECRET,
    cluster: "eu",
    useTLS: true
});

//Middleware
app.use(express.json());

app.use(Cors());


//Somewhere in here you will need to put the security. The code below should maybe be removed in the final build?
/*
app.use((req, res, next)=>{
    res.setHeader("Access-control-Allow-Origin", "*"); 
    res.setHeader("Access-control-Allow-Headers", "*");
    next();
})
*/

//DB Config
const connectionUrl = process.env.DB_URL; //"mongodb+srv://Adam:Blizzard1@cluster0.rgisb.mongodb.net/reactChatDB?retryWrites=true&w=majority"; //

mongoose.connect(connectionUrl, err => {
    if (err) throw err;
    console.log('MongoDB connection established', connectionUrl)
});
/* These are apparently  depreciated, this may have implications for dogbase, consider removing them from that too. 
useNewUrlParser: true,
useUnifiedTopology: true,
useCreateIndex: true,
*/

//Pusher is a realtime database update tool, when the mongo database is updated, the data is sent back without you needing to reload the page, just like React. Without it, the data would be sent to the database but it wouldn't display until the next page reload. This interacts with somehting called mongoDb change stream, whenever there is a change in the collection eg a new message gets added, the change stream triggers the pusher, uploading the message and then pusher forecefully makes mongo send the data back. 

const db = mongoose.connection

db.once("open", () => { //The .once function will trigger only once, once the database connection is open. It will only trigger on database connection.
    console.log("Database connected");
    const msgCollection = db.collection("messagecontents"); //due to how mongodb creates collections in lowercase this needs to be lowercase with an s on the end. messagecontents is what the collection is called in the cluster on mongoDb but it is defined in dbMessages.js    but the name needs to match the collection name at the end of the mongoose schema in the other js doc, also maybe change that collection name to lowercase, this may cause a problem with your mongoose database online, see waht the collection is named there
    //console.log(msgCollection);
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => { //Whenver a change occurs, we set the change into an argument called "change"
        console.log("A change has occured ", change);

        if (change.operationType === "insert") { //operationType is a field of the change, a value you can see when the change is logged, if it === the word "insert", the value of messageDetails is set as the fullDocument value of change. fullDocument is the actual chat message that was sent. 
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", { //We then trigger pusher which saves the name and message values to...
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else { //Else trigger an error message.
            console.log("Error triggering Pusher");
        }
    })
});

//??

//api routes
app.get("/", (req, res) => res.status(200).send("Here again")) //res.status(200), 200 is the code taht means the server is running. 

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => { //.find is the javascript method
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data) //status must be set to 200 for this to work apparently. status code 200 means everything went ok. 
        }
    });
});

app.post("/messages/new", (req, res) => { //v1 stands for version 1
    const dbMessage = req.body; //the message structure is contained within this const.

    Messages.create(dbMessage, (err, data) => { //const dbMessage is saved in "Messages"
        if (err) { //If there's an error set the response status to 500, the code for internal server error.
            res.status(500).send(err)
        } else {
            res.status(201).send(data) //Send the data we just added into the database. 
        }
    })
})

//Listen
app.listen(port, () => console.log(`Site is live on port ${port}`))