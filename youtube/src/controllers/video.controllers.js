import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { deleteOnCloudinary, uploadonCloudinary } from "../utils/cloudinary.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
// import { text } from "express";

//TODO: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (!userId) {
    throw new ApiError(404, "there is no user id");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "invalid user id");
  }

  // console.log(userId);
  const pipeline = [];

  // for using Full Text based search u need to create a search index in mongoDB atlas
  // you can include field mapppings in search index eg.title, description, as well
  // Field mappings specify which fields within your documents should be indexed for text search.
  // this helps in seraching only in title, desc providing faster search results

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          // if u find the difficulti then go to the mongodb aggregate docs and $search about the $text and index, search oporator
          query: query,
          path: ["title", "description", "owner"],
        },
      },
    });
  }

  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
    },
  });

  //fetch the video if only they are set to isPublished as true
  pipeline.push({
    $match: {
      isPublished: true,
    },
  });
  // sort the videos based on the query views, when the video is created , views duration
  // using the asc and dsc for this assending and desendin
  if (sortBy) {
    const sortOrder = sortType === "asc" ? 1 : -1;
    pipeline.push({
      $sort: {
        //[sortBy] -> this is the way of wrote advance code in dynamic state
        //sortBy is neither an object nor an array; it is a string in this context.
        //sortBy contain like title , desc, and owner which by it should search
        /*
        Dynamic Key Assignment: If sortBy contains the string "title", 
        the object { [sortBy]: ... } will become { title: ... }. This is useful when you don't know the key name ahead of time and need to generate it based on user input or other dynamic factors.
        */
        [sortBy]: sortOrder,
      },
    });
  } else {
    // Default sort by creation date in descending order
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  // push the pipeline to owner details what will be required to show
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "videos fetched successfully"));
});

// TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Please fill in all fields");
  }
  const videoFileLocalPath = req.files?.videoFile[0].path; // the videoFile name comes from the video route
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "videoFileLocalPath is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnailLocalPath is required");
  }

  const videoFile = await uploadonCloudinary(videoFileLocalPath);
  const thumbnail = await uploadonCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "video file not found");
  }

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });

  const videoUploaded = await Video.findById(video._id);

  if (!videoUploaded) {
    throw new ApiError(
      500,
      "video upload processing is failed, please try again ❌"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

// fixme : create also nesting comment and like also
//TODO: get video by id
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
        pipeline: [
          // Lookup the user who made the comment
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          // Lookup likes for the comment
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment",
              as: "likesInfo",
            },
          },
          // Lookup nested comments (replies)
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "parentComment",
              as: "replies",
              pipeline: [
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
                    as: "likesInfo",
                  },
                },
                {
                  $addFields: {
                    likesCount: { $size: "$likesInfo" },
                    isLiked: {
                      $cond: {
                        if: { $in: [req.user?._id, "$likesInfo.likedBy"] },
                        then: true,
                        else: false,
                      },
                    },
                  },
                },
                {
                  $project: {
                    content: 1,
                    createdAt: 1,
                    likesCount: 1,
                    isLiked: 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$likesInfo" },
              isLiked: {
                $cond: {
                  if: { $in: [req.user?._id, "$likesInfo.likedBy"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              content: 1,
              createdAt: 1,
              likesCount: 1,
              isLiked: 1,
              "owner.username": 1,
              "owner.avatar": 1,
              replies: 1, // Include nested replies
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video || video.length === 0) {
    throw new ApiError(500, "Failed to fetch video");
  }

  // Increment views if the video is fetched successfully
  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video details fetched successfully"));
});

//TODO: update video details like title, description, thumbnail
const updateVideoFields = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (!title || !description) {
    throw new ApiError(400, "title and description are required");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You can't edit this video as you are not the owner"
    );
  }

  const updatedvideoFields = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedvideoFields) {
    throw new ApiError(500, "Failed to update the video fields");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video field are updated successfully"));
});

//TODO : update the thumbnail
const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You can't edit this video as you are not the owner"
    );
  }

  const oldThumbnailToDelete = video.thumbnail.public_id;

  const newThumbnailLocLPath = req.file?.path;

  const newThumbnail = await uploadonCloudinary(newThumbnailLocLPath);

  if (!newThumbnail) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  const upadateVideoThumbnail = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: {
          public_id: newThumbnail.public_id,
          url: newThumbnail.url,
        },
      },
    },
    {
      new: true,
    }
  );

  if (!upadateVideoThumbnail) {
    throw new ApiError(500, "Failed to update the video thumbnail");
  }

  if (upadateVideoThumbnail) {
    await deleteOnCloudinary(oldThumbnailToDelete, "image");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video thumbnail are updated successfully"));
});

//TODO: delete video
const deleteVideoAndThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  // console.log(video);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  //delete video from database
  const videoDeleted = await Video.findByIdAndDelete(video?._id);

  if (!videoDeleted) {
    throw new ApiError(500, "video deletion is failed, please try again ❌");
  }

  await deleteOnCloudinary(video.thumbnail.public_id);
  await deleteOnCloudinary(video.videoFile.public_id, "video");

  //TODO: delete likes and comments
  await Like.deleteMany({
    video: videoId,
  });

  await Comment.deleteMany({
    video: videoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video delted successfully"));
});

//TODO : toggle publish status for hide or seen videos
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);

  // Check the video id is valid object id or not
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video is not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to publish this video");
  }

  const togglePublishVideoStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true } // To return the updated document
  );

  if (!togglePublishVideoStatus) {
    throw new ApiError(
      500,
      "video status update is failed failed to toggle, please try again ❌"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: togglePublishVideoStatus.isPublished,
      },
      "video status updated successfully"
    )
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideoFields,
  updateVideoThumbnail,
  deleteVideoAndThumbnail,
  togglePublishStatus,
};
