import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    fullname: {
        type: String,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    },
    coverImage: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
},
{
    timestamps : true
})

UserSchema.plugin(mongooseAggregatePaginate);

export default User = mongoose.model("User", UserSchema)