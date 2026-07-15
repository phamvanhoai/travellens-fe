"use client";

import axios from "axios";
import { Eye, Loader2, MessageSquareText, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import {
  adminTravelFeedService,
  getTravelFeedAuthor,
  getTravelFeedCommentCount,
  getTravelFeedContent,
  getTravelFeedDestinationName,
  getTravelFeedLikeCount,
  getTravelFeedLocationName,
  getTravelFeedPhotos,
  getTravelFeedPostId,
  getTravelFeedReportCount,
  getTravelFeedShareCount,
  getTravelFeedTitle,
  type AdminTravelFeedListParams,
  type TravelFeedPost
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

const pageSize = 10;

export default function AdminTravelFeedPage() {
  const [posts, setPosts] = useState<TravelFeedPost[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [sort, setSort] = useState<AdminTravelFeedListParams["sort"]>("newest");
  const [hasReports, setHasReports] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<TravelFeedPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showToast = useToast();

  const params = useMemo<AdminTravelFeedListParams>(() => ({
    page,
    limit: pageSize,
    search: query || undefined,
    status: statusFilter ? statusFilter as AdminTravelFeedListParams["status"] : undefined,
    visibility: visibilityFilter ? visibilityFilter as AdminTravelFeedListParams["visibility"] : undefined,
    has_reports: hasReports || undefined,
    include_deleted: includeDeleted || undefined,
    sort
  }), [hasReports, includeDeleted, page, query, sort, statusFilter, visibilityFilter]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminTravelFeedService.listPosts(params);
      setPosts(result.items);
      setTotalItems(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      const message = getApiError(err, "Cannot load travel feed posts from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [params, showToast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function deletePost() {
    if (!deletingPost) return;

    const postId = getTravelFeedPostId(deletingPost);
    if (!postId) {
      setError("This post is missing a valid id from the API response.");
      setDeletingPost(null);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminTravelFeedService.deletePost(postId);
      showToast({ variant: "success", title: "Post deleted", description: getTravelFeedTitle(deletingPost) });
      setDeletingPost(null);
      await loadPosts();
    } catch (err) {
      const message = getApiError(err, "Cannot delete this travel feed post.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Travel Feed Posts</h1>
            <p className="mt-1 text-sm text-slate-500">View and delete customer travel posts from the backend.</p>
          </div>
          <div className="flex gap-2">
            <Button href="/admin/travel-feed/comments" variant="outline"><MessageSquareText size={17} /> Comments</Button>
            <Button variant="outline" onClick={() => void loadPosts()} disabled={loading}>
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_140px]">
          <form
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(searchInput.trim());
              setPage(1);
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 size-5 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
                placeholder="Search posts, authors, places..."
              />
            </div>
            <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
          </form>

          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>

          <select value={visibilityFilter} onChange={(event) => { setVisibilityFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Filter by visibility">
            <option value="">All visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          <select value={sort} onChange={(event) => { setSort(event.target.value as AdminTravelFeedListParams["sort"]); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" aria-label="Sort posts">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Popular</option>
            <option value="reported">Reported</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={hasReports} onChange={(event) => { setHasReports(event.target.checked); setPage(1); }} />
            Has reports
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={includeDeleted} onChange={(event) => { setIncludeDeleted(event.target.checked); setPage(1); }} />
            Include deleted
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["ID", "Post", "Author", "Place", "Status", "Engagement", "Created", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading posts...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No travel feed posts found.</td></tr>
              ) : posts.map((post, index) => (
                <PostRow
                  key={getTravelFeedPostId(post) || `${post.created_at}-${index}`}
                  post={post}
                  onDelete={() => setDeletingPost(post)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="posts" onPageChange={setPage} />
      </div>

      {deletingPost ? (
        <ConfirmDialog
          title="Delete post?"
          message={`Delete "${getTravelFeedTitle(deletingPost)}"? The backend will soft-delete this travel feed post for audit history.`}
          confirmLabel={saving ? "Deleting..." : "Delete"}
          onCancel={() => {
            if (!saving) setDeletingPost(null);
          }}
          onConfirm={() => void deletePost()}
        />
      ) : null}
    </>
  );
}

function PostRow({ post, onDelete }: { post: TravelFeedPost; onDelete: () => void }) {
  const postId = getTravelFeedPostId(post);
  const title = getTravelFeedTitle(post);
  const content = getTravelFeedContent(post);
  const author = getTravelFeedAuthor(post);
  const photo = getTravelFeedPhotos(post)[0];
  const place = [getTravelFeedDestinationName(post), getTravelFeedLocationName(post)].filter(Boolean).join(" / ");
  const isDeleted = post.status === "deleted" || Boolean(post.deleted_at);

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="p-3 font-bold">#{postId || "-"}</td>
      <td className="max-w-sm p-3">
        <div className="flex gap-3">
          {photo ? <img src={resolveBackendAssetUrl(photo)} alt={title} className="size-16 rounded-lg object-cover" /> : <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">No image</div>}
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold text-ink">{title}</p>
            <p className="mt-1 line-clamp-2 text-slate-500">{content || "-"}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <p className="font-semibold text-slate-700">{author.name}</p>
      </td>
      <td className="max-w-56 p-3 text-slate-600">{place || "-"}</td>
      <td className="p-3">
        <div className="flex flex-col items-start gap-2">
          <StatusBadge value={post.status ?? "published"} />
          {post.visibility ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600">{post.visibility}</span> : null}
        </div>
      </td>
      <td className="p-3 text-slate-600">
        <div className="grid gap-1">
          <span>{getTravelFeedLikeCount(post)} likes</span>
          <span>{getTravelFeedCommentCount(post)} comments</span>
          <span>{getTravelFeedShareCount(post)} shares</span>
          <span className={getTravelFeedReportCount(post) > 0 ? "font-semibold text-rose-600" : ""}>{getTravelFeedReportCount(post)} reports</span>
        </div>
      </td>
      <td className="p-3 text-slate-600">{post.created_at ? formatDate(post.created_at) : "-"}</td>
      <td className="p-3">
        <span className="flex gap-2">
          {postId ? (
            <a
              href={`/travel-feed/${postId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open post"
              aria-label={`View ${title}`}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Eye size={16} />
            </a>
          ) : null}
          {postId ? (
            <a
              href={`/admin/travel-feed/comments?post_id=${postId}`}
              title="View post comments"
              aria-label={`View comments for ${title}`}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              <MessageSquareText size={16} />
            </a>
          ) : null}
          <button
            type="button"
            title="Delete post"
            onClick={onDelete}
            disabled={isDeleted}
            className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete ${title}`}
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
      : value === "hidden"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${colors}`}>{value}</span>;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
