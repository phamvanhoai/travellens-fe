"use client";

import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Copy, ExternalLink, Filter, Flag, Heart, ImagePlus, Loader2, MapPin, MessageCircle, MoreHorizontal, Pencil, Reply, Search, Send, Share2, SlidersHorizontal, Trash2, UserX, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { useToast } from "@/components/common/toast";
import { TravelStoriesBar } from "@/components/travel-stories/travel-stories-bar";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import { images } from "@/lib/data";
import {
  getTravelFeedAuthor,
  getTravelFeedAuthorId,
  getTravelFeedBlockedUserId,
  getTravelFeedCommentCount,
  getTravelFeedCommentAuthor,
  getTravelFeedCommentContent,
  getTravelFeedCommentId,
  getTravelFeedCommentReplies,
  getTravelFeedCommentUserId,
  getTravelFeedContent,
  getTravelFeedDestinationId,
  getTravelFeedDestinationName,
  getTravelFeedLocationId,
  getTravelFeedLikeCount,
  getTravelFeedLocationName,
  getTravelFeedPhotoItems,
  getTravelFeedPhotos,
  getTravelFeedPostId,
  getTravelFeedReportPayload,
  getTravelFeedReportStatus,
  getTravelFeedSharePreviewUrl,
  getTravelFeedTitle,
  isTravelFeedReported,
  isTravelFeedReportPending,
  isTravelFeedLiked,
  adminTravelFeedService,
  travelFeedService,
  withTravelFeedLikeState,
  withTravelFeedReportState,
  withTravelFeedCommentCount,
  type TravelFeedComment,
  type TravelFeedPost,
  type TravelFeedReportPayload,
  type TravelFeedReportReason,
  type TravelFeedSharePlatform,
  type TravelFeedSort
} from "@/services/travel-feed.service";
import { destinationService, getPublicDestinationId } from "@/services/destination.service";
import { getPublicLocationId, locationService } from "@/services/location.service";
import { useAuthStore } from "@/store/use-auth-store";
import { formatDate } from "@/utils/format";

const pageSize = 10;

const sortOptions: Array<{ label: string; value: TravelFeedSort }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Popular", value: "popular" }
];

const reportReasons: Array<{ label: string; value: TravelFeedReportReason }> = [
  { label: "Spam", value: "spam" },
  { label: "Inappropriate content", value: "inappropriate_content" },
  { label: "Harassment", value: "harassment" },
  { label: "False information", value: "false_information" },
  { label: "Scam", value: "scam" },
  { label: "Other", value: "other" }
];

const sharePlatforms: Array<{ label: string; value: TravelFeedSharePlatform; description: string }> = [
  { label: "Facebook", value: "facebook", description: "Open a Facebook share window." },
  { label: "Zalo", value: "zalo", description: "Open a Zalo share link." },
  { label: "Copy link", value: "copy_link", description: "Copy the post link to clipboard." },
  { label: "Other", value: "other", description: "Track a generic share action." }
];

type PlaceSelection = {
  id: number;
  name: string;
  type: "destination" | "location";
};

type LocalReportState = TravelFeedReportPayload & { status: string };

export default function TravelFeedPage() {
  return <TravelFeedContent />;
}

function TravelFeedContent() {
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<TravelFeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TravelFeedSort>("newest");
  const [placeNameInput, setPlaceNameInput] = useState("");
  const [selectedFilterPlace, setSelectedFilterPlace] = useState<PlaceSelection | null>(null);
  const [destinationId, setDestinationId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();
  const [destinationNames, setDestinationNames] = useState<Record<number, string>>({});
  const [locationNames, setLocationNames] = useState<Record<number, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<TravelFeedPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<TravelFeedPost | null>(null);
  const [reportingPost, setReportingPost] = useState<TravelFeedPost | null>(null);
  const [commentingPost, setCommentingPost] = useState<TravelFeedPost | null>(null);
  const [sharingPost, setSharingPost] = useState<TravelFeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [likingPostIds, setLikingPostIds] = useState<Record<number, boolean>>({});
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [reportedPosts, setReportedPosts] = useState<Record<number, LocalReportState>>({});
  const [blockedUserIds, setBlockedUserIds] = useState<Record<number, boolean>>({});
  const [blockingUserIds, setBlockingUserIds] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const currentUserId = getCurrentUserId(user);

  useEffect(() => {
    setReportedPosts(readStoredReportedPosts(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    let active = true;

    async function loadBlockedUsers() {
      if (!hasAuthToken()) {
        setBlockedUserIds({});
        return;
      }

      try {
        const users = await travelFeedService.listBlockedUsers({ page: 1, limit: 100 });
        if (!active) return;
        setBlockedUserIds(Object.fromEntries(users.map((item) => [getTravelFeedBlockedUserId(item), true]).filter(([id]) => Number(id) > 0)));
      } catch (err) {
        console.warn("Failed to load blocked users:", err);
      }
    }

    void loadBlockedUsers();

    return () => {
      active = false;
    };
  }, [currentUserId]);

  useEffect(() => {
    let active = true;

    async function fetchPlaceNames() {
      try {
        const [destinationsResult, locationsResult] = await Promise.all([
          destinationService.list({ limit: 100 }),
          locationService.list()
        ]);

        if (!active) return;

        setDestinationNames(Object.fromEntries(destinationsResult.items.map((destination) => [
          getPublicDestinationId(destination),
          destination.name ?? destination.title ?? `Destination #${getPublicDestinationId(destination)}`
        ]).filter(([id]) => Number(id) > 0)));

        setLocationNames(Object.fromEntries(locationsResult.map((location) => [
          getPublicLocationId(location),
          location.name ?? location.title ?? `Location #${getPublicLocationId(location)}`
        ]).filter(([id]) => Number(id) > 0)));

      } catch (err) {
        console.error("Failed to load travel feed place names:", err);
      }
    }

    void fetchPlaceNames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchFeed() {
      setIsLoading(true);
      setError("");

      try {
        const result = await travelFeedService.list({
          page,
          limit: pageSize,
          search: search || undefined,
          sort,
          destination_id: destinationId,
          location_id: locationId
        });

        if (!active) return;
        setPosts(result.items.filter((post) => !blockedUserIds[getTravelFeedAuthorId(post)]));
        setTotalItems(result.total);
        setPageCount(result.totalPages);
      } catch (err) {
        if (!active) return;
        setPosts([]);
        setTotalItems(0);
        setPageCount(1);
        setError(getTravelFeedError(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void fetchFeed();

    return () => {
      active = false;
    };
  }, [page, search, sort, destinationId, locationId, refreshKey, blockedUserIds]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function applyFilters() {
    setIsApplyingFilters(true);
    setFilterError("");

    try {
      const place = selectedFilterPlace ?? await resolvePlaceSelection(placeNameInput, destinationNames, locationNames);

      setPage(1);
      setDestinationId(place?.type === "destination" ? place.id : undefined);
      setLocationId(place?.type === "location" ? place.id : undefined);

      if (placeNameInput.trim() && !place) {
        setFilterError(`Place "${placeNameInput.trim()}" was not found.`);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setDestinationId(undefined);
    setLocationId(undefined);
    setPlaceNameInput("");
    setSelectedFilterPlace(null);
    setFilterError("");
    setSort("newest");
  }

  function requireCustomerAction(description: string) {
    if (hasAuthToken()) return true;
    showToast({ variant: "error", title: "Login required", description });
    return false;
  }

  async function togglePostLike(post: TravelFeedPost) {
    if (!requireCustomerAction("Please sign in with a customer account to like posts.")) return;

    const postId = getTravelFeedPostId(post);
    if (!postId) {
      setError("This post is missing a valid id from the API response.");
      return;
    }

    const shouldLike = !isTravelFeedLiked(post);
    const previousPost = post;

    setError("");
    setLikingPostIds((current) => ({ ...current, [postId]: true }));
    setPosts((current) => current.map((item) => getTravelFeedPostId(item) === postId ? withTravelFeedLikeState(item, shouldLike) : item));

    try {
      const updatedPost = shouldLike
        ? await travelFeedService.likePost(postId)
        : await travelFeedService.unlikePost(postId);

      setPosts((current) => current.map((item) => {
        if (getTravelFeedPostId(item) !== postId) return item;
        return mergeLikeResponse(item, updatedPost, shouldLike);
      }));
    } catch (err) {
      setPosts((current) => current.map((item) => getTravelFeedPostId(item) === postId ? previousPost : item));
      setError(getLikePostError(err, shouldLike));
    } finally {
      setLikingPostIds((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
    }
  }

  async function submitPostReport(post: TravelFeedPost, payload: TravelFeedReportPayload) {
    if (!requireCustomerAction("Please sign in with a customer account to report posts.")) return;

    const postId = getTravelFeedPostId(post);
    if (!postId) {
      throw new Error("This post is missing a valid id from the API response.");
    }

    const alreadyReported = isPostReported(post, reportedPosts);
    const markReported = (message: { title: string; description: string }) => {
      setReportedPosts((current) => {
        const next = { ...current, [postId]: { ...payload, status: "pending" } };
        writeStoredReportedPosts(currentUserId, next);
        return next;
      });
      setPosts((current) => current.map((item) => getTravelFeedPostId(item) === postId ? withTravelFeedReportState(item, payload) : item));
      showToast({ variant: "success", ...message });
    };

    try {
      if (alreadyReported) {
        await travelFeedService.updatePostReport(postId, payload);
        markReported({ title: "Report updated", description: "Your pending report was updated." });
      } else {
        await travelFeedService.reportPost(postId, payload);
        markReported({ title: "Report submitted", description: "Thank you for helping keep the travel feed safe." });
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        await travelFeedService.updatePostReport(postId, payload);
        markReported({ title: "Report updated", description: "Your pending report was updated." });
        return;
      }

      throw err;
    }
  }

  function updatePostCommentCount(postId: number, delta: number) {
    setPosts((current) => current.map((item) => getTravelFeedPostId(item) === postId ? withTravelFeedCommentCount(item, delta) : item));
    setCommentingPost((current) => current && getTravelFeedPostId(current) === postId ? withTravelFeedCommentCount(current, delta) : current);
  }

  async function deleteOwnPost() {
    if (!deletingPost || deletingPostId) return;
    if (!requireCustomerAction("Please sign in with a customer account to delete this post.")) return;

    const postId = getTravelFeedPostId(deletingPost);
    if (!postId) {
      setError("This post is missing a valid id from the API response.");
      return;
    }

    if (getTravelFeedAuthorId(deletingPost) !== currentUserId) {
      const message = "Only the customer who created this post can delete it.";
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
      setDeletingPost(null);
      return;
    }

    setError("");
    setDeletingPostId(postId);

    try {
      await travelFeedService.deletePost(postId);
      setPosts((current) => current.filter((item) => getTravelFeedPostId(item) !== postId));
      setTotalItems((current) => Math.max(0, current - 1));
      setPageCount((current) => Math.max(1, current));
      setEditingPost((current) => current && getTravelFeedPostId(current) === postId ? null : current);
      setCommentingPost((current) => current && getTravelFeedPostId(current) === postId ? null : current);
      setReportingPost((current) => current && getTravelFeedPostId(current) === postId ? null : current);
      setSharingPost((current) => current && getTravelFeedPostId(current) === postId ? null : current);
      setDeletingPost(null);
      setRefreshKey((value) => value + 1);
      showToast({ variant: "success", title: "Post deleted", description: getTravelFeedTitle(deletingPost) });
    } catch (err) {
      const message = getDeletePostError(err);
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setDeletingPostId(null);
    }
  }

  async function blockPostAuthor(post: TravelFeedPost) {
    if (!requireCustomerAction("Please sign in with a customer account to block users.")) return;

    const authorId = getTravelFeedAuthorId(post);
    if (!authorId) {
      setError("This post is missing a valid author id from the API response.");
      return;
    }

    if (authorId === currentUserId) {
      showToast({ variant: "error", title: "Cannot block yourself", description: "You cannot block your own account." });
      return;
    }

    setBlockingUserIds((current) => ({ ...current, [authorId]: true }));
    setError("");

    try {
      await travelFeedService.blockUser(authorId);
      setBlockedUserIds((current) => ({ ...current, [authorId]: true }));
      setPosts((current) => current.filter((item) => getTravelFeedAuthorId(item) !== authorId));
      setCommentingPost((current) => current && getTravelFeedAuthorId(current) === authorId ? null : current);
      setReportingPost((current) => current && getTravelFeedAuthorId(current) === authorId ? null : current);
      setSharingPost((current) => current && getTravelFeedAuthorId(current) === authorId ? null : current);
      showToast({ variant: "success", title: "User blocked", description: "Their posts are now hidden from your travel feed." });
    } catch (err) {
      const message = getBlockUserError(err);
      setError(message);
      showToast({ variant: "error", title: "Block failed", description: message });
    } finally {
      setBlockingUserIds((current) => {
        const next = { ...current };
        delete next[authorId];
        return next;
      });
    }
  }

  return (
    <>
      <PageHero
        title="Travel Feed"
        subtitle="See public travel posts from other customers, with real-time likes, photos, locations and destinations from the Travel360 API."
        image={images.balloons}
        searchClassName="w-full"
        searchContent={
          <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Discover travel stories</span>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-slate-400"
                  placeholder="Search posts, places or experiences..."
                />
              </span>
            </label>
            <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">
              Explore feed <ChevronRight size={17} />
            </button>
          </form>
        }
      />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <TravelStoriesBar />
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (requireCustomerAction("Please sign in with a customer account to create a post.")) setShowCreatePost(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <ImagePlus size={17} /> Create post
          </button>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-semibold">
            <span className="grid size-8 shrink-0 place-items-center text-slate-400"><Filter size={15} /></span>
            {sortOptions.map((option) => {
              const active = sort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSort(option.value);
                  }}
                  className={`relative isolate h-8 rounded-lg px-3 text-xs font-bold transition-colors ${active ? "text-white" : "text-slate-500 hover:text-brand-600"}`}
                >
                  {active ? <motion.span layoutId="travel-feed-sort-active" className="absolute inset-0 -z-10 rounded-lg bg-brand-600 shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-pressed={showFilters}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${showFilters ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-brand-600 hover:text-brand-600"}`}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          {(search || destinationId || locationId || placeNameInput) ? (
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              Clear all
            </button>
          ) : null}
          <p className="ml-auto text-sm text-slate-500">
            {search ? `Showing feed for "${search}"` : "Showing customer travel feed"}
          </p>
        </div>

        {showFilters ? (
          <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
            <label className="text-sm font-semibold text-slate-600">
              Place
              <PlaceNameInput
                value={placeNameInput}
                onChange={(value) => {
                  setPlaceNameInput(value);
                  setSelectedFilterPlace(null);
                }}
                onSelect={setSelectedFilterPlace}
                destinationNames={destinationNames}
                locationNames={locationNames}
                placeholder="Search destination or location..."
              />
            </label>
            <button type="button" onClick={applyFilters} disabled={isApplyingFilters} className="mt-auto inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isApplyingFilters ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Apply
            </button>
          </div>
        ) : null}

        {filterError ? (
          <div className="mb-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-700">{filterError}</div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
        ) : null}

        {isLoading ? (
          <TravelFeedSkeleton count={3} />
        ) : posts.length === 0 ? (
          <div className="grid h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center">
            <div>
              <p className="text-lg font-bold text-ink">No travel posts found</p>
              <p className="mt-2 text-sm text-slate-500">Try another search, sort order, destination or location.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post, index) => (
              <TravelFeedCard
                key={getTravelFeedPostId(post) || `${post.created_at}-${index}`}
                post={post}
                isLikeBusy={Boolean(likingPostIds[getTravelFeedPostId(post)])}
                onToggleLike={togglePostLike}
                onOpenComments={() => setCommentingPost(post)}
                onShare={() => {
                  if (requireCustomerAction("Please sign in with a customer account to share posts.")) setSharingPost(post);
                }}
                onBlockUser={() => void blockPostAuthor(post)}
                onEdit={() => setEditingPost(post)}
                onDelete={() => setDeletingPost(post)}
                isBlockBusy={Boolean(blockingUserIds[getTravelFeedAuthorId(post)])}
                isDeleteBusy={deletingPostId === getTravelFeedPostId(post)}
                canEditPost={Boolean(currentUserId && getTravelFeedAuthorId(post) === currentUserId)}
                canDeletePost={Boolean(currentUserId && getTravelFeedAuthorId(post) === currentUserId)}
                canReportPost={getTravelFeedAuthorId(post) !== currentUserId}
                canBlockUser={Boolean(getTravelFeedAuthorId(post) && getTravelFeedAuthorId(post) !== currentUserId)}
                onReport={() => {
                  if (!requireCustomerAction("Please sign in with a customer account to report posts.")) return;
                  setError("");
                  if (isPostReported(post, reportedPosts) && !canEditPostReport(post, reportedPosts)) {
                    showToast({ variant: "info", title: "Already reported", description: "This report has already been submitted for review." });
                    return;
                  }
                  setReportingPost(post);
                }}
                reportState={getPostReportState(post, reportedPosts)}
                destinationNames={destinationNames}
                locationNames={locationNames}
              />
            ))}
          </div>
        )}

        {!isLoading && totalItems > 0 ? (
          <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="posts" onPageChange={setPage} />
        ) : null}

        {showCreatePost ? (
          <CreatePostModal
            destinationNames={destinationNames}
            locationNames={locationNames}
            onClose={() => setShowCreatePost(false)}
            onCreated={() => {
              setShowCreatePost(false);
              setPage(1);
              setSort("newest");
              setRefreshKey((value) => value + 1);
            }}
          />
        ) : null}

        {editingPost ? (
          <CreatePostModal
            post={editingPost}
            destinationNames={destinationNames}
            locationNames={locationNames}
            onClose={() => setEditingPost(null)}
            onSaved={(updatedPost) => {
              const postId = getTravelFeedPostId(editingPost);
              setPosts((current) => current.map((item) => getTravelFeedPostId(item) === postId ? mergeUpdatedPost(item, updatedPost) : item));
              setEditingPost(null);
              setRefreshKey((value) => value + 1);
            }}
          />
        ) : null}

        {reportingPost ? (
          <ReportPostModal
            post={reportingPost}
            initialValue={getPostReportPayload(reportingPost, reportedPosts)}
            editing={isPostReported(reportingPost, reportedPosts)}
            onClose={() => setReportingPost(null)}
            onSubmit={async (payload) => {
              await submitPostReport(reportingPost, payload);
              setReportingPost(null);
            }}
          />
        ) : null}

        {commentingPost ? (
          <CommentsModal
            post={commentingPost}
            onClose={() => setCommentingPost(null)}
            onCommentCreated={() => updatePostCommentCount(getTravelFeedPostId(commentingPost), 1)}
            onCommentDeleted={() => updatePostCommentCount(getTravelFeedPostId(commentingPost), -1)}
          />
        ) : null}

        {sharingPost ? (
          <SharePostModal
            post={sharingPost}
            onClose={() => setSharingPost(null)}
          />
        ) : null}

        {deletingPost ? (
          <ConfirmDialog
            title="Delete post?"
            message={`Delete "${getTravelFeedTitle(deletingPost)}"? This post will be removed from the travel feed.`}
            confirmLabel={deletingPostId ? "Deleting..." : "Delete post"}
            onCancel={() => {
              if (!deletingPostId) setDeletingPost(null);
            }}
            onConfirm={() => void deleteOwnPost()}
          />
        ) : null}
      </section>
    </>
  );
}

function CreatePostModal({
  post,
  destinationNames,
  locationNames,
  onClose,
  onCreated,
  onSaved
}: {
  post?: TravelFeedPost;
  destinationNames: Record<number, string>;
  locationNames: Record<number, string>;
  onClose: () => void;
  onCreated?: () => void;
  onSaved?: (post: TravelFeedPost) => void;
}) {
  const isEditing = Boolean(post);
  const initialLocationId = post ? getTravelFeedLocationId(post) : 0;
  const initialDestinationId = post ? getTravelFeedDestinationId(post) : 0;
  const initialPlaceName = post
    ? getTravelFeedLocationName(post) || locationNames[initialLocationId] || getTravelFeedDestinationName(post) || destinationNames[initialDestinationId] || ""
    : "";
  const initialSelectedPlace = post && initialLocationId
    ? { id: initialLocationId, name: initialPlaceName || `Location #${initialLocationId}`, type: "location" as const }
    : post && initialDestinationId
      ? { id: initialDestinationId, name: initialPlaceName || `Destination #${initialDestinationId}`, type: "destination" as const }
      : null;
  const [content, setContent] = useState(post ? getTravelFeedContent(post) : "");
  const [placeName, setPlaceName] = useState(initialPlaceName);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(initialSelectedPlace);
  const visibility: "public" | "private" = post?.visibility === "private" ? "private" : "public";
  const [existingPhotos, setExistingPhotos] = useState(() => post ? getTravelFeedPhotoItems(post) : []);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedContent = content.trim();
    const keepPhotoIds = existingPhotos.map((photo) => photo.id).filter((photoId) => photoId > 0);
    const validationError = getPostFormValidationError({
      content: trimmedContent,
      existingPhotoCount: existingPhotos.length,
      keepPhotoIds,
      newFiles: photos,
      visibility
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const place = placeName.trim()
        ? selectedPlace ?? await resolvePlaceSelection(placeName, destinationNames, locationNames)
        : null;

      if (placeName.trim() && !place) {
        setError(`Place "${placeName.trim()}" was not found.`);
        return;
      }

      const payload = {
        content: trimmedContent,
        destination_id: place?.type === "destination" ? place.id : undefined,
        location_id: place?.type === "location" ? place.id : undefined,
        photos
      };

      if (post) {
        const postId = getTravelFeedPostId(post);
        if (!postId) {
          setError("This post is missing a valid id from the API response.");
          return;
        }

        const updatedPost = await travelFeedService.update(postId, {
          content: trimmedContent,
          destination_id: place?.type === "destination" ? place.id : null,
          location_id: place?.type === "location" ? place.id : null,
          photos,
          keep_photo_ids: keepPhotoIds,
          visibility
        });

        setMessage("");
        onSaved?.(mergeUpdatedPost(post, updatedPost));
        return;
      }

      await travelFeedService.create(payload);

      setContent("");
      setPlaceName("");
      setSelectedPlace(null);
      setPhotos([]);
      setMessage("");
      onCreated?.();
    } catch (err) {
      setError(isEditing ? getUpdatePostError(err) : getCreatePostError(err));
    } finally {
      setIsSaving(false);
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const remainingSlots = Math.max(0, 10 - existingPhotos.length - photos.length);
    if (remainingSlots === 0) {
      setError("Photos is too many. Maximum is 10 total after update.");
      return;
    }
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      setError("Photos has an invalid file. Please upload image files only.");
      return;
    }
    if (imageFiles.length > remainingSlots) {
      setError(`Photos is too many. You can add ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} only. Maximum is 10 total after update (${existingPhotos.length} kept old + ${photos.length} new selected).`);
      return;
    }

    setPhotos((current) => [...current, ...imageFiles]);
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <form onSubmit={submitPost} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{isEditing ? "Edit post" : "Create post"}</h2>
            <p className="mt-1 text-sm text-slate-500">{isEditing ? "Update your travel moment." : "Share your travel moment with other customers."}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={isEditing ? "Close edit post popup" : "Close create post popup"}
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">+</div>
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="travel-feed-content">Post content</label>
              <textarea
                id="travel-feed-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={5000}
                rows={5}
                className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-brand-600"
                placeholder="Share your travel experience..."
              />
              <div className="mt-3">
                <label className="text-sm font-semibold text-slate-600">
                  Place
                  <PlaceNameInput
                    value={placeName}
                    onChange={(value) => {
                      setPlaceName(value);
                      setSelectedPlace(null);
                    }}
                    onSelect={setSelectedPlace}
                    destinationNames={destinationNames}
                    locationNames={locationNames}
                    placeholder="Search destination or location..."
                  />
                </label>
              </div>

              {existingPhotos.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {existingPhotos.map((photo, index) => (
                    <div key={`${photo.url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                      <img src={resolveBackendAssetUrl(photo.url)} alt={`Existing photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/65 text-white"
                        aria-label="Remove existing photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {previewUrls.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                      <img src={url} alt={`Selected photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/65 text-white"
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {error ? <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}
              {message ? <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div> : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600">
                  <ImagePlus size={17} />
                  Add photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      addPhotos(event.target.files);
                      event.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-xs font-semibold text-slate-500">{existingPhotos.length + photos.length}/10 photos</span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Send size={16} />}
                  {isEditing ? "Save changes" : "Create post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function TravelFeedCard({
  post,
  isLikeBusy,
  isBlockBusy,
  isDeleteBusy,
  canEditPost,
  canDeletePost,
  canReportPost,
  canBlockUser,
  onToggleLike,
  onOpenComments,
  onShare,
  onBlockUser,
  onEdit,
  onDelete,
  onReport,
  reportState,
  destinationNames,
  locationNames
}: {
  post: TravelFeedPost;
  isLikeBusy: boolean;
  isBlockBusy: boolean;
  isDeleteBusy: boolean;
  canEditPost: boolean;
  canDeletePost: boolean;
  canReportPost: boolean;
  canBlockUser: boolean;
  onToggleLike: (post: TravelFeedPost) => void;
  onOpenComments: () => void;
  onShare: () => void;
  onBlockUser: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  reportState: LocalReportState | null;
  destinationNames: Record<number, string>;
  locationNames: Record<number, string>;
}) {
  const author = getTravelFeedAuthor(post);
  const photos = getTravelFeedPhotos(post);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const locationName = getTravelFeedLocationName(post) || locationNames[getTravelFeedLocationId(post)] || "";
  const destinationName = getTravelFeedDestinationName(post) || destinationNames[getTravelFeedDestinationId(post)] || "";
  const content = getTravelFeedContent(post);
  const createdAt = post.created_at ? safeFormatDate(post.created_at) : "";
  const hasPostActions = canEditPost || canDeletePost || canBlockUser || canReportPost;

  function runPostAction(action: () => void) {
    setActionMenuOpen(false);
    action();
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        {author.avatar ? (
          <img src={resolveBackendAssetUrl(author.avatar)} alt={author.name} className="size-11 rounded-full object-cover" />
        ) : (
          <div className="grid size-11 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{author.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            {createdAt ? <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{createdAt}</span> : null}
            <span className="inline-flex items-center gap-1"><MapPin size={13} />{formatPlaceName(locationName, destinationName)}</span>
          </div>
        </div>
        {hasPostActions ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setActionMenuOpen((value) => !value)}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600"
              aria-label="Open post actions"
              aria-expanded={actionMenuOpen}
            >
              <MoreHorizontal size={18} />
            </button>

            {actionMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-soft">
                {canEditPost ? (
                  <button
                    type="button"
                    onClick={() => runPostAction(onEdit)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-brand-600"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                ) : null}
                {canDeletePost ? (
                  <button
                    type="button"
                    onClick={() => runPostAction(onDelete)}
                    disabled={isDeleteBusy}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleteBusy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={15} />}
                    Delete
                  </button>
                ) : null}
                {canBlockUser ? (
                  <button
                    type="button"
                    onClick={() => runPostAction(onBlockUser)}
                    disabled={isBlockBusy}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBlockBusy ? <Loader2 className="size-4 animate-spin" /> : <UserX size={15} />}
                    Block
                  </button>
                ) : null}
                {canReportPost ? (
                  <button
                    type="button"
                    onClick={() => runPostAction(onReport)}
                    className={reportState ? "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50" : "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"}
                  >
                    <Flag size={15} fill={reportState ? "currentColor" : "none"} />
                    {reportState ? "Reported" : "Report"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <div className={photos.length === 1 ? "aspect-[16/9] overflow-hidden bg-slate-100" : "grid gap-1 bg-slate-100 sm:grid-cols-2"}>
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setGalleryIndex(index)}
              className={photos.length === 1 ? "h-full cursor-zoom-in overflow-hidden text-left" : "relative aspect-[4/3] cursor-zoom-in overflow-hidden text-left"}
              aria-label={index === 3 && photos.length > 4 ? `Open all ${photos.length} photos` : `Open photo ${index + 1}`}
            >
              <img src={resolveBackendAssetUrl(photo)} alt={`${getTravelFeedTitle(post)} photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 3 && photos.length > 4 ? (
                <div className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-bold text-white">+{photos.length - 4}</div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="p-4">
        <h2 className="text-lg font-bold text-ink">{getTravelFeedTitle(post)}</h2>
        {content ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{content}</p> : null}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => onToggleLike(post)}
            disabled={isLikeBusy}
            className={isTravelFeedLiked(post) ? "inline-flex items-center gap-2 text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60" : "inline-flex items-center gap-2 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"}
            aria-pressed={isTravelFeedLiked(post)}
            aria-label={isTravelFeedLiked(post) ? "Unlike post" : "Like post"}
          >
            {isLikeBusy ? <Loader2 className="size-[17px] animate-spin" /> : <Heart size={17} fill={isTravelFeedLiked(post) ? "currentColor" : "none"} />}
            {getTravelFeedLikeCount(post)} likes
          </button>
          <button
            type="button"
            onClick={onOpenComments}
            className="inline-flex items-center gap-2 transition hover:text-brand-600"
            aria-label="Open post comments"
          >
            <MessageCircle size={17} />
            {getTravelFeedCommentCount(post)} comments
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 transition hover:text-brand-600"
            aria-label="Share post"
          >
            <Share2 size={17} />
            Share
          </button>
        </div>
      </div>
      {galleryIndex !== null ? (
        <PhotoGalleryModal
          title={getTravelFeedTitle(post)}
          photos={photos}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      ) : null}
    </article>
  );
}

function PhotoGalleryModal({
  title,
  photos,
  initialIndex,
  onClose
}: {
  title: string;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const activePhoto = photos[index] ?? photos[0] ?? "";
  const canNavigate = photos.length > 1;

  function previousPhoto() {
    setIndex((current) => (current - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    setIndex((current) => (current + 1) % photos.length);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && canNavigate) previousPhoto();
      if (event.key === "ArrowRight" && canNavigate) nextPhoto();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, onClose, photos.length]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{title}</p>
            <p className="text-xs font-semibold text-slate-500">{index + 1} / {photos.length}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600"
            aria-label="Close photo gallery"
          >
            <X size={17} />
          </button>
        </div>

        <div className="relative grid min-h-0 flex-1 place-items-center bg-slate-950">
          {activePhoto ? (
            <img src={resolveBackendAssetUrl(activePhoto)} alt={`${title} photo ${index + 1}`} className="max-h-[70vh] w-full object-contain" />
          ) : null}

          {canNavigate ? (
            <>
              <button
                type="button"
                onClick={previousPhoto}
                className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-soft transition hover:bg-white"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-soft transition hover:bg-white"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </>
          ) : null}
        </div>

        {photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white p-3">
            {photos.map((photo, photoIndex) => (
              <button
                key={`${photo}-${photoIndex}`}
                type="button"
                onClick={() => setIndex(photoIndex)}
                className={photoIndex === index ? "size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-brand-600" : "size-16 shrink-0 overflow-hidden rounded-lg opacity-70 transition hover:opacity-100"}
                aria-label={`Open photo ${photoIndex + 1}`}
              >
                <img src={resolveBackendAssetUrl(photo)} alt={`${title} thumbnail ${photoIndex + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TravelFeedSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-5" aria-label="Loading travel feed" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
          <div className="flex items-center gap-3 p-4">
            <div className="size-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-52 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="aspect-[16/9] w-full animate-pulse bg-slate-200" />
          <div className="p-4">
            <div className="h-5 w-3/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ReportPostModal({
  post,
  initialValue,
  editing,
  onClose,
  onSubmit
}: {
  post: TravelFeedPost;
  initialValue: TravelFeedReportPayload | null;
  editing: boolean;
  onClose: () => void;
  onSubmit: (payload: TravelFeedReportPayload) => Promise<void>;
}) {
  const showToast = useToast();
  const [reason, setReason] = useState<TravelFeedReportReason>(initialValue?.reason ?? "spam");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 1000) {
      setError("Description must be 1000 characters or fewer.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({
        reason,
        description: trimmedDescription || undefined
      });
    } catch (err) {
      const message = getReportPostError(err);
      setError(message);
      showToast({ variant: "error", title: "Report failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <form onSubmit={submitReport} className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{editing ? "Edit report" : "Report post"}</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{getTravelFeedTitle(post)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close report popup"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block text-sm font-semibold text-slate-700">
            Reason
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as TravelFeedReportReason)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-600"
            >
              {reportReasons.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 1000))}
              rows={5}
              maxLength={1000}
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-brand-600"
              placeholder="Add details for the moderation team..."
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400">{description.length}/1000</span>
            {error ? <span className="text-sm font-semibold text-rose-600">{error}</span> : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Flag size={16} />}
              {editing ? "Update report" : "Submit report"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SharePostModal({
  post,
  onClose
}: {
  post: TravelFeedPost;
  onClose: () => void;
}) {
  const showToast = useToast();
  const [platform, setPlatform] = useState<TravelFeedSharePlatform>("facebook");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  const postId = getTravelFeedPostId(post);

  async function submitShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postId) {
      setError("This post is missing a valid id from the API response.");
      return;
    }

    setIsSharing(true);
    setError("");

    try {
      const result = await travelFeedService.sharePost(postId, { platform });
      const shareUrl = getShareUrl(result, postId);

      if (platform === "copy_link") {
        await copyText(shareUrl);
        showToast({ variant: "success", title: "Link copied", description: "The post link was copied to clipboard." });
      } else if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
        showToast({ variant: "success", title: "Share tracked", description: `Opening ${getSharePlatformLabel(platform)} share.` });
      } else {
        showToast({ variant: "success", title: "Share tracked", description: "The share action was recorded." });
      }

      onClose();
    } catch (err) {
      const message = getSharePostError(err);
      setError(message);
      showToast({ variant: "error", title: "Share failed", description: message });
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <form onSubmit={submitShare} className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Share post</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{getTravelFeedTitle(post)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSharing}
            className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close share popup"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {sharePlatforms.map((item) => (
            <label key={item.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${platform === item.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-200"}`}>
              <input
                type="radio"
                name="share-platform"
                value={item.value}
                checked={platform === item.value}
                onChange={() => setPlatform(item.value)}
                className="size-4"
              />
              <span className="grid size-9 place-items-center rounded-full bg-white text-brand-600">
                {item.value === "copy_link" ? <Copy size={17} /> : item.value === "other" ? <ExternalLink size={17} /> : <Share2 size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">{item.label}</span>
                <span className="block text-sm text-slate-500">{item.description}</span>
              </span>
            </label>
          ))}

          {error ? <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSharing}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 size={16} />}
              Share
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function CommentsModal({
  post,
  onClose,
  onCommentCreated,
  onCommentDeleted
}: {
  post: TravelFeedPost;
  onClose: () => void;
  onCommentCreated: () => void;
  onCommentDeleted: () => void;
}) {
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<TravelFeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [draftText, setDraftText] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const postId = getTravelFeedPostId(post);
  const currentUserId = getCurrentUserId(user);
  const canInteractWithComments = user?.role === "customer";

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setLoading(true);
      setError("");

      try {
        const items = await travelFeedService.listComments(postId, { page: 1, limit: 100 });
        if (active) setComments(buildCommentTree(items));
      } catch (err) {
        if (!active) return;
        if (user?.role === "admin") {
          try {
            const result = await adminTravelFeedService.listComments({
              post_id: postId,
              limit: 100,
              include_deleted: false,
              sort: "newest"
            });
            if (active) setComments(buildCommentTree(result.items));
            return;
          } catch {
            // Show the original public API error below when both sources fail.
          }
        }
        const message = getCommentApiError(err, "Cannot load comments.");
        setError(message);
        showToast({ variant: "error", title: "Load failed", description: message });
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadComments();

    return () => {
      active = false;
    };
  }, [postId, showToast, user?.role]);

  async function submitComment() {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    if (trimmedContent.length > 2000) {
      setError("Comment must be 2000 characters or fewer.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await travelFeedService.createComment(postId, { content: trimmedContent });
      setComments((current) => [normalizeOwnComment(created, trimmedContent, currentUserId, user), ...current]);
      setContent("");
      onCommentCreated();
      showToast({ variant: "success", title: "Comment posted", description: "Your comment was added." });
    } catch (err) {
      const message = getCommentApiError(err, "Cannot post this comment.");
      setError(message);
      showToast({ variant: "error", title: "Comment failed", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(parentId: number) {
    const trimmedContent = draftText.trim();
    if (!trimmedContent || parentId <= 0) return;

    setBusyCommentId(parentId);
    setError("");

    try {
      const created = await travelFeedService.createComment(postId, { content: trimmedContent, parent_comment_id: parentId });
      const reply = normalizeOwnComment(created, trimmedContent, currentUserId, user);
      setComments((current) => addReplyToComments(current, parentId, reply));
      setExpandedCommentIds((current) => ({ ...current, [parentId]: true }));
      setReplyingCommentId(null);
      setDraftText("");
      onCommentCreated();
      showToast({ variant: "success", title: "Reply posted" });
    } catch (err) {
      const message = getCommentApiError(err, "Cannot post this reply.");
      setError(message);
      showToast({ variant: "error", title: "Reply failed", description: message });
    } finally {
      setBusyCommentId(null);
    }
  }

  async function updateComment(commentId: number) {
    const trimmedContent = draftText.trim();
    if (!trimmedContent || commentId <= 0) return;

    setBusyCommentId(commentId);
    setError("");

    try {
      const updated = await travelFeedService.updateComment(commentId, { content: trimmedContent });
      setComments((current) => updateCommentInTree(current, commentId, { ...updated, content: getTravelFeedCommentContent(updated) || trimmedContent }));
      setEditingCommentId(null);
      setDraftText("");
      showToast({ variant: "success", title: "Comment updated" });
    } catch (err) {
      const message = getCommentApiError(err, "Cannot update this comment.");
      setError(message);
      showToast({ variant: "error", title: "Update failed", description: message });
    } finally {
      setBusyCommentId(null);
    }
  }

  async function deleteComment(commentId: number) {
    if (commentId <= 0) return;
    setBusyCommentId(commentId);
    setError("");

    try {
      await travelFeedService.deleteComment(commentId);
      setComments((current) => removeCommentFromTree(current, commentId));
      onCommentDeleted();
      showToast({ variant: "success", title: "Comment deleted" });
    } catch (err) {
      const message = getCommentApiError(err, "Cannot delete this comment.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setBusyCommentId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Comments</h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{getTravelFeedTitle(post)}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600" aria-label="Close comments popup">
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
              <Loader2 className="mr-2 inline size-5 animate-spin text-brand-600" />Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">No comments yet.</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <TravelFeedCommentCard
                  key={getTravelFeedCommentId(comment)}
                  comment={comment}
                  depth={0}
                  parentAuthor=""
                  currentUserId={currentUserId}
                  canInteract={canInteractWithComments}
                  busyCommentId={busyCommentId}
                  editingCommentId={editingCommentId}
                  replyingCommentId={replyingCommentId}
                  expandedCommentIds={expandedCommentIds}
                  draftText={draftText}
                  onDraftChange={setDraftText}
                  onToggleReplies={(id) => setExpandedCommentIds((current) => ({ ...current, [id]: !current[id] }))}
                  onStartReply={(item) => {
                    setReplyingCommentId(getTravelFeedCommentId(item));
                    setEditingCommentId(null);
                    setDraftText("");
                  }}
                  onStartEdit={(item) => {
                    setEditingCommentId(getTravelFeedCommentId(item));
                    setReplyingCommentId(null);
                    setDraftText(getTravelFeedCommentContent(item));
                  }}
                  onCancelDraft={() => {
                    setReplyingCommentId(null);
                    setEditingCommentId(null);
                    setDraftText("");
                  }}
                  onReply={(id) => void submitReply(id)}
                  onUpdate={(id) => void updateComment(id)}
                  onDelete={(id) => void deleteComment(id)}
                />
              ))}
            </div>
          )}
        </div>

        {canInteractWithComments ? (
        <div className="border-t border-slate-100 p-5">
          <label className="sr-only" htmlFor="travel-feed-comment">Add a comment</label>
          <textarea
            id="travel-feed-comment"
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 2000))}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-brand-600"
            placeholder="Write a comment..."
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400">{content.length}/2000</span>
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={submitting || !content.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send size={16} />}
              Post
            </button>
          </div>
          {error ? <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        </div>
        ) : (
          <div className="border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500">
            Sign in with a customer account to write or reply to comments.
          </div>
        )}
      </div>
    </div>
  );
}

function TravelFeedCommentCard({
  comment,
  depth,
  parentAuthor,
  currentUserId,
  canInteract,
  busyCommentId,
  editingCommentId,
  replyingCommentId,
  expandedCommentIds,
  draftText,
  onDraftChange,
  onToggleReplies,
  onStartReply,
  onStartEdit,
  onCancelDraft,
  onReply,
  onUpdate,
  onDelete
}: {
  comment: TravelFeedComment;
  depth: number;
  parentAuthor: string;
  currentUserId: number;
  canInteract: boolean;
  busyCommentId: number | null;
  editingCommentId: number | null;
  replyingCommentId: number | null;
  expandedCommentIds: Record<number, boolean>;
  draftText: string;
  onDraftChange: (value: string) => void;
  onToggleReplies: (id: number) => void;
  onStartReply: (comment: TravelFeedComment) => void;
  onStartEdit: (comment: TravelFeedComment) => void;
  onCancelDraft: () => void;
  onReply: (id: number) => void;
  onUpdate: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const id = getTravelFeedCommentId(comment);
  const isOwner = Boolean(currentUserId && getTravelFeedCommentUserId(comment) === currentUserId);
  const isEditing = editingCommentId === id;
  const isReplying = replyingCommentId === id;
  const busy = busyCommentId === id;
  const replies = getTravelFeedCommentReplies(comment);
  const authorName = getTravelFeedCommentAuthor(comment);
  const repliesExpanded = Boolean(expandedCommentIds[id]);

  return (
    <div className={depth === 0 ? "rounded-lg border border-slate-200 bg-white p-4" : "rounded-lg bg-slate-50 px-4 py-3"}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-bold text-ink">{authorName}</p>
          {depth > 0 && parentAuthor ? (
            <span className="text-xs font-semibold text-slate-500">
              replying to <span className="text-brand-700">{parentAuthor}</span>
            </span>
          ) : null}
        </div>
        {comment.created_at ? <p className="mt-1 text-xs font-semibold text-slate-400">{safeFormatDate(comment.created_at)}</p> : null}
      </div>

      {isEditing ? (
        <CommentDraft value={draftText} busy={busy} submitLabel="Update" onChange={onDraftChange} onCancel={onCancelDraft} onSubmit={() => onUpdate(id)} />
      ) : (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{getTravelFeedCommentContent(comment) || "No content"}</p>
      )}

      {!isEditing ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
          {replies.length > 0 ? (
            <button type="button" onClick={() => onToggleReplies(id)} className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800" aria-expanded={repliesExpanded}>
              {repliesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {repliesExpanded ? "Hide replies" : `View replies (${replies.length})`}
            </button>
          ) : null}
          {canInteract ? (
            <button type="button" onClick={() => onStartReply(comment)} className="inline-flex items-center gap-1 hover:text-brand-700">
              <Reply size={13} />
              Reply
            </button>
          ) : null}
          {canInteract && isOwner ? (
            <>
              <button type="button" onClick={() => onStartEdit(comment)} className="inline-flex items-center gap-1 hover:text-brand-700">
                <Pencil size={13} />
                Edit
              </button>
              <button type="button" onClick={() => onDelete(id)} disabled={busy} className="inline-flex items-center gap-1 hover:text-rose-600 disabled:opacity-50">
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 size={13} />}
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isReplying ? (
        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/45 p-3">
          <p className="mb-2 text-xs font-bold text-brand-700">Replying to {authorName}</p>
          <CommentDraft value={draftText} busy={busy} submitLabel="Reply" onChange={onDraftChange} onCancel={onCancelDraft} onSubmit={() => onReply(id)} />
        </div>
      ) : null}

      {replies.length > 0 && repliesExpanded ? (
        <div className="mt-3 border-l-2 border-slate-200 pl-4">
          <div className="space-y-3">
            {replies.map((reply) => (
              <TravelFeedCommentCard
                key={getTravelFeedCommentId(reply)}
                comment={reply}
                depth={depth + 1}
                parentAuthor={authorName}
                currentUserId={currentUserId}
                canInteract={canInteract}
                busyCommentId={busyCommentId}
                editingCommentId={editingCommentId}
                replyingCommentId={replyingCommentId}
                expandedCommentIds={expandedCommentIds}
                draftText={draftText}
                onDraftChange={onDraftChange}
                onToggleReplies={onToggleReplies}
                onStartReply={onStartReply}
                onStartEdit={onStartEdit}
                onCancelDraft={onCancelDraft}
                onReply={onReply}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
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
        maxLength={2000}
        className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-600"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600 disabled:opacity-60">
          <X size={15} />
          Cancel
        </button>
        <button type="button" onClick={onSubmit} disabled={busy || !value.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function PlaceNameInput({
  value,
  onChange,
  onSelect,
  destinationNames,
  locationNames,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSelection) => void;
  destinationNames: Record<number, string>;
  locationNames: Record<number, string>;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const suggestions = getPlaceSuggestions(destinationNames, locationNames, value);

  return (
    <div className="relative mt-2">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600"
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-12 z-30 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-soft">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(suggestion.name);
                onSelect(suggestion);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
            >
              <MapPin size={16} className="shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">{suggestion.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                {suggestion.type === "destination" ? "Destination" : "Location"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function safeFormatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(value);
}

function formatPlaceName(locationName: string, destinationName: string) {
  if (locationName && destinationName) return `${locationName}, ${destinationName}`;
  return locationName || destinationName || "Unknown place";
}

async function resolvePlaceSelection(
  value: string,
  destinationNames: Record<number, string>,
  locationNames: Record<number, string>
) {
  const name = value.trim();
  if (!name) return null;

  const knownLocationId = findIdByName(locationNames, name);
  if (knownLocationId) {
    return { id: knownLocationId, name: locationNames[knownLocationId], type: "location" as const };
  }

  const knownDestinationId = findIdByName(destinationNames, name);
  if (knownDestinationId) return { id: knownDestinationId, name: destinationNames[knownDestinationId], type: "destination" as const };

  const locations = await locationService.list();
  const locationMatch = locations.find((location) => sameOrIncludes(location.name ?? location.title ?? "", name));
  if (locationMatch) {
    const locationId = getPublicLocationId(locationMatch);
    return { id: locationId, name: locationMatch.name ?? locationMatch.title ?? `Location #${locationId}`, type: "location" as const };
  }

  const result = await destinationService.list({ search: name, limit: 20 });
  const match = result.items.find((destination) => sameOrIncludes(destination.name ?? destination.title ?? "", name)) ?? result.items[0];
  if (!match) return null;

  const destinationId = getPublicDestinationId(match);
  return { id: destinationId, name: match.name ?? match.title ?? `Destination #${destinationId}`, type: "destination" as const };
}

function findIdByName(names: Record<number, string>, name: string) {
  const exact = Object.entries(names).find(([, value]) => normalizeName(value) === normalizeName(name));
  if (exact) return Number(exact[0]);

  const partial = Object.entries(names).find(([, value]) => sameOrIncludes(value, name));
  return partial ? Number(partial[0]) : undefined;
}

function getPlaceSuggestions(
  destinationNames: Record<number, string>,
  locationNames: Record<number, string>,
  query: string
) {
  const normalizedQuery = normalizeName(query);
  const entries = [
    ...Object.entries(locationNames).map(([id, name]) => ({ id: Number(id), name, type: "location" as const })),
    ...Object.entries(destinationNames).map(([id, name]) => ({ id: Number(id), name, type: "destination" as const }))
  ]
    .filter((item) => item.id > 0 && item.name);

  if (!normalizedQuery) return entries.slice(0, 8);

  return entries
    .filter((item) => normalizeName(item.name).includes(normalizedQuery))
    .sort((first, second) => {
      const firstName = normalizeName(first.name);
      const secondName = normalizeName(second.name);
      const firstStarts = firstName.startsWith(normalizedQuery);
      const secondStarts = secondName.startsWith(normalizedQuery);
      if (firstStarts !== secondStarts) return firstStarts ? -1 : 1;
      return first.name.localeCompare(second.name);
    })
    .slice(0, 8);
}

function sameOrIncludes(value: string, query: string) {
  const normalizedValue = normalizeName(value);
  const normalizedQuery = normalizeName(query);
  return normalizedValue === normalizedQuery || normalizedValue.includes(normalizedQuery);
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function mergeLikeResponse(current: TravelFeedPost, response: TravelFeedPost, fallbackLiked: boolean) {
  if (!response || typeof response !== "object") return withTravelFeedLikeState(current, fallbackLiked);

  const hasResponsePost =
    getTravelFeedPostId(response) > 0 ||
    response.like_count !== undefined ||
    response.likes_count !== undefined ||
    response.is_liked !== undefined ||
    response.liked !== undefined ||
    response.has_liked !== undefined ||
    response.liked_by_me !== undefined;

  if (!hasResponsePost) return withTravelFeedLikeState(current, fallbackLiked);

  const responseLiked = response.is_liked ?? response.liked ?? response.has_liked ?? response.liked_by_me ?? fallbackLiked;
  return {
    ...current,
    ...response,
    is_liked: Boolean(responseLiked),
    liked: Boolean(responseLiked),
    has_liked: Boolean(responseLiked),
    liked_by_me: Boolean(responseLiked),
    like_count: response.like_count ?? response.likes_count ?? getTravelFeedLikeCount(current),
    likes_count: response.likes_count ?? response.like_count ?? getTravelFeedLikeCount(current)
  };
}

function mergeUpdatedPost(current: TravelFeedPost, response: TravelFeedPost) {
  if (!response || typeof response !== "object") return current;

  const hasResponsePost =
    getTravelFeedPostId(response) > 0 ||
    response.content !== undefined ||
    response.description !== undefined ||
    response.caption !== undefined ||
    response.photos !== undefined ||
    response.images !== undefined ||
    response.media !== undefined ||
    response.photo_urls !== undefined ||
    response.image_urls !== undefined;

  if (!hasResponsePost) return current;

  return {
    ...current,
    ...response,
    like_count: response.like_count ?? response.likes_count ?? getTravelFeedLikeCount(current),
    likes_count: response.likes_count ?? response.like_count ?? getTravelFeedLikeCount(current),
    comment_count: response.comment_count ?? response.comments_count ?? getTravelFeedCommentCount(current),
    comments_count: response.comments_count ?? response.comment_count ?? getTravelFeedCommentCount(current),
    is_liked: response.is_liked ?? response.liked ?? response.has_liked ?? response.liked_by_me ?? isTravelFeedLiked(current),
    liked: response.liked ?? response.is_liked ?? response.has_liked ?? response.liked_by_me ?? isTravelFeedLiked(current),
    has_liked: response.has_liked ?? response.is_liked ?? response.liked ?? response.liked_by_me ?? isTravelFeedLiked(current),
    liked_by_me: response.liked_by_me ?? response.is_liked ?? response.liked ?? response.has_liked ?? isTravelFeedLiked(current)
  };
}

function getPostReportState(post: TravelFeedPost, reportedPosts: Record<number, LocalReportState>) {
  const postId = getTravelFeedPostId(post);
  const localState = postId ? reportedPosts[postId] : undefined;
  if (localState) return localState;
  if (!isTravelFeedReported(post)) return null;

  return {
    ...(getTravelFeedReportPayload(post) ?? { reason: "other" as TravelFeedReportReason }),
    status: getTravelFeedReportStatus(post) ?? "pending"
  };
}

function getPostReportPayload(post: TravelFeedPost, reportedPosts: Record<number, LocalReportState>) {
  const state = getPostReportState(post, reportedPosts);
  if (!state) return null;

  return {
    reason: state.reason,
    description: state.description
  };
}

function isPostReported(post: TravelFeedPost, reportedPosts: Record<number, LocalReportState>) {
  return Boolean(getPostReportState(post, reportedPosts));
}

function canEditPostReport(post: TravelFeedPost, reportedPosts: Record<number, LocalReportState>) {
  const postId = getTravelFeedPostId(post);
  const localState = postId ? reportedPosts[postId] : undefined;
  if (localState) return localState.status === "pending";
  return isTravelFeedReportPending(post);
}

function getReportedPostsStorageKey(userId: number) {
  return `travel360_reported_posts_${userId || "current"}`;
}

function readStoredReportedPosts(userId: number): Record<number, LocalReportState> {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(localStorage.getItem(getReportedPostsStorageKey(userId)) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([postId, value]) => [Number(postId), normalizeStoredReportState(value)])
        .filter(([postId, value]) => Number(postId) > 0 && Boolean(value))
    ) as Record<number, LocalReportState>;
  } catch {
    return {};
  }
}

function writeStoredReportedPosts(userId: number, value: Record<number, LocalReportState>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getReportedPostsStorageKey(userId), JSON.stringify(value));
}

function normalizeStoredReportState(value: unknown): LocalReportState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<LocalReportState>;
  const reason = record.reason;
  if (!isLocalReportReason(reason)) return null;

  return {
    reason,
    description: typeof record.description === "string" ? record.description : undefined,
    status: typeof record.status === "string" ? record.status : "pending"
  };
}

function isLocalReportReason(value: unknown): value is TravelFeedReportReason {
  return reportReasons.some((item) => item.value === value);
}

function normalizeOwnComment(comment: TravelFeedComment, content: string, currentUserId: number, user: unknown): TravelFeedComment {
  const userRecord = user && typeof user === "object" ? user as { name?: string; email?: string } : {};
  return {
    ...comment,
    content: getTravelFeedCommentContent(comment) || content,
    user_id: getTravelFeedCommentUserId(comment) || currentUserId,
    user_name: comment.user_name ?? comment.customer_name ?? comment.author_name ?? userRecord.name ?? userRecord.email ?? "You"
  };
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

function addReplyToComments(comments: TravelFeedComment[], parentId: number, reply: TravelFeedComment): TravelFeedComment[] {
  return comments.map((comment) => {
    if (getTravelFeedCommentId(comment) === parentId) {
      return { ...comment, replies: [...getTravelFeedCommentReplies(comment), { ...reply, parent_comment_id: parentId }], Replies: undefined };
    }

    const replies = getTravelFeedCommentReplies(comment);
    return replies.length ? { ...comment, replies: addReplyToComments(replies, parentId, reply), Replies: undefined } : comment;
  });
}

function updateCommentInTree(comments: TravelFeedComment[], commentId: number, updated: TravelFeedComment): TravelFeedComment[] {
  return comments.map((comment) => {
    if (getTravelFeedCommentId(comment) === commentId) return { ...comment, ...updated };
    const replies = getTravelFeedCommentReplies(comment);
    return replies.length ? { ...comment, replies: updateCommentInTree(replies, commentId, updated), Replies: undefined } : comment;
  });
}

function removeCommentFromTree(comments: TravelFeedComment[], commentId: number): TravelFeedComment[] {
  return comments
    .filter((comment) => getTravelFeedCommentId(comment) !== commentId)
    .map((comment) => {
      const replies = getTravelFeedCommentReplies(comment);
      return replies.length ? { ...comment, replies: removeCommentFromTree(replies, commentId), Replies: undefined } : comment;
    });
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

function hasAuthToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("travel360_token") ?? localStorage.getItem("token"));
}

function getTravelFeedError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 404) return "Travel feed was not found.";
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? "Cannot load travel feed.";
  }

  return "Cannot load travel feed.";
}

function getLikePostError(error: unknown, triedToLike: boolean) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) return "Please sign in with a customer account to like posts.";
    if (error.response?.status === 403) return "Only customer accounts can like travel posts.";
    if (error.response?.status === 404) return "This travel post was not found.";
  }

  return triedToLike ? "Cannot like this post." : "Cannot unlike this post.";
}

function getReportPostError(error: unknown) {
  if (error instanceof Error && !(error instanceof AxiosError)) return error.message;

  if (error instanceof AxiosError) {
    if (error.response?.status === 400) return "Please select a valid reason and keep the description under 1000 characters.";
    if (error.response?.status === 401) return "Please sign in with a customer account to report posts.";
    if (error.response?.status === 403) return "Only customer accounts can report posts, and you cannot report your own post.";
    if (error.response?.status === 404) return "This travel post or report was not found.";
    if (error.response?.status === 409) return "This report cannot be updated because it may already be reviewed.";
  }

  return "Cannot report this post.";
}

function getShareUrl(result: unknown, postId: number) {
  const record = result && typeof result === "object" ? result as { share_url?: string; shareUrl?: string; url?: string } : {};
  return record.share_url ?? record.shareUrl ?? record.url ?? getFallbackPostShareUrl(postId);
}

function getFallbackPostShareUrl(postId: number) {
  return getTravelFeedSharePreviewUrl(postId);
}

async function copyText(value: string) {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function getSharePlatformLabel(platform: TravelFeedSharePlatform) {
  return sharePlatforms.find((item) => item.value === platform)?.label ?? "share";
}

function getSharePostError(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (error.response?.status === 400) return data?.message ?? "Please select a valid share platform.";
    if (error.response?.status === 401) return "Please sign in with a customer account to share posts.";
    if (error.response?.status === 403) return "Only customer accounts can share travel posts.";
    if (error.response?.status === 404) return "This travel post was not found.";
    return data?.message ?? data?.error ?? "Cannot share this post.";
  }

  return "Cannot share this post.";
}

function getBlockUserError(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (error.response?.status === 400) return data?.message ?? "You cannot block yourself.";
    if (error.response?.status === 401) return "Please sign in with a customer account to block users.";
    if (error.response?.status === 403) return "Only customer accounts can block users.";
    if (error.response?.status === 404) return "This customer was not found.";
    return data?.message ?? data?.error ?? "Cannot block this user.";
  }

  return "Cannot block this user.";
}

function getDeletePostError(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (error.response?.status === 401) return "Please sign in with a customer account to delete this post.";
    if (error.response?.status === 403) return data?.message ?? "Only the customer who created this post can delete it.";
    if (error.response?.status === 404) return data?.message ?? "Travel post was not found.";
    if (error.response?.status === 409) return data?.message ?? "This travel post has already been deleted or cannot be deleted.";
    return data?.message ?? data?.error ?? "Cannot delete travel post.";
  }

  return "Cannot delete travel post.";
}



function getCommentApiError(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (error.response?.status === 400) return data?.message ?? "Please keep your comment under 2000 characters.";
    if (error.response?.status === 401) return "Please sign in with a customer account to comment.";
    if (error.response?.status === 403) return "Only customer accounts can comment, or this comment does not belong to you.";
    if (error.response?.status === 404) return data?.message ?? "Travel post or comment was not found.";
    return data?.message ?? data?.error ?? fallback;
  }

  return fallback;
}

function getCreatePostError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) return "Please check your post content, destination, location or photos.";
    if (error.response?.status === 401) return "Please sign in with a customer account to create a post.";
    if (error.response?.status === 403) return "Only customer accounts can create travel posts.";
    if (error.response?.status === 404) return "Destination or location was not found.";
  }

  return "Cannot create travel post.";
}

function getUpdatePostError(error: unknown) {
  if (error instanceof AxiosError) {
    const serverMessage = getFieldAwareApiMessage(error.response?.data);
    if (serverMessage) return serverMessage;

    if (error.response?.status === 400) return [
      "Please check these fields:",
      "Content must be 5000 characters or fewer.",
      "Photos can be at most 10 total, including kept old photos and newly uploaded photos.",
      "Visibility must be public or private.",
      "Destination and location must be valid ids or empty."
    ].join(" ");
    if (error.response?.status === 401) return "Please sign in with a customer account to update this post.";
    if (error.response?.status === 403) return "Only the customer who created this post can update it.";
    if (error.response?.status === 404) return "Travel post, destination, location or photo was not found.";
    if (error.response?.status === 409) return "This travel post cannot be updated.";
  }

  return "Cannot update travel post.";
}

function getPostFormValidationError({
  content,
  existingPhotoCount,
  keepPhotoIds,
  newFiles,
  visibility
}: {
  content: string;
  existingPhotoCount: number;
  keepPhotoIds: number[];
  newFiles: File[];
  visibility: "public" | "private";
}) {
  const totalPhotoCount = keepPhotoIds.length + newFiles.length;

  if (!content && totalPhotoCount === 0) {
    return "Content or photos is required. Please write content or keep/upload at least one photo.";
  }

  if (content.length > 5000) {
    return `Content is too long. Maximum is 5000 characters, current is ${content.length}.`;
  }

  if (visibility !== "public" && visibility !== "private") {
    return "Visibility is invalid. Please choose public or private.";
  }

  if (existingPhotoCount > 0 && keepPhotoIds.length !== existingPhotoCount) {
    return "Photos cannot be updated because some existing photos are missing photo_id from the API. Please reload the post and try again.";
  }

  if (keepPhotoIds.length > 10) {
    return `Existing photos is too many. You can keep at most 10 old photos, current is ${keepPhotoIds.length}.`;
  }

  if (newFiles.length > 10) {
    return `New photos is too many. You can upload at most 10 new photos, current is ${newFiles.length}.`;
  }

  if (totalPhotoCount > 10) {
    return `Photos is too many. Maximum is 10 total after update, current is ${totalPhotoCount} (${keepPhotoIds.length} kept old + ${newFiles.length} new).`;
  }

  const invalidFile = newFiles.find((file) => !file.type.startsWith("image/"));
  if (invalidFile) {
    return `Photos has an invalid file: "${invalidFile.name}". Please upload image files only.`;
  }

  return "";
}

function getFieldAwareApiMessage(data: unknown) {
  const fieldMessages = collectUpdatePostFieldErrors(data);
  if (fieldMessages.length > 0) return uniqueMessages(fieldMessages).join(" ");

  const messages = uniqueMessages(collectApiErrorMessages(data)
    .map((message) => normalizeUpdatePostErrorMessage(message))
    .filter(Boolean));
  if (messages.length === 0) return "";

  return messages.join(" ");
}

function collectApiErrorMessages(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectApiErrorMessages);
  if (typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const directMessages = [
    record.message,
    record.error,
    record.detail,
    record.details
  ].flatMap(collectApiErrorMessages);

  const fieldMessages = ["errors", "validationErrors", "fields"]
    .flatMap((key) => collectApiFieldMessages(record[key]));

  return [...fieldMessages, ...directMessages];
}

function collectApiFieldMessages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return collectApiErrorMessages(item);
    const record = item as Record<string, unknown>;
    if (typeof record.field === "string") {
      const label = getUpdatePostFieldLabel(record.field);
      const message = firstNonEmptyString(record.message, record.error, record.detail) || "invalid value.";
      return [`${label}: ${normalizeUpdatePostErrorMessage(message) || message}`];
    }
    return collectApiErrorMessages(item);
  });
  if (typeof value !== "object") return collectApiErrorMessages(value);

  return Object.entries(value as Record<string, unknown>).flatMap(([field, message]) => {
    const label = getUpdatePostFieldLabel(field);
    const fieldMessages = collectApiErrorMessages(message);
    if (fieldMessages.length === 0) return [`${label}: invalid value.`];
    return fieldMessages.map((item) => `${label}: ${item}`);
  });
}

function getUpdatePostFieldLabel(field: string) {
  const normalized = field.toLowerCase();
  if (normalized.includes("content")) return "Content";
  if (normalized.includes("destination")) return "Destination";
  if (normalized.includes("location")) return "Location";
  if (normalized.includes("visibility")) return "Visibility";
  if (normalized.includes("keep_photo")) return "Existing photos";
  if (normalized.includes("photo")) return "Photos";
  return field;
}

function collectUpdatePostFieldErrors(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const record = data as Record<string, unknown>;
  const details = record.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  const fields = (details as Record<string, unknown>).fields;
  if (!Array.isArray(fields)) return [];

  return fields.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const fieldError = item as Record<string, unknown>;
    const field = typeof fieldError.field === "string" ? fieldError.field : "";
    const message = firstNonEmptyString(fieldError.message, fieldError.error, fieldError.detail);
    if (!message) return [];

    const normalizedMessage = normalizeUpdatePostErrorMessage(message) || message;
    return field ? [`${getUpdatePostFieldLabel(field)}: ${normalizedMessage}`] : [normalizedMessage];
  });
}

function uniqueMessages(messages: string[]) {
  return Array.from(new Set(messages.map((message) => message.trim()).filter(Boolean)));
}

function firstNonEmptyString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

function normalizeUpdatePostErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower === "validation error" || lower === "validation failed") {
    return "";
  }
  if (lower.includes("content") && (lower.includes("5000") || lower.includes("length") || lower.includes("long"))) {
    return "Content must be 5000 characters or fewer.";
  }
  if ((lower.includes("photos") || lower.includes("photo")) && (lower.includes("10") || lower.includes("max") || lower.includes("many"))) {
    return "Photos can be at most 10 total after update.";
  }
  if (lower.includes("keep_photo_ids")) {
    return "Existing photos is invalid. keep_photo_ids must be a JSON array of existing photo ids, maximum 10.";
  }
  if (lower.includes("visibility")) {
    return "Visibility must be public or private.";
  }
  if (lower.includes("destination")) {
    return "Destination must be a valid destination id or empty.";
  }
  if (lower.includes("location")) {
    return "Location must be a valid location id or empty.";
  }
  return message;
}


