import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const FollowSchema = new Schema({
    follower: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
},{
    timestamps: true
});

FollowSchema.plugin(mongooseAggregatePaginate);

export default Follow = mongoose.model("Follow", FollowSchema);