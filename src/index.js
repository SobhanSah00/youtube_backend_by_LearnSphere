// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from "../src/db/index.js";
import { app } from "./app.js"



dotenv.config({
    path: './env'
})

connectDB()
    .then(() => {

        // In Express.js, the .on() function is used to listen for events on an object, 
        // like a server or a stream.
        app.on("error", (error) => {
            console.log("ERROR", error);
            throw error;
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️  Server running on port ${process.env.PORT} 🔥`)
        });
    })
    .catch((error) => {
        console.log("MONGODB CONNECTION FAILED");
        console.log("ERROR", error)
        throw error
    })

//when the async method is end then the a promise is return always





//approach 1

/*
;( async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log("DB is connected to")
        app.on("error" , () => {
            console.log("ERROR",error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    } catch(error) {
        console.error("ERROR",error)
        throw error
    }
})()
*/