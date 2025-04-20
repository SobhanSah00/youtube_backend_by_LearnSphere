import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
    addReply
} from "../controllers/comment.controllers.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(verifyJwt,addComment);
router.route("/c/:commentId").delete(verifyJwt,deleteComment).patch(verifyJwt,updateComment);
router.route("/c/:commentId/replies").post(verifyJwt,addReply)
// router.route("/:videoId").get(getVideoComments).post(addComment);
// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router