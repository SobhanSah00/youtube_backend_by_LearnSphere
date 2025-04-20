import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const LikeSchema = new Schema({
    tweet : {
        type : Schema.Types.ObjectId,
        ref : 'Tweets'
    },
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    }
})

LikeSchema.plugin(mongooseAggregatePaginate)

export default Like = mongoose.model("Like", LikeSchema)