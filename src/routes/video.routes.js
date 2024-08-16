import { upload } from "../middlewares/multer.middleware.js";
import { 
    publishAVideo,
    deleteVideoAndThumbnail,
    togglePublishStatus,
    updateVideoFields,
    updateVideoThumbnail,
    getVideoById,
    getAllVideos

 } from "../controllers/video.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/upload-video").post(
    verifyJwt,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
);

router.route("/d/:videoId").delete(verifyJwt, deleteVideoAndThumbnail);
router.route("/public-video/:videoId").patch(verifyJwt,togglePublishStatus)
router.route("/update-video-fields/:videoId").patch(verifyJwt,updateVideoFields)
router.route("/update-video-thumbnail/:videoId").patch(verifyJwt,upload.single("thumbnail"),updateVideoThumbnail)
router.route("/getVideoById/:videoId").get(verifyJwt,getVideoById)
router.route("/getallvideo").get(verifyJwt,getAllVideos)

export default router