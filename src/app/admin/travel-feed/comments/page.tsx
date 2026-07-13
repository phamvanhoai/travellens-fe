"use client";

import axios from "axios";
import { Eye, Loader2, RefreshCw, Rss, Search, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  adminTravelFeedService,
  getTravelFeedCommentAuthor,
  getTravelFeedCommentContent,
  getTravelFeedCommentId,
  getTravelFeedCommentPostId,
  getTravelFeedCommentPostTitle,
  type AdminTravelFeedCommentListParams,
  type TravelFeedComment
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

const pageSize = 20;

export default function AdminTravelFeedCommentsPage() {
  const searchParams = useSearchParams();
  const initialPostId = positiveNumberText(searchParams.get("post_id") ?? searchParams.get("postId") ?? "");
  const initialUserId = positiveNumberText(searchParams.get("user_id") ?? searchParams.get("userId") ?? "");
  const initialSearch = (searchParams.get("search") ?? "").trim();
  const [comments, setComments] = useState<TravelFeedComment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  const [postIdInput, setPostIdInput] = useState(initialPostId);
  const [postId, setPostId] = useState(initialPostId);
  const [userIdInput, setUserIdInput] = useState(initialUserId);
  const [userId, setUserId] = useState(initialUserId);
  const [statusFilter, setStatusFilter] = useState("");
  const [hasParentFilter, setHasParentFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sort, setSort] = useState<AdminTravelFeedCommentListParams["sort"]>("newest");
  const [loading, setLoading] = useState(true);
  const [deletingComment, setDeletingComment] = useState<TravelFeedComment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showToast = useToast();

  useEffect(() => {
    const nextPostId = positiveNumberText(searchParams.get("post_id") ?? searchParams.get("postId") ?? "");
    const nextUserId = positiveNumberText(searchParams.get("user_id") ?? searchParams.get("userId") ?? "");
    const nextSearch = (searchParams.get("search") ?? "").trim();

    if (nextPostId) {
      setPostIdInput(nextPostId);
      setPostId(nextPostId);
      setPage(1);
    }

    if (nextUserId) {
      setUserIdInput(nextUserId);
      setUserId(nextUserId);
      setPage(1);
    }

    if (nextSearch) {
      setSearchInput(nextSearch);
      setQuery(nextSearch);
      setPage(1);
    }
  }, [searchParams]);

  const params = useMemo<AdminTravelFeedCommentListParams>(() => ({
    page,
    limit: pageSize,
    search: query || undefined,
    post_id: postId ? Number(postId) : undefined,
    user_id: userId ? Number(userId) : undefined,
    status: statusFilter ? statusFilter as AdminTravelFeedCommentListParams["status"] : undefined,
    has_parent: hasParentFilter === "" ? undefined : hasParentFilter === "true",
    include_deleted: includeDeleted || undefined,
    sort
  }), [hasParentFilter, includeDeleted, page, postId, query, sort, statusFilter, userId]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminTravelFeedService.listComments(params);
      setComments(result.items);
      setTotalItems(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      const message = getApiError(err, "Cannot load travel feed comments from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [params, showToast]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function deleteComment() {
    if (!deletingComment) return;

    const commentId = getTravelFeedCommentId(deletingComment);
    if (!commentId) {
      setError("This comment is missing a valid id from the API response.");
      setDeletingComment(null);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminTravelFeedService.deleteComment(commentId);
      showToast({ variant: "success", title: "Comment deleted", description: getTravelFeedCommentContent(deletingComment) || `#${commentId}` });
      setDeletingComment(null);
      await loadComments();
    } catch (err) {
      const message = getApiError(err, "Cannot delete this travel feed comment.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchInput.trim());
    setPostId(positiveNumberText(postIdInput));
    setUserId(positiveNumberText(userIdInput));
    setPage(1);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Travel Feed Comments</h1>
            <p className="mt-1 text-sm text-slate-500">{postId ? `Showing comments for post #${postId} only.` : "View and delete customer comments from the backend."}</p>
          </div>
          <div className="flex gap-2">
            <Button href="/admin/travel-feed" variant="outline"><Rss size={17} /> Posts</Button>
            <Button variant="outline" onClick={() => void loadComments()} disabled={loading}>
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_120px_120px_auto]" onSubmit={applyFilters}>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search comments, authors, post summaries..."
            />
          </div>
          <input
            inputMode="numeric"
            value={postIdInput}
            onChange={(event) => setPostIdInput(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            placeholder="Post ID"
            aria-label="Filter by post id"
          />
          <input
            inputMode="numeric"
            value={userIdInput}
            onChange={(event) => setUserIdInput(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
            placeholder="User ID"
            aria-label="Filter by user id"
          />
          <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
        </form>

        <div className="mt-3 grid gap-3 md:grid-cols-[160px_160px_150px]">
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>
          <select value={hasParentFilter} onChange={(event) => { setHasParentFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Filter by reply state">
            <option value="">All comments</option>
            <option value="false">Top-level</option>
            <option value="true">Replies</option>
          </select>
          <select value={sort} onChange={(event) => { setSort(event.target.value as AdminTravelFeedCommentListParams["sort"]); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Sort comments">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={includeDeleted} onChange={(event) => { setIncludeDeleted(event.target.checked); setPage(1); }} />
          Include deleted
        </label>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["ID", "Comment", "Author", "Post", "Status", "Type", "Created", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading comments...</td></tr>
              ) : comments.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No travel feed comments found.</td></tr>
              ) : comments.map((comment, index) => (
                <CommentRow
                  key={getTravelFeedCommentId(comment) || `${comment.created_at}-${index}`}
                  comment={comment}
                  onDelete={() => setDeletingComment(comment)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="comments" onPageChange={setPage} />
      </div>

      {deletingComment ? (
        <ConfirmDialog
          title="Delete comment?"
          message={`Delete this comment by ${getTravelFeedCommentAuthor(deletingComment)}? The backend will soft-delete it and update the post comment count.`}
          confirmLabel={saving ? "Deleting..." : "Delete"}
          onCancel={() => {
            if (!saving) setDeletingComment(null);
          }}
          onConfirm={() => void deleteComment()}
        />
      ) : null}
    </>
  );
}

function CommentRow({ comment, onDelete }: { comment: TravelFeedComment; onDelete: () => void }) {
  const commentId = getTravelFeedCommentId(comment);
  const postId = getTravelFeedCommentPostId(comment);
  const content = getTravelFeedCommentContent(comment);
  const isDeleted = comment.status === "deleted" || Boolean(comment.deleted_at);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="p-3 font-bold">#{commentId || "-"}</td>
      <td className="max-w-md p-3">
        <p className="line-clamp-3 text-slate-700">{content || "-"}</p>
      </td>
      <td className="p-3">
        <p className="font-semibold text-slate-700">{getTravelFeedCommentAuthor(comment)}</p>
        {comment.user_id ? <p className="mt-1 text-xs text-slate-500">User #{comment.user_id}</p> : null}
      </td>
      <td className="max-w-64 p-3">
        <p className="line-clamp-2 font-semibold text-slate-700">{getTravelFeedCommentPostTitle(comment)}</p>
        {postId ? <p className="mt-1 text-xs text-slate-500">Post #{postId}</p> : null}
      </td>
      <td className="p-3"><StatusBadge value={comment.status ?? "published"} /></td>
      <td className="p-3 text-slate-600">{comment.parent_comment_id ? `Reply to #${comment.parent_comment_id}` : "Top-level"}</td>
      <td className="p-3 text-slate-600">{comment.created_at ? formatDate(comment.created_at) : "-"}</td>
      <td className="p-3">
        <span className="flex gap-2">
          {postId ? (
            <a
              href={`/travel-feed/${postId}?comment_id=${commentId}#comment-${commentId}`}
              title="Open post"
              aria-label={`View comment ${commentId} in post ${postId}`}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Eye size={16} />
            </a>
          ) : null}
          <button
            type="button"
            title="Delete comment"
            onClick={onDelete}
            disabled={isDeleted}
            className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete comment ${commentId}`}
          >
            <Trash2 size={15} />
          </button>
        </span>
      </td>
    </tr>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors = value === "published"
    ? "bg-emerald-50 text-emerald-700"
    : value === "deleted"
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${colors}`}>{value}</span>;
}

function positiveNumberText(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : "";
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
