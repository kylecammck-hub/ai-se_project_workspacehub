import { Types } from "mongoose";
import { Comment } from "../models/Comment";
import { Task } from "../models/Task";
import type { AuthPayload } from "../types/domain";
import { AppError } from "../utils/appError";
import { assertFound } from "../utils/scopedQuery";
import { requireString } from "../utils/validators";
import { canManageComment } from "./permissionService";

const MAX_COMMENT_LENGTH = 2000;

const assertValidId = (id: string, resourceName: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${resourceName} not found`, 404);
  }
};

const parseContent = (payload: unknown): string => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  const content = requireString(
    (payload as Record<string, unknown>).content,
    "Content",
  );

  if (content.length > MAX_COMMENT_LENGTH) {
    throw new AppError(
      `Content must be at most ${MAX_COMMENT_LENGTH} characters`,
      400,
    );
  }

  return content;
};

const ensureTaskInOrganization = async (
  taskId: string,
  organizationId: string,
) => {
  assertValidId(taskId, "Task");
  const task = await Task.findOne({ _id: taskId, organizationId });
  return assertFound(task, "Task");
};

const getScopedComment = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
) => {
  await ensureTaskInOrganization(taskId, actor.organizationId);
  assertValidId(commentId, "Comment");

  const comment = await Comment.findOne({
    _id: commentId,
    taskId,
    organizationId: actor.organizationId,
  });

  return assertFound(comment, "Comment");
};

export const listComments = async (actor: AuthPayload, taskId: string) => {
  await ensureTaskInOrganization(taskId, actor.organizationId);

  return Comment.find({
    taskId,
    organizationId: actor.organizationId,
  }).sort({ createdAt: 1 });
};

export const createComment = async (
  actor: AuthPayload,
  taskId: string,
  payload: unknown,
) => {
  const content = parseContent(payload);
  await ensureTaskInOrganization(taskId, actor.organizationId);

  // taskId comes from the URL and authorId/organizationId from the token;
  // only `content` is ever read from the request body.
  return Comment.create({
    organizationId: actor.organizationId,
    taskId,
    authorId: actor.userId,
    content,
  });
};

export const updateComment = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
  payload: unknown,
) => {
  const comment = await getScopedComment(actor, taskId, commentId);

  if (!canManageComment(actor, String(comment.authorId))) {
    throw new AppError("You do not have permission to edit this comment", 403);
  }

  comment.content = parseContent(payload);
  await comment.save();
  return comment;
};

export const deleteComment = async (
  actor: AuthPayload,
  taskId: string,
  commentId: string,
) => {
  const comment = await getScopedComment(actor, taskId, commentId);

  if (!canManageComment(actor, String(comment.authorId))) {
    throw new AppError(
      "You do not have permission to delete this comment",
      403,
    );
  }

  await comment.deleteOne();
  return { deleted: true };
};

export const countCommentsByTask = async (
  organizationId: string,
  taskIds: Types.ObjectId[],
): Promise<Map<string, number>> => {
  if (!taskIds.length) {
    return new Map();
  }

  const rows = await Comment.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        taskId: { $in: taskIds },
      },
    },
    { $group: { _id: "$taskId", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
};
