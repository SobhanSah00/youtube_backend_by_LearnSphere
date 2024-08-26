import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

//TODO: get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parentComment: null,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $graphLookup: {
        from: "comments",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentComment",
        as: "replies",
        maxDepth: 3,
      },
    },
    {
      $addFields: {
        likeCounts: { $size: "$likes" },
        owner: { $arrayElemAt: ["$owner", 0] },
        isLiked: {
          $cond: {
            if: {
              $and: [
                { $ifNull: [req.user?._id, false] },
                { $in: [req.user?._id, "$likes.likedBy"] },
              ],
            },
            then: true,
            else: false,
          },
        },
        replies: {
          $map: {
            input: "$replies",
            as: "reply",
            in: {
              content: "$$reply.content",
              owner: "$$reply.owner",
              isLiked: {
                $cond: {
                  if: {
                    $and: [
                      { $ifNull: [req.user?._id, false] },
                      { $in: [req.user?._id, "$$reply.likes.likedBy"] },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likeCounts: 1,
        owner: { username: 1, fullName: 1, avatar: 1 },
        isLiked: 1,
        replies: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 50),
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// TODO: add a comment to a video
const addComment = asyncHandler(async (req, res) => {
  const { videoId, parentCommentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  //handel reply cases

  let parentComment = null;
  if (parentCommentId) {
    if (!isValidObjectId(parentCommentId)) {
      throw new ApiError(400, "Invalid parent comment id");
    }
    parentComment = await Comment.findById(parentCommentId);
    // .populate("owner")
    if (!parentComment) {
      throw new ApiError(404, "parent comment is not found");
    }
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
    parentComment: parentCommentId || null, // Link to parent comment
  });

  if (!newComment) {
    throw new ApiError(500, "Failed to add comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment added successfully"));
});

// Todo : add reply on a comment
const addReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  // Check if the parent comment exists
  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    throw new ApiError(404, "Parent comment not found");
  }

  // Create the reply (a comment with a parentComment field set)
  const reply = await Comment.create({
    content,
    parentComment: commentId, // Link to parent comment
    owner: req.user._id, // The user who is replying
    video: parentComment.video, // Link to the original video
  });

  return res
    .status(200)
    .json(new ApiResponse(200, reply, "Reply added successfully"));
});

// TODO: update a comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(403, "invalid comment id");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (!content) {
    throw new ApiError(403, "content is required");
  }
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "you can't update this comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    comment?._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updateComment) {
    throw new ApiError(500, "Failed to update comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "comment updated successfully"));
});

// TODO: delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(403, "invalid comment id");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (comment?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "you can't delete this comment");
  }
  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "comment deleted successfully"));
});

export { getVideoComments, addComment, addReply, updateComment, deleteComment };
