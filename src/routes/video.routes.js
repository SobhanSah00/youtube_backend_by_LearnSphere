import { upload } from "../middlewares/multer.middleware.js";
import {
  publishAVideo,
  deleteVideoAndThumbnail,
  togglePublishStatus,
  updateVideoFields,
  updateVideoThumbnail,
  getVideoById,
  getAllVideos,
} from "../controllers/video.controllers.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

// router.route("/upload-video").post(
//     verifyJwt,
//     upload.fields([
//       {
//         name: "videoFile",
//         maxCount: 1,
//       },
//       {
//         name: "thumbnail",
//         maxCount: 1,
//       },
//     ]),
//     publishAVideo
// );

// router.route("/d/:videoId").delete(verifyJwt, deleteVideoAndThumbnail);
// router.route("/public-video/:videoId").patch(verifyJwt,togglePublishStatus)
// router.route("/update-video-fields/:videoId").patch(verifyJwt,updateVideoFields)
// router.route("/update-video-thumbnail/:videoId").patch(verifyJwt,upload.single("thumbnail"),updateVideoThumbnail)
// router.route("/getVideoById/:videoId").get(verifyJwt,getVideoById)
// router.route("/getallvideo").get(verifyJwt,getAllVideos)

router
  .route("/")
  // .get(getAllVideos)
  .post(
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

router.route("/").get(getAllVideos)

router
  .route("/v/:videoId")
  .get(verifyJwt,getVideoById)
  .delete(verifyJwt,deleteVideoAndThumbnail)
  .patch(verifyJwt,updateVideoFields)
  // .patch(verifyJwt,upload.single("thumbnail"),updateVideoThumbnail)

router.route("/v/update-video-thumbnail/:videoId").patch(verifyJwt,upload.single("thumbnail"),updateVideoThumbnail)
router.route("/toggle/publish/:videoId").patch(verifyJwt,togglePublishStatus);

export default router;