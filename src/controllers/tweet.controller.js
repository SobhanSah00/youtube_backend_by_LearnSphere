import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";

//TODO: create tweet
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to create tweet");
  }
  // return res.status(200).json(200,tweet,"")
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully. ✅"));
});

// TODO: get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const tweets = await Tweet.aggregate([
    // match the owner id
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    // fetch the user and added to the tweet document , add imp field to this field
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              "avatar.url": 1,
            },
          },
        ],
      },
    },
    //add the like field in tweet , in documents
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likesInfo",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    //add the comment field in tweet
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentsInfo",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment",
              as: "likesInfo",
            },
          },
          {
            $addFields : {
              likesCount: { $size: "$likesInfo" }
            }
          },
          {
            $sort : {
              likesCount : -1,
              createdAt : -1
            }
          },
          {
            $project : {
              owner : 1,
              content : 1,
              likesCount : 1,
              createdAt : 1
            }
          }
        ],
      },
    },
    // add some imp fields like is liked , like count
    {
      $addFields: {
        likesCount: {
          $size: "$likesInfo",
        },
        commentsCount: {
          $size: "$commentsInfo",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likesInfo.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // sort according to the date
    {
      $sort: {
        createdAt: -1,
      },
    },
    // project the imp information which is requred for frontnd
    {
      $project: {
        content: 1,
        ownerInfo: 1,
        likesCount: 1,
        commentsCount: 1,
        commentsInfo : 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully"));
});

//TODO: update tweet
const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "owner can only update the tweets");
  }

  //update the tweet
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Failed to update tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully ✅"));
});

//TODO: delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "owner can only delete the tweets");
  }

  await Tweet.findByIdAndDelete(tweetId); // in mongodb this is used to find the tweet id and delete it

  return res
    .status(200)
    .json(new ApiResponse(200, { tweetId }, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
