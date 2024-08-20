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
    // Match the owner id
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    // Fetch user details and add to tweet document
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
    // Debug: Show tweets with ownerInfo
    // {
    //   $addFields: {
    //     ownerInfoDebug: {
    //       $arrayElemAt: ["$ownerInfo", 0]
    //     }
    //   }
    // },
    // Add like information to tweets
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
    // Add comment information to tweets
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "commentsInfo",
        pipeline: [
          // Lookup for each comment's owner
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
          // Lookup for likes on each comment
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment",
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
          // Lookup for replies to each comment
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "parentComment",
              as: "repliesInfo",
              pipeline: [
                {
                  $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
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
                {
                  $addFields: {
                    likesCount: {
                      $size: "$likesInfo",
                    },
                    isLiked: {
                      $cond: [
                        { $in: [req.user?._id, "$likesInfo.likedBy"] },
                        true,
                        false,
                      ],
                    },
                  },
                },
                {
                  $project: {
                    owner: 1,
                    content: 1,
                    likesCount: 1,
                    isLiked: 1,
                    createdAt: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likesInfo",
              },
              isLiked: {
                $cond: [
                  { $in: [req.user?._id, "$likesInfo.likedBy"] },
                  true,
                  false,
                ],
              },
            },
          },
          {
            $sort: {
              likesCount: -1,
              createdAt: -1,
            },
          },
          {
            $project: {
              owner: 1,
              content: 1,
              likesCount: 1,
              isLiked: 1,
              createdAt: 1,
              repliesInfo: 1,
            },
          },
        ],
      },
    },
    // Add important fields to tweet documents
    {
      $addFields: {
        likesCount: {
          $size: "$likesInfo",
        },
        commentsCount: {
          $size: "$commentsInfo",
        },
        isLiked: {
          $cond: [
            { $in: [req.user?._id, "$likesInfo.likedBy"] },
            true,
            false,
          ],
        },
      },
    },
    // Sort tweets by creation date
    {
      $sort: {
        createdAt: -1,
      },
    },
    // Project necessary fields for the frontend
    {
      $project: {
        content: 1,
        ownerInfo: 1,
        likesCount: 1,
        commentsCount: 1,
        commentsInfo: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully", tweets));
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
