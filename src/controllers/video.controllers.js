import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandeler.js"
import {deleteOnCloudinary, uploadonCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    
})

  // TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if([title,description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Please fill in all fields")
    }
    const videoFileLocalPath = req.files?.videoFile[0].path; // the videoFile name comes from the video route
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoFileLocalPath) {
        throw new ApiError(400,"videoFileLocalPath is required");
    }

    if(!thumbnailLocalPath) {
        throw new ApiError(400,"thumbnailLocalPath is required");
    }

    const videoFile = await uploadonCloudinary(videoFileLocalPath)
    const thumbnail = await uploadonCloudinary(thumbnailLocalPath)

    if(!videoFile) {
        throw new ApiError(400,"video file not found")
    }

    if(!thumbnail) {
        throw new ApiError(400,"thumbnail not found")
    }

    const video = await Video.create({
        title,
        description,
        duration : videoFile.duration,
        videoFile : {
            url : videoFile.url,
            public_id : videoFile.public_id

        },
        thumbnail : {
            url : thumbnail.url,
            public_id : thumbnail.public_id
        },
        owner : req.user?._id,
        isPublished : false
    })

    const videoUploaded = await Video.findById(video._id)

    if(!videoUploaded) {
        throw new ApiError(500, "video upload processing is failed, please try again ❌")
    }

    return res.status(200).json(new ApiResponse(200,video,"video uploaded successfully"))

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

//TODO: delete video
const deleteVideoAndThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)
    console.log(video);
    
    if(!video) {
        throw new ApiError(404, "Video not found");
    }
    if(video?.owner.toString() !== req.user?._id) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    //delete video from database
    const videoDeleted = await Video.findByIdAndDelete(video?._id)

    if(!videoDeleted) {
        throw new ApiError(500, "video deletion is failed, please try again ❌")
    }

    await deleteOnCloudinary(video.thumbnail.public_id);
    await deleteOnCloudinary(video.videoFile.public_id,"video");

    return res.status(200).json(new ApiResponse(200,{},"video delted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideoAndThumbnail,
    togglePublishStatus
}