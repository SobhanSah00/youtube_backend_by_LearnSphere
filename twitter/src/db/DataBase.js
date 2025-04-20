import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`\n MONGODB CONNECTED !!DB_HOST : ${connectionInstance.connection.host}`);
        // console.log(connectionInstance);
    }
    catch(err) {
        console.log(
            `Error connecting to MongoDB: ${err.message}`
        );
        process.exit(1);
    }
}

export {
    connectDB
}