import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const CommentSchema = new Schema({
    tweet : {
        type : Schema.Types.ObjectId,
        ref : 'Tweet',
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User',
    },
    content : {
        type : String,
        required : true
    },
},{
    timestamps : true
})

CommentSchema.plugin(mongooseAggregatePaginate)

export default Comment = mongoose.model("Comment",CommentSchema)