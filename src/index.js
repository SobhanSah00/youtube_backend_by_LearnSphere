import dotenv from "dotenv"
import { connectDB } from "./db/DataBase.js"
import { app } from "./app.js"

dotenv.config({
    path: "./env"
})

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.log("ERROR", err);
            throw err;
        })

        app.listen(process.env.PORT || 5000, () => {
            console.log("Server is running on port " + (process.env.PORT || 5000))
        })
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAILED");
        console.log("ERROR", err);
        process.exit(1);
    })