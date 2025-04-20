import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";

//TODO: toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  /*The findOne method in Mongoose is used to query the MongoDB database ,
    for a single document that matches the given criteria ,  It returns the first document that matches the query */
  const isLikeAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: toggle like on comment
// toggle like on comment or nested comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  // Find the comment, including any nested ones
  const comment = await Comment.findById(commentId).populate("parentComment");

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isLikeAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready?._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(403, "reqired tweet id");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(403, "Invalid tweet id");
  }

  const isLikeAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready?._id);

    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

//TODO: get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideoAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerInfo",
            },
          },
          {
            $unwind: "$ownerInfo",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          owner: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullname: 1,
            "avatar.url": 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideoAggregate,
        "liked Videos fetched successfullly"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
