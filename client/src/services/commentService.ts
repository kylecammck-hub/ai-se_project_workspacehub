import { api, unwrapResponse } from "./api";
import type { Comment } from "../types/models";

const commentsPath = (taskId: string) => `/tasks/${taskId}/comments`;

export const commentService = {
  list: (taskId: string) =>
    unwrapResponse<Comment[]>(api.get(commentsPath(taskId))),
  create: (taskId: string, content: string) =>
    unwrapResponse<Comment>(api.post(commentsPath(taskId), { content })),
  update: (taskId: string, commentId: string, content: string) =>
    unwrapResponse<Comment>(
      api.patch(`${commentsPath(taskId)}/${commentId}`, { content }),
    ),
  delete: (taskId: string, commentId: string) =>
    unwrapResponse<{ deleted: boolean }>(
      api.delete(`${commentsPath(taskId)}/${commentId}`),
    ),
};
