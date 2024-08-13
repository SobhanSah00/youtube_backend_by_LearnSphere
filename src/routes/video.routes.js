import { upload } from "../middlewares/multer.middleware.js";
import { 
    publishAVideo,
    deleteVideoAndThumbnail
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

export default router