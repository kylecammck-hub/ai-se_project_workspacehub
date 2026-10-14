import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { commentService } from "../services/commentService";
import type { Comment, User } from "../types/models";
import { canManageComment } from "../utils/permissions";

interface TaskCommentsProps {
  taskId: string;
  users: User[];
  onCountChange?: (count: number) => void;
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const TaskComments = ({
  taskId,
  users,
  onCountChange,
}: TaskCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Comments are fetched only when this component mounts, i.e. when the
  // task is expanded — never on page load.
  useEffect(() => {
    let cancelled = false;

    commentService
      .list(taskId)
      .then((nextComments) => {
        if (!cancelled) {
          setComments(nextComments);
          onCountChange?.(nextComments.length);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(loadError, "Unable to load comments"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const updateComments = (next: Comment[]) => {
    setComments(next);
    onCountChange?.(next.length);
  };

  const authorName = (authorId: string) => {
    const author = users.find((candidate) => candidate._id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : "Unknown user";
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setError(null);

    try {
      const created = await commentService.create(taskId, draft.trim());
      updateComments([...comments, created]);
      setDraft("");
    } catch (createError) {
      setError(getErrorMessage(createError, "Unable to add comment"));
    }
  };

  const handleSave = async (commentId: string) => {
    if (!editDraft.trim()) {
      return;
    }

    setError(null);

    try {
      const updated = await commentService.update(
        taskId,
        commentId,
        editDraft.trim(),
      );
      updateComments(
        comments.map((comment) =>
          comment._id === commentId ? updated : comment,
        ),
      );
      setEditingId(null);
      setEditDraft("");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Unable to update comment"));
    }
  };

  const handleDelete = async (commentId: string) => {
    setError(null);

    try {
      await commentService.delete(taskId, commentId);
      updateComments(comments.filter((comment) => comment._id !== commentId));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Unable to delete comment"));
    }
  };

  return (
    <section className="mt-4 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-ink">Comments</h3>
      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Loading comments…</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.length === 0 ? (
            <li className="text-sm text-slate-500">No comments yet.</li>
          ) : null}
          {comments.map((comment) => {
            const canManage = canManageComment(user, comment);
            const isEditing = editingId === comment._id;

            return (
              <li
                className="rounded-2xl bg-slate-50 px-4 py-3"
                key={comment._id}
              >
                <p className="text-xs font-semibold text-slate-500">
                  {authorName(comment.authorId)} ·{" "}
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      aria-label="Edit comment"
                      className="min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                      onChange={(event) => setEditDraft(event.target.value)}
                      value={editDraft}
                    />
                    <div className="flex gap-2">
                      <button
                        className="rounded-[10px] bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-80"
                        onClick={() => void handleSave(comment._id)}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className="rounded-[10px] px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
                        onClick={() => setEditingId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {comment.content}
                  </p>
                )}
                {canManage && !isEditing ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      className="rounded-[10px] px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
                      onClick={() => {
                        setEditingId(comment._id);
                        setEditDraft(comment.content);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-[10px] px-3 py-1 text-sm text-danger transition hover:bg-rose-50"
                      onClick={() => void handleDelete(comment._id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <form className="mt-3 flex gap-2" onSubmit={handleCreate}>
        <input
          aria-label="New comment"
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm transition hover:border-slate-300 placeholder:text-[#94A3B880]"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment"
          value={draft}
        />
        <button
          className="rounded-[10px] bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!draft.trim()}
          type="submit"
        >
          Comment
        </button>
      </form>
    </section>
  );
};
