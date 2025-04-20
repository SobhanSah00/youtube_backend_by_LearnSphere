import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandeler.js"

// TODO: toggle subscription   
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid channelId")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    })

    if(isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {
                    subscribed : false
                },
                "unsubscribed successfully"
            ))
    }

    await Subscription.create({
        subscriber : req.user?._id,
        channel : channelId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        );   
})

// TODO: controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid ChannelId")
    }

    // here the channel id is a mongoDB id but this is a string , we need to convert the string to object id 
    // we requre the oject id for quarring in mongodb, but here we have stirng so thats why we converted sting to ObjectId
    channelId = new mongoose.Types.ObjectId(channelId)

    const subscribers = await Subscription.aggregate([
        {
            $match : {
                channel: channelId
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField: "_id",
                as : "subscriber",
                pipeline : [
                    {
                        $lookup : {
                            from : "subscriptions",
                            localField : "_id",

                            foreignField : "channel",
                            as : "subscribed_channels" //subscribed to subscriber
                        }
                    },
                    {
                        $addFields : {
                            subscribed_channels : {
                                $cond : {
                                    if: {
                                        $in : [
                                            channelId,
                                            "$subscribed_channels.subscriber"
                                        ]
                                    },
                                    then : true,
                                    else : false
                                }
                            },
                            subscribersCount : {
                                $size : "$subscribed_channels"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$subscriber"
        },
        {
            $project
        }
    ])
})

// TODO: controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}