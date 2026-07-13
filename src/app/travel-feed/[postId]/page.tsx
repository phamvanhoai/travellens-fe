"use client";

import { AxiosError } from "axios";
import { ArrowLeft, Heart, Loader2, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import {
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
  getTravelFeedShareCount,
  getTravelFeedTitle,
  adminTravelFeedService,
  travelFeedService,
  type TravelFeedComment,
  type TravelFeedPost
} from "@/services/travel-feed.service";
import { formatDate } from "@/utils/format";

export default function TravelFeedPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const searchParams = useSearchParams();
  const postId = params.postId;
  const highlightedCommentId = Number(searchParams.get("comment_id") ?? 0);
  const [post, setPost] = useState<TravelFeedPost | null>(null);
  const [comments, setComments] = useState<TravelFeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setError("");

      try {
        const [postResult, commentResult] = await Promise.all([
          travelFeedService.detailPost(postId),
          loadPostComments(postId)
        ]);

        if (!active) return;

        if (!postResult) {
          setPost(null);
          setComments([]);
          setError("This travel post was not found.");
          return;
        }

        setPost(postResult);
        setComments(commentResult);
      } catch (err) {
        if (!active) return;
        setPost(null);
        setComments([]);
        setError(getTravelFeedDetailError(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPost();

    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    if (!highlightedCommentId || loading) return;

    const target = document.getElementById(`comment-${highlightedCommentId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedCommentId, loading, comments]);

  return (
    <section className="bg-mist px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Button href="/travel-feed" variant="ghost" className="mb-4 h-9 px-0 hover:bg-transparent">
          <ArrowLeft size={17} /> Back to Travel Feed
        </Button>

        {loading ? (
          <div className="grid min-h-[420px] place-items-center rounded-lg border border-slate-200 bg-white">
            <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Loader2 className="size-5 animate-spin text-brand-600" />
              Loading post
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-100 bg-white p-8 text-center">
            <p className="text-lg font-bold text-rose-700">{error}</p>
            <Button href="/travel-feed" className="mt-5">Open Travel Feed</Button>
          </div>
        ) : post ? (
          <PostDetail post={post} comments={comments} highlightedCommentId={highlightedCommentId} />
        ) : null}
      </div>
    </section>
  );
}

function PostDetail({ post, comments, highlightedCommentId }: { post: TravelFeedPost; comments: TravelFeedComment[]; highlightedCommentId: number }) {
  const author = getTravelFeedAuthor(post);
  const title = getTravelFeedTitle(post);
  const content = getTravelFeedContent(post);
  const photos = getTravelFeedPhotos(post);
  const place = formatPlaceName(getTravelFeedLocationName(post), getTravelFeedDestinationName(post));

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-3">
          {author.avatar ? (
            <img src={resolveBackendAssetUrl(author.avatar)} alt={author.name} className="size-11 rounded-full object-cover" />
          ) : (
            <div className="grid size-11 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-ink">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
              <span>{author.name}</span>
              {post.created_at ? <span>{safeFormatDate(post.created_at)}</span> : null}
              {place ? <span className="inline-flex items-center gap-1"><MapPin size={13} /> {place}</span> : null}
            </div>
          </div>
        </div>

        {content ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-700">{content}</p> : null}
      </div>

      {photos.length > 0 ? (
        <div className={photos.length === 1 ? "grid" : "grid gap-1 sm:grid-cols-2"}>
          {photos.map((photo, index) => (
            <img
              key={`${photo}-${index}`}
              src={resolveBackendAssetUrl(photo)}
              alt={`${title} photo ${index + 1}`}
              className={photos.length === 1 ? "max-h-[620px] w-full object-cover" : "h-80 w-full object-cover"}
            />
          ))}
        </div>
      ) : null}

      <div className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2"><Heart size={16} /> {getTravelFeedLikeCount(post)} likes</span>
          <span className="inline-flex items-center gap-2"><MessageCircle size={16} /> {getTravelFeedCommentCount(post) || comments.length} comments</span>
          <span className="inline-flex items-center gap-2"><Share2 size={16} /> {getTravelFeedShareCount(post)} shares</span>
        </div>

        <section className="pt-4">
          <h2 className="text-sm font-bold text-ink">Comments</h2>
          <div className="mt-3 grid gap-3">
            {comments.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No comments yet.</p>
            ) : comments.map((comment, index) => <CommentItem key={getTravelFeedCommentId(comment) || `${comment.created_at}-${index}`} comment={comment} highlightedCommentId={highlightedCommentId} />)}
          </div>
        </section>
      </div>
    </article>
  );
}

function CommentItem({ comment, highlightedCommentId }: { comment: TravelFeedComment; highlightedCommentId: number }) {
  const author = getTravelFeedCommentAuthor(comment);
  const content = getTravelFeedCommentContent(comment);
  const replies = getTravelFeedCommentReplies(comment);
  const commentId = getTravelFeedCommentId(comment);
  const highlighted = commentId > 0 && commentId === highlightedCommentId;

  return (
    <div id={commentId ? `comment-${commentId}` : undefined} className={highlighted ? "scroll-mt-28 rounded-lg bg-amber-50 p-2 ring-2 ring-amber-300" : "scroll-mt-28"}>
      <div className={comment.parent_comment_id ? "ml-8 flex gap-3" : "flex gap-3"}>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {author.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-800">{author}</p>
            {comment.created_at ? <span className="text-xs text-slate-400">{safeFormatDate(comment.created_at)}</span> : null}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{content || "-"}</p>
        </div>
      </div>

      {replies.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {replies.map((reply, index) => <CommentItem key={getTravelFeedCommentId(reply) || `${reply.created_at}-${index}`} comment={reply} highlightedCommentId={highlightedCommentId} />)}
        </div>
      ) : null}
    </div>
  );
}

async function loadPostComments(postId: string) {
  try {
    return await travelFeedService.listComments(postId, { page: 1, limit: 100 });
  } catch {
    const result = await adminTravelFeedService.listComments({
      post_id: Number(postId),
      limit: 100,
      include_deleted: false,
      sort: "newest"
    });
    return buildCommentTree(result.items);
  }
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
    if (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!;
      parent.replies = [...getTravelFeedCommentReplies(parent), comment];
      parent.Replies = undefined;
      return;
    }

    roots.push(comment);
  });

  return roots;
}

function formatPlaceName(locationName: string, destinationName: string) {
  if (locationName && destinationName) return `${locationName}, ${destinationName}`;
  return locationName || destinationName;
}

function safeFormatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(value);
}

function getTravelFeedDetailError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) return "This travel post was not found.";
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Cannot load this travel post.";
  }

  return "Cannot load this travel post.";
}
