"use client";

import axios from "axios";
import { ArrowLeft, Heart, MapPin, MessageCircle, MessageSquareText, RefreshCw, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import {
  adminTravelFeedService,
  getTravelFeedAuthor,
  getTravelFeedCommentAuthor,
  getTravelFeedCommentContent,
  getTravelFeedCommentCount,
  getTravelFeedCommentId,
  getTravelFeedCommentReplies,
  getTravelFeedContent,
  getTravelFeedDestinationName,
  getTravelFeedLikeCount,
  getTravelFeedLocationName,
  getTravelFeedPhotos,
  getTravelFeedPostId,
  getTravelFeedReportCount,
  getTravelFeedShareCount,
  getTravelFeedTitle,
  type TravelFeedComment,
  type TravelFeedPost
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

export default function AdminTravelFeedPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = params.postId;
  const highlightedCommentId = Number(searchParams.get("comment_id") ?? 0);
  const [post, setPost] = useState<TravelFeedPost | null>(null);
  const [comments, setComments] = useState<TravelFeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const showToast = useToast();

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, commentsResult] = await Promise.all([
        adminTravelFeedService.detailPost(postId),
        adminTravelFeedService.listComments({ post_id: Number(postId), page: 1, limit: 100, include_deleted: true, sort: "newest" })
      ]);
      if (!result) {
        setPost(null);
        setError("Cannot find this travel feed post from the admin API.");
        return;
      }
      setPost(result);
      setComments(buildCommentTree(commentsResult.items));
    } catch (err) {
      const message = getApiError(err, "Cannot load this travel feed post.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [postId, showToast]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  async function deletePost() {
    if (!post) return;
    const id = getTravelFeedPostId(post);
    if (!id) {
      setError("This post is missing a valid id from the API response.");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await adminTravelFeedService.deletePost(id);
      showToast({ variant: "success", title: "Post deleted", description: getTravelFeedTitle(post) });
      setConfirmingDelete(false);
      router.push("/admin/travel-feed");
    } catch (err) {
      const message = getApiError(err, "Cannot delete this travel feed post.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setDeleting(false);
    }
  }

  async function restorePost() {
    if (!post) return;
    const id = getTravelFeedPostId(post);
    if (!id) return;
    setDeleting(true);
    setError("");
    try {
      await adminTravelFeedService.restorePost(id);
      showToast({ variant: "success", title: "Post restored", description: getTravelFeedTitle(post) });
      await loadPost();
    } catch (err) {
      const message = getApiError(err, "Cannot restore this travel feed post.");
      setError(message);
      showToast({ variant: "error", title: "Restore failed", description: message });
    } finally {
      setDeleting(false);
    }
  }

  const title = post ? getTravelFeedTitle(post) : `Post #${postId}`;
  const author = post ? getTravelFeedAuthor(post) : null;
  const photos = post ? getTravelFeedPhotos(post) : [];
  const place = post ? [getTravelFeedDestinationName(post), getTravelFeedLocationName(post)].filter(Boolean).join(" / ") : "";
  const isDeleted = post?.status === "deleted" || Boolean(post?.deleted_at);

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button href="/admin/travel-feed" variant="ghost" className="mb-3 h-9 px-0 hover:bg-transparent">
              <ArrowLeft size={17} /> Back to posts
            </Button>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">Admin detail view for travel feed post #{postId}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={`/admin/travel-feed/comments?post_id=${postId}`} variant="outline"><MessageSquareText size={17} /> Comments</Button>
            <Button variant="outline" onClick={() => void loadPost()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button>
            {post && isDeleted ? <Button variant="outline" onClick={() => void restorePost()} disabled={deleting} className="border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:text-emerald-700"><RotateCcw size={17} /> Restore</Button> : null}
            {post && !isDeleted ? <Button variant="outline" onClick={() => setConfirmingDelete(true)} disabled={deleting} className="border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700"><Trash2 size={17} /> Delete</Button> : null}
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        {loading ? (
          <div className="mt-6 grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_280px]" aria-label="Loading post" aria-busy="true">
            <div>
              <div className="h-64 rounded-lg bg-slate-200" />
              <div className="mt-6 h-5 w-24 rounded bg-slate-200" />
              <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-4">
                <div className="h-3.5 w-full rounded bg-slate-200" />
                <div className="h-3.5 w-5/6 rounded bg-slate-200" />
                <div className="h-3.5 w-2/3 rounded bg-slate-200" />
              </div>
            </div>
            <div className="h-80 rounded-lg border border-slate-200 p-4">
              <div className="space-y-5">
                {Array.from({ length: 6 }, (_, index) => <div key={index}><div className="h-2.5 w-16 rounded bg-slate-100" /><div className="mt-2 h-3.5 w-28 rounded bg-slate-200" /></div>)}
              </div>
            </div>
          </div>
        ) : post ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <article className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {author?.avatar ? (
                    <img src={resolveBackendAssetUrl(author.avatar)} alt={author.name} className="size-11 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {(author?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-ink">{title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                      <span>{author?.name || "Unknown user"}</span>
                      {post.created_at ? <span>{formatDate(post.created_at)}</span> : null}
                      {place ? <span className="inline-flex items-center gap-1"><MapPin size={13} />{place}</span> : null}
                    </div>
                  </div>
                </div>
                {getTravelFeedContent(post) ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">{getTravelFeedContent(post)}</p> : null}
              </div>

              {photos.length > 0 ? (
                <div className={photos.length === 1 ? "grid" : "grid gap-1 sm:grid-cols-2"}>
                  {photos.map((photo, index) => (
                    <img key={`${photo}-${index}`} src={resolveBackendAssetUrl(photo)} alt={`${title} photo ${index + 1}`} className={photos.length === 1 ? "max-h-[620px] w-full object-cover" : "h-80 w-full object-cover"} />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><Heart size={16} />{getTravelFeedLikeCount(post)} likes</span>
                <span className="inline-flex items-center gap-2"><MessageCircle size={16} />{getTravelFeedCommentCount(post)} comments</span>
                <span className="inline-flex items-center gap-2"><Share2 size={16} />{getTravelFeedShareCount(post)} shares</span>
              </div>

              <section className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-ink">Comments</h3>
                  <Button href={`/admin/travel-feed/comments?post_id=${postId}`} variant="ghost" className="h-8 px-2 text-xs">Manage comments</Button>
                </div>
                <div className="mt-3 grid gap-3">
                  {comments.length ? comments.map((comment, index) => (
                    <AdminCommentItem key={getTravelFeedCommentId(comment) || `${comment.created_at}-${index}`} comment={comment} highlightedCommentId={highlightedCommentId} />
                  )) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No comments yet.</p>}
                </div>
              </section>
            </article>

            <aside className="h-fit rounded-lg border border-slate-200 p-4">
              <dl className="grid gap-4 text-sm">
                <DetailItem label="Status"><StatusBadge value={post.status ?? "published"} /></DetailItem>
                <DetailItem label="Visibility">{post.visibility ?? "-"}</DetailItem>
                <DetailItem label="Author">{author?.name ?? "-"}</DetailItem>
                <DetailItem label="Place">{place || "-"}</DetailItem>
                <DetailItem label="Created">{post.created_at ? formatDate(post.created_at) : "-"}</DetailItem>
                <DetailItem label="Updated">{post.updated_at ? formatDate(post.updated_at) : "-"}</DetailItem>
                {post.deleted_at ? <DetailItem label="Deleted">{formatDate(post.deleted_at)}</DetailItem> : null}
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                <Metric label="Likes" value={getTravelFeedLikeCount(post)} />
                <Metric label="Comments" value={getTravelFeedCommentCount(post)} />
                <Metric label="Shares" value={getTravelFeedShareCount(post)} />
                <Metric label="Reports" value={getTravelFeedReportCount(post)} danger={getTravelFeedReportCount(post) > 0} />
              </div>
            </aside>
          </div>
        ) : null}
      </div>

      {confirmingDelete && post ? (
        <ConfirmDialog
          title="Delete post?"
          message={`Delete "${getTravelFeedTitle(post)}"? The backend will soft-delete this travel feed post for audit history.`}
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          onCancel={() => {
            if (!deleting) setConfirmingDelete(false);
          }}
          onConfirm={() => void deletePost()}
        />
      ) : null}
    </>
  );
}

function AdminCommentItem({ comment, highlightedCommentId }: { comment: TravelFeedComment; highlightedCommentId: number }) {
  const id = getTravelFeedCommentId(comment);
  const highlighted = id > 0 && id === highlightedCommentId;
  const deleted = comment.status === "deleted" || Boolean(comment.deleted_at);
  const replies = getTravelFeedCommentReplies(comment);

  return (
    <div id={id ? `comment-${id}` : undefined} className="scroll-mt-24">
      <div className={`flex gap-3 rounded-lg p-3 ${highlighted ? "bg-amber-50 ring-2 ring-amber-300" : "bg-slate-50"}`}>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">
          {getTravelFeedCommentAuthor(comment).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{getTravelFeedCommentAuthor(comment)}</p>
            {comment.created_at ? <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span> : null}
            {deleted ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">Deleted</span> : null}
          </div>
          <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${deleted ? "text-slate-400 line-through" : "text-slate-600"}`}>{getTravelFeedCommentContent(comment) || "-"}</p>
        </div>
      </div>
      {replies.length ? (
        <div className="ml-6 mt-3 grid gap-3 border-l-2 border-slate-200 pl-4 sm:ml-10">
          {replies.map((reply, index) => <AdminCommentItem key={getTravelFeedCommentId(reply) || `${reply.created_at}-${index}`} comment={reply} highlightedCommentId={highlightedCommentId} />)}
        </div>
      ) : null}
    </div>
  );
}

function buildCommentTree(items: TravelFeedComment[]) {
  const byId = new Map<number, TravelFeedComment>();
  const roots: TravelFeedComment[] = [];

  items.forEach((item) => {
    const id = getTravelFeedCommentId(item);
    if (!id) return;
    byId.set(id, { ...item, replies: getTravelFeedCommentReplies(item), Replies: undefined });
  });

  byId.forEach((comment) => {
    const parentId = Number(comment.parent_comment_id ?? 0);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) {
      parent.replies = [...getTravelFeedCommentReplies(parent), comment];
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-700">{children}</dd>
    </div>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className={danger ? "text-xl font-bold text-rose-600" : "text-xl font-bold text-ink"}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors = value === "published"
    ? "bg-emerald-50 text-emerald-700"
    : value === "deleted"
      ? "bg-rose-50 text-rose-700"
      : value === "hidden"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${colors}`}>{value}</span>;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
