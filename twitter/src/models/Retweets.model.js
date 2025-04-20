import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const RetweetSchema = new Schema({
    tweet : {
        type: Schema.Types.ObjectId,
        ref: 'Tweet',
        required: true
    },
    owner : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{
    timestamps: true
})

RetweetSchema.plugin(mongooseAggregatePaginate)

export default Retweet = mongoose.model("Retweet",RetweetSchema)