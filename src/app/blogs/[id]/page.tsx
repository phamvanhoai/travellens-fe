"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Loader2, MapPin, MessageSquareText, Pencil, Reply, Trash2, UserRound, X } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import {
  blogService,
  getBlogCommentAuthor,
  getBlogCommentContent,
  getBlogCommentId,
  getBlogCommentReplies,
  getBlogCommentUserId,
  getCustomerBlogAuthor,
  getCustomerBlogExcerpt,
  getCustomerBlogImage,
  getCustomerBlogLocations,
  type BlogComment,
  type CustomerBlog
} from "@/services/blog.service";
import { useAuthStore } from "@/store/use-auth-store";

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const showToast = useToast();
  const [blog, setBlog] = useState<CustomerBlog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);

  useEffect(() => {
    async function loadBlog() {
      if (!params.id) return;
      setLoading(true);
      setCommentsLoading(true);
      setError("");
      try {
        const blogDetail = await blogService.detail(params.id);
        const commentBlogId = blogDetail.blog_id ?? blogDetail.id ?? params.id;
        const blogComments = await blogService.listComments(commentBlogId, { page: 1, limit: 50 }).catch(() => []);
        setBlog(blogDetail);
        setComments(blogComments);
      } catch {
        setError("Cannot load this travel story from API.");
      } finally {
        setLoading(false);
        setCommentsLoading(false);
      }
    }

    void loadBlog();
  }, [params.id]);

  const currentUserId = getCurrentUserId(user);
  const commentBlogId = blog?.blog_id ?? blog?.id ?? params.id;

  async function reloadComments() {
    setCommentsLoading(true);
    try {
      setComments(await blogService.listComments(commentBlogId, { page: 1, limit: 50 }));
    } finally {
      setCommentsLoading(false);
    }
  }

  async function submitComment() {
    const content = commentText.trim();
    if (!content) return;
    if (!hasAuthToken()) {
      showToast({ variant: "error", title: "Login required", description: "Please login to comment on this blog." });
      return;
    }

    setSubmittingComment(true);
    try {
      await blogService.createComment(commentBlogId, { content, comment: content });
      await reloadComments();
      setCommentText("");
      showToast({ variant: "success", title: "Comment posted", description: "Your comment was added." });
    } catch (err) {
      showToast({ variant: "error", title: "Comment failed", description: getCommentApiError(err, "Cannot post this comment.") });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitReply(parentId: number) {
    const content = draftText.trim();
    if (!content) return;
    if (parentId <= 0) {
      showToast({ variant: "error", title: "Cannot reply", description: "This comment is missing a valid id from the API response." });
      return;
    }
    if (!hasAuthToken()) {
      showToast({ variant: "error", title: "Login required", description: "Please login to reply." });
      return;
    }

    setBusyCommentId(parentId);
    try {
      await blogService.replyComment(commentBlogId, parentId, { content, comment: content });
      await reloadComments();
      setReplyingCommentId(null);
      setDraftText("");
      showToast({ variant: "success", title: "Reply posted" });
    } catch (err) {
      showToast({ variant: "error", title: "Reply failed", description: getCommentApiError(err, "Cannot post this reply.") });
    } finally {
      setBusyCommentId(null);
    }
  }

  async function updateComment(commentId: number) {
    const content = draftText.trim();
    if (!content) return;

    setBusyCommentId(commentId);
    try {
      await blogService.updateComment(commentBlogId, commentId, { content, comment: content });
      await reloadComments();
      setEditingCommentId(null);
      setDraftText("");
      showToast({ variant: "success", title: "Comment updated" });
    } catch (err) {
      showToast({ variant: "error", title: "Update failed", description: getCommentApiError(err, "Cannot update this comment.") });
    } finally {
      setBusyCommentId(null);
    }
  }

  async function deleteComment(commentId: number) {
    setBusyCommentId(commentId);
    try {
      await blogService.deleteComment(commentBlogId, commentId);
      await reloadComments();
      showToast({ variant: "success", title: "Comment deleted" });
    } catch (err) {
      showToast({ variant: "error", title: "Delete failed", description: getCommentApiError(err, "Cannot delete this comment.") });
    } finally {
      setBusyCommentId(null);
    }
  }

  if (loading) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Story not available</h1>
        <p className="mt-3 text-slate-600">{error || "This blog could not be found."}</p>
        <Button href="/blogs" className="mt-8">Back to Blogs</Button>
      </section>
    );
  }

  const locations = getCustomerBlogLocations(blog);
  const content = blog.content?.trim();

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-5 text-sm font-semibold text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blogs" className="hover:text-brand-600">Blogs</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Story Detail</span>
      </nav>
      <img src={getCustomerBlogImage(blog, images.balloons)} alt={blog.title} className="h-[460px] w-full rounded-lg object-cover" />
      <p className="mx-auto mt-8 max-w-4xl text-sm font-bold uppercase tracking-wide text-brand-600">Travel story</p>
      <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-bold">{blog.title}</h1>
      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap gap-4 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2"><UserRound size={16} /> {getCustomerBlogAuthor(blog)}</span>
        {blog.created_at ? <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatDate(blog.created_at)}</span> : null}
        {locations.map((location, index) => (
          <Link key={`${location.location_id ?? location.id ?? location.name}-${index}`} href={location.location_id || location.id ? `/locations/${location.location_id ?? location.id}` : "/destinations"} className="inline-flex items-center gap-2 text-brand-600">
            <MapPin size={16} /> {location.name}
          </Link>
        ))}
      </div>

      {content ? (
        <div className="prose prose-slate mx-auto mt-8 max-w-4xl leading-8" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p className="mx-auto mt-8 max-w-4xl text-lg leading-8 text-slate-600">{getCustomerBlogExcerpt(blog, 1200) || "No content has been added for this story yet."}</p>
      )}

      <section className="mx-auto mt-10 max-w-4xl border-t border-slate-200 pt-8">
        <div className="flex items-center gap-3">
          <MessageSquareText className="size-6 text-brand-600" />
          <h2 className="text-2xl font-bold">Comments</h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">{comments.length}</span>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
          <label className="block text-sm font-semibold">
            Add a comment
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value.slice(0, 2000))}
              className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-600"
              placeholder="Share your thoughts about this story..."
              maxLength={2000}
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{commentText.length}/2000</span>
            <Button type="button" onClick={() => void submitComment()} disabled={submittingComment || !commentText.trim()}>
              {submittingComment ? <Loader2 className="size-4 animate-spin" /> : null}
              Post Comment
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {commentsLoading ? (
            <BlogCommentsSkeleton />
          ) : comments.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">No comments yet.</div>
          ) : comments.map((comment) => (
            <CommentCard
              key={getBlogCommentId(comment)}
              comment={comment}
              depth={0}
              currentUserId={currentUserId}
              busyCommentId={busyCommentId}
              editingCommentId={editingCommentId}
              replyingCommentId={replyingCommentId}
              draftText={draftText}
              onDraftChange={setDraftText}
              onStartEdit={(item) => {
                setEditingCommentId(getBlogCommentId(item));
                setReplyingCommentId(null);
                setDraftText(getBlogCommentContent(item));
                }}
                onStartReply={(item) => {
                const commentId = getBlogCommentId(item);
                if (commentId <= 0) {
                  showToast({ variant: "error", title: "Cannot reply", description: "This comment is missing a valid id from the API response." });
                  return;
                }
                setReplyingCommentId(commentId);
                setEditingCommentId(null);
                setDraftText("");
              }}
              onCancelDraft={() => {
                setEditingCommentId(null);
                setReplyingCommentId(null);
                setDraftText("");
              }}
              onUpdate={(id) => void updateComment(id)}
              onDelete={(id) => void deleteComment(id)}
              onReply={(id) => void submitReply(id)}
            />
          ))}
        </div>
      </section>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <Button href="/blogs" variant="outline">Back to Blogs</Button>
      </div>
    </article>
  );
}

function BlogDetailSkeleton() {
  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading story" aria-busy="true">
      <div className="flex gap-2"><div className="h-3.5 w-12 animate-pulse rounded bg-slate-100" /><div className="h-3.5 w-3 animate-pulse rounded bg-slate-100" /><div className="h-3.5 w-14 animate-pulse rounded bg-slate-100" /><div className="h-3.5 w-3 animate-pulse rounded bg-slate-100" /><div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" /></div>
      <div className="mt-5 h-[460px] w-full animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-8 h-3 w-24 animate-pulse rounded bg-brand-100" />
      <div className="mt-4 h-9 w-4/5 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-9 w-3/5 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 flex flex-wrap gap-5">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-4 w-28 animate-pulse rounded bg-slate-100" />)}
      </div>
      <div className="mt-10 space-y-3">
        {Array.from({ length: 7 }, (_, index) => <div key={index} className={`h-4 animate-pulse rounded bg-slate-100 ${index === 6 ? "w-2/3" : index % 3 === 1 ? "w-11/12" : "w-full"}`} />)}
      </div>
      <div className="mt-10 border-t border-slate-200 pt-8">
        <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-44 animate-pulse rounded-lg border border-slate-200 bg-white p-5"><div className="h-3.5 w-28 rounded bg-slate-200" /><div className="mt-3 h-24 rounded-lg bg-slate-100" /></div>
        <div className="mt-6"><BlogCommentsSkeleton /></div>
      </div>
    </article>
  );
}

function BlogCommentsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading comments" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4" aria-hidden="true">
          <div className="flex items-center gap-3"><div className="size-9 animate-pulse rounded-full bg-slate-200" /><div className="space-y-2"><div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" /><div className="h-3 w-20 animate-pulse rounded bg-slate-100" /></div></div>
          <div className="mt-4 h-3.5 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

function CommentCard({
  comment,
  depth,
  currentUserId,
  busyCommentId,
  editingCommentId,
  replyingCommentId,
  draftText,
  onDraftChange,
  onStartEdit,
  onStartReply,
  onCancelDraft,
  onUpdate,
  onDelete,
  onReply
}: {
  comment: BlogComment;
  depth: number;
  currentUserId: number;
  busyCommentId: number | null;
  editingCommentId: number | null;
  replyingCommentId: number | null;
  draftText: string;
  onDraftChange: (value: string) => void;
  onStartEdit: (comment: BlogComment) => void;
  onStartReply: (comment: BlogComment) => void;
  onCancelDraft: () => void;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
}) {
  const id = getBlogCommentId(comment);
  const isOwner = Boolean(currentUserId && getBlogCommentUserId(comment) === currentUserId);
  const isEditing = editingCommentId === id;
  const isReplying = replyingCommentId === id;
  const busy = busyCommentId === id;
  const replies = getBlogCommentReplies(comment);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{getBlogCommentAuthor(comment)}</p>
          {comment.created_at ? <p className="mt-1 text-xs font-semibold text-slate-400">{formatDate(comment.created_at)}</p> : null}
        </div>
        <div className="flex gap-1">
          {depth === 0 ? (
            <button type="button" onClick={() => onStartReply(comment)} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-brand-600" aria-label="Reply">
              <Reply size={15} />
            </button>
          ) : null}
          {isOwner ? (
            <>
              <button type="button" onClick={() => onStartEdit(comment)} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-brand-600" aria-label="Edit comment">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => onDelete(id)} disabled={busy} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-rose-600 disabled:opacity-50" aria-label="Delete comment">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={15} />}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <CommentDraft
          value={draftText}
          busy={busy}
          submitLabel="Update"
          onChange={onDraftChange}
          onCancel={onCancelDraft}
          onSubmit={() => onUpdate(id)}
        />
      ) : (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{getBlogCommentContent(comment) || "No content"}</p>
      )}

      {isReplying ? (
        <div className="mt-4 border-l-2 border-brand-100 pl-4">
          <CommentDraft
            value={draftText}
            busy={busy}
            submitLabel="Reply"
            onChange={onDraftChange}
            onCancel={onCancelDraft}
            onSubmit={() => onReply(id)}
          />
        </div>
      ) : null}

      {replies.length ? (
        <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={getBlogCommentId(reply)}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              busyCommentId={busyCommentId}
              editingCommentId={editingCommentId}
              replyingCommentId={replyingCommentId}
              draftText={draftText}
              onDraftChange={onDraftChange}
              onStartEdit={onStartEdit}
              onStartReply={onStartReply}
              onCancelDraft={onCancelDraft}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CommentDraft({
  value,
  busy,
  submitLabel,
  onChange,
  onCancel,
  onSubmit
}: {
  value: string;
  busy: boolean;
  submitLabel: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-3">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 2000))}
        className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-600"
        maxLength={2000}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          <X size={15} />
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit} disabled={busy || !value.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function hasAuthToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("travel360_token") ?? localStorage.getItem("token"));
}

function getCurrentUserId(user: unknown) {
  const fromStore = readUserId(user);
  if (fromStore) return fromStore;
  try {
    return readUserId(JSON.parse(localStorage.getItem("user") ?? "{}"));
  } catch {
    return 0;
  }
}

function readUserId(user: unknown) {
  if (!user || typeof user !== "object") return 0;
  const record = user as { user_id?: number; id?: number };
  return Number(record.user_id ?? record.id ?? 0);
}

function normalizeOwnComment(comment: BlogComment, content: string, currentUserId: number, user: unknown): BlogComment {
  const userRecord = user && typeof user === "object" ? user as { name?: string; email?: string } : {};
  return {
    ...comment,
    content: comment.content ?? comment.comment ?? content,
    user_id: comment.user_id ?? currentUserId,
    user_name: comment.user_name ?? comment.customer_name ?? userRecord.name ?? userRecord.email ?? "You"
  };
}

function updateCommentInTree(comments: BlogComment[], commentId: number, updated: BlogComment): BlogComment[] {
  return comments.map((comment) => {
    if (getBlogCommentId(comment) === commentId) return { ...comment, ...updated };
    const replies = getBlogCommentReplies(comment);
    return replies.length ? { ...comment, replies: updateCommentInTree(replies, commentId, updated), Replies: undefined } : comment;
  });
}

function removeCommentFromTree(comments: BlogComment[], commentId: number): BlogComment[] {
  return comments
    .filter((comment) => getBlogCommentId(comment) !== commentId)
    .map((comment) => {
      const replies = getBlogCommentReplies(comment);
      return replies.length ? { ...comment, replies: removeCommentFromTree(replies, commentId), Replies: undefined } : comment;
    });
}

function getCommentApiError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object" || !("response" in error)) return fallback;
  const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } }).response;
  if (response?.status === 401) return "Please login with a customer account.";
  if (response?.status === 403) return "This comment does not belong to your account.";
  if (response?.status === 404) return response.data?.message ?? "Blog or comment was not found.";
  return response?.data?.message ?? response?.data?.error ?? fallback;
}
