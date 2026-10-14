import { Router } from "express";
import {
  createCommentController,
  deleteCommentController,
  listCommentsController,
  updateCommentController,
} from "../controllers/commentController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

// Mounted at /api/tasks/:id/comments — mergeParams exposes the task :id.
const router = Router({ mergeParams: true });

router.use(asyncHandler(requireAuth));

router.get("/", asyncHandler(listCommentsController));
router.post("/", asyncHandler(createCommentController));
router.patch("/:commentId", asyncHandler(updateCommentController));
router.delete("/:commentId", asyncHandler(deleteCommentController));

export default router;
