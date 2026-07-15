"use client";

import axios from "axios";
import { ArrowLeft, MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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
  type TravelFeedPost
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

export default function AdminTravelFeedPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = params.postId;
  const [post, setPost] = useState<TravelFeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const showToast = useToast();

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminTravelFeedService.detailPost(postId);
      if (!result) {
        setPost(null);
        setError("Cannot find this travel feed post from the admin API.");
        return;
      }
      setPost(result);
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
            {post ? <Button variant="outline" onClick={() => setConfirmingDelete(true)} disabled={isDeleted || deleting} className="border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700"><Trash2 size={17} /> Delete</Button> : null}
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
            <div className="min-w-0">
              {photos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {photos.map((photo, index) => (
                    <img key={`${photo}-${index}`} src={resolveBackendAssetUrl(photo)} alt={`${title} photo ${index + 1}`} className="h-64 w-full rounded-lg border border-slate-200 object-cover" />
                  ))}
                </div>
              ) : (
                <div className="grid h-64 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-400">No images</div>
              )}

              <section className="mt-6">
                <h2 className="text-lg font-bold">Content</h2>
                <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-4 leading-7 text-slate-700">{getTravelFeedContent(post) || "-"}</p>
              </section>
            </div>

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
