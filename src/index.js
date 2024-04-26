// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from "../src/db/index.js";

dotenv.config({
        path : './env'
    })

connectDB()
.then(() => {
    const port = process.env.PORT || 8000;

    app.on("error" , () => {
        console.log("ERROR",error);
        throw error;
    })
    
    app.listen(port, () => `Server running on port ${port} 🔥`);
})
.catch((error) => {
    console.log("MONGODB CONNECTION FAILED");
    console.log("ERROR",error)
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