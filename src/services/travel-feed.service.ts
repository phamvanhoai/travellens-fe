import { api } from "@/services/api";

export type TravelFeedSort = "newest" | "oldest" | "popular";
export type AdminTravelFeedSort = TravelFeedSort | "reported";
export type TravelFeedReportReason = "spam" | "inappropriate_content" | "harassment" | "false_information" | "scam" | "other";
export type TravelFeedReportStatus = "pending" | "reviewed" | "resolved" | "rejected" | "action_taken" | string;
export type TravelFeedSharePlatform = "facebook" | "zalo" | "copy_link" | "other";
export type TravelFeedPostStatus = "draft" | "published" | "hidden" | "deleted" | string;
export type TravelFeedPostVisibility = "public" | "private" | string;
export type TravelFeedCommentStatus = "published" | "hidden" | "deleted" | string;

export type TravelFeedReport = {
  reason?: TravelFeedReportReason | string | null;
  description?: string | null;
  status?: TravelFeedReportStatus | null;
};

export type TravelFeedAuthor = {
  user_id?: number;
  id?: number;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
};

export type TravelFeedPlace = {
  travel_destination_id?: number;
  destination_id?: number;
  location_id?: number;
  id?: number;
  name?: string | null;
  title?: string | null;
};

export type TravelFeedPost = {
  post_id?: number;
  travel_post_id?: number;
  feed_id?: number;
  id?: number;
  user_id?: number;
  title?: string | null;
  caption?: string | null;
  content?: string | null;
  description?: string | null;
  photos?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  images?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  media?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  photo_urls?: string[];
  image_urls?: string[];
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  location_id?: number;
  destination_id?: number;
  travel_destination_id?: number;
  location_name?: string | null;
  destination_name?: string | null;
  travel_destination_name?: string | null;
  location?: TravelFeedPlace | null;
  Location?: TravelFeedPlace | null;
  destination?: TravelFeedPlace | null;
  travel_destination?: TravelFeedPlace | null;
  TravelDestination?: TravelFeedPlace | null;
  author?: TravelFeedAuthor | null;
  user?: TravelFeedAuthor | null;
  User?: TravelFeedAuthor | null;
  author_name?: string | null;
  user_name?: string | null;
  likes_count?: number | string | null;
  like_count?: number | string | null;
  comments_count?: number | string | null;
  comment_count?: number | string | null;
  is_liked?: boolean | null;
  liked?: boolean | null;
  has_liked?: boolean | null;
  liked_by_me?: boolean | null;
  is_reported?: boolean | null;
  reported?: boolean | null;
  has_reported?: boolean | null;
  reported_by_me?: boolean | null;
  report_status?: TravelFeedReportStatus | null;
  status?: TravelFeedPostStatus | null;
  visibility?: TravelFeedPostVisibility | null;
  share_count?: number | string | null;
  shares_count?: number | string | null;
  report_count?: number | string | null;
  reports_count?: number | string | null;
  my_report?: TravelFeedReport | null;
  report?: TravelFeedReport | null;
  report_summary?: {
    total?: number | string | null;
    pending?: number | string | null;
    resolved?: number | string | null;
    dismissed?: number | string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type TravelFeedListParams = {
  page?: number;
  limit?: number;
  search?: string;
  destination_id?: number;
  location_id?: number;
  user_id?: number;
  sort?: TravelFeedSort;
};

export type AdminTravelFeedListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "published" | "hidden" | "deleted";
  visibility?: "public" | "private";
  destination_id?: number;
  location_id?: number;
  user_id?: number;
  has_reports?: boolean;
  include_deleted?: boolean;
  sort?: AdminTravelFeedSort;
};

export type AdminTravelFeedCommentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  post_id?: number;
  user_id?: number;
  status?: "published" | "hidden" | "deleted";
  has_parent?: boolean;
  include_deleted?: boolean;
  sort?: "newest" | "oldest";
};

export type CreateTravelFeedPostPayload = {
  content: string;
  destination_id?: number;
  location_id?: number;
  photos?: File[];
};

export type TravelFeedReportPayload = {
  reason: TravelFeedReportReason;
  description?: string;
};

export type TravelFeedComment = {
  comment_id?: number;
  post_comment_id?: number;
  travel_post_comment_id?: number;
  id?: number;
  post_id?: number;
  travel_post_id?: number;
  user_id?: number;
  parent_comment_id?: number | null;
  content?: string | null;
  comment?: string | null;
  status?: TravelFeedCommentStatus | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  author_name?: string | null;
  user_name?: string | null;
  customer_name?: string | null;
  author?: TravelFeedAuthor | null;
  user?: TravelFeedAuthor | null;
  User?: TravelFeedAuthor | null;
  post?: TravelFeedPost | null;
  travel_post?: TravelFeedPost | null;
  TravelPost?: TravelFeedPost | null;
  post_title?: string | null;
  post_content?: string | null;
  replies?: TravelFeedComment[];
  Replies?: TravelFeedComment[];
};

export type TravelFeedCommentPayload = {
  content: string;
  parent_comment_id?: number;
};

export type TravelFeedSharePayload = {
  platform: TravelFeedSharePlatform;
};

export type TravelFeedBlockStatus = {
  blocked_by_me?: boolean;
  blockedByMe?: boolean;
  has_blocked?: boolean;
  blocked_me?: boolean;
  blockedMe?: boolean;
};

export type TravelFeedBlockedUser = {
  user_id?: number;
  id?: number;
  blocked_user_id?: number;
  blockedUserId?: number;
  name?: string | null;
  email?: string | null;
  user?: TravelFeedAuthor | null;
  blocked_user?: TravelFeedAuthor | null;
  blockedUser?: TravelFeedAuthor | null;
};

export type TravelFeedShareResult = {
  share_url?: string;
  shareUrl?: string;
  url?: string;
  platform?: TravelFeedSharePlatform | string;
};

export type TravelFeedListResult = {
  items: TravelFeedPost[];
  total: number;
  totalPages: number;
};

export type TravelFeedCommentListResult = {
  items: TravelFeedComment[];
  total: number;
  totalPages: number;
};

function unwrapList(value: unknown): TravelFeedListResult {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  const dataRecord = isRecord(data) ? data : {};
  const listSource = Array.isArray(data)
    ? data
    : dataRecord.items ?? dataRecord.posts ?? dataRecord.feed ?? dataRecord.rows ?? dataRecord.results ?? dataRecord.data;
  const items = Array.isArray(listSource) ? listSource as TravelFeedPost[] : [];
  const pagination = (body.pagination ?? dataRecord.pagination ?? dataRecord.meta) as Record<string, unknown> | undefined;
  const total = Number(pagination?.total ?? pagination?.totalItems ?? dataRecord.total ?? items.length);
  const limit = Number(pagination?.limit ?? pagination?.pageSize ?? Math.max(items.length, 1));
  const totalPages = Number(pagination?.totalPages ?? pagination?.pageCount ?? Math.max(1, Math.ceil(total / limit)));

  return { items, total, totalPages };
}

function unwrapPost(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  if (isRecord(data) && "post" in data) return data.post as TravelFeedPost;
  if (isRecord(data) && "travel_post" in data) return data.travel_post as TravelFeedPost;
  return data as TravelFeedPost;
}

function unwrapCommentList(value: unknown) {
  return unwrapCommentListResult(value).items;
}

function unwrapCommentListResult(value: unknown): TravelFeedCommentListResult {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  const dataRecord = isRecord(data) ? data : {};
  const listSource = Array.isArray(data)
    ? data
    : dataRecord.comments ?? dataRecord.items ?? dataRecord.rows ?? dataRecord.results ?? dataRecord.data;
  const items = Array.isArray(listSource) ? listSource as TravelFeedComment[] : [];
  const pagination = (body.pagination ?? dataRecord.pagination ?? dataRecord.meta) as Record<string, unknown> | undefined;
  const total = Number(pagination?.total ?? pagination?.totalItems ?? dataRecord.total ?? items.length);
  const limit = Number(pagination?.limit ?? pagination?.pageSize ?? Math.max(items.length, 1));
  const totalPages = Number(pagination?.totalPages ?? pagination?.pageCount ?? Math.max(1, Math.ceil(total / limit)));

  return { items, total, totalPages };
}

function unwrapComment(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  if (isRecord(data) && "comment" in data) return data.comment as TravelFeedComment;
  return data as TravelFeedComment;
}

function unwrapShareResult(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  if (isRecord(data) && "share" in data) return data.share as TravelFeedShareResult;
  return data as TravelFeedShareResult;
}

function unwrapBlockedUsers(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  const dataRecord = isRecord(data) ? data : {};
  const listSource = Array.isArray(data)
    ? data
    : dataRecord.users ?? dataRecord.blocked_users ?? dataRecord.items ?? dataRecord.rows ?? dataRecord.results ?? dataRecord.data;

  return Array.isArray(listSource) ? listSource as TravelFeedBlockedUser[] : [];
}

function unwrapBlockStatus(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  return data as TravelFeedBlockStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function firstString(...values: Array<unknown>) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

function readPhotoUrl(value: unknown) {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  return firstString(value.url, value.image_url, value.photo_url, value.path);
}

export function getTravelFeedPostId(post: TravelFeedPost) {
  return post.post_id ?? post.travel_post_id ?? post.feed_id ?? post.id ?? 0;
}

export function getTravelFeedTitle(post: TravelFeedPost) {
  return firstString(post.title, post.caption) || "Travel moment";
}

export function getTravelFeedContent(post: TravelFeedPost) {
  return firstString(post.content, post.description, post.caption);
}

export function getTravelFeedPhotos(post: TravelFeedPost) {
  const candidates = [
    ...(post.photos ?? []),
    ...(post.images ?? []),
    ...(post.media ?? []),
    ...(post.photo_urls ?? []),
    ...(post.image_urls ?? []),
    post.thumbnail_url,
    post.thumbnail,
    post.image_url,
    post.image
  ];

  return candidates.map(readPhotoUrl).filter(Boolean);
}

export function getTravelFeedAuthor(post: TravelFeedPost) {
  const author = post.author ?? post.user ?? post.User;
  return {
    name: firstString(post.author_name, post.user_name, author?.name, author?.email) || "Travel360 traveler",
    avatar: firstString(author?.avatar_url, author?.avatar)
  };
}

export function getTravelFeedAuthorId(post: TravelFeedPost) {
  const author = post.author ?? post.user ?? post.User;
  return Number(post.user_id ?? author?.user_id ?? author?.id ?? 0);
}

export function getTravelFeedLocationName(post: TravelFeedPost) {
  return firstString(post.location_name, post.location?.name, post.Location?.name, post.location?.title, post.Location?.title);
}

export function getTravelFeedDestinationName(post: TravelFeedPost) {
  return firstString(
    post.destination_name,
    post.travel_destination_name,
    post.destination?.name,
    post.travel_destination?.name,
    post.TravelDestination?.name,
    post.destination?.title,
    post.travel_destination?.title,
    post.TravelDestination?.title
  );
}

export function getTravelFeedLocationId(post: TravelFeedPost) {
  return post.location_id ?? post.location?.location_id ?? post.Location?.location_id ?? post.location?.id ?? post.Location?.id ?? 0;
}

export function getTravelFeedDestinationId(post: TravelFeedPost) {
  return post.destination_id
    ?? post.travel_destination_id
    ?? post.destination?.travel_destination_id
    ?? post.travel_destination?.travel_destination_id
    ?? post.TravelDestination?.travel_destination_id
    ?? post.destination?.destination_id
    ?? post.travel_destination?.destination_id
    ?? post.TravelDestination?.destination_id
    ?? post.destination?.id
    ?? post.travel_destination?.id
    ?? post.TravelDestination?.id
    ?? 0;
}

export function getTravelFeedLikeCount(post: TravelFeedPost) {
  return Number(post.likes_count ?? post.like_count ?? 0);
}

export function getTravelFeedCommentCount(post: TravelFeedPost) {
  return Number(post.comments_count ?? post.comment_count ?? 0);
}

export function getTravelFeedShareCount(post: TravelFeedPost) {
  return Number(post.shares_count ?? post.share_count ?? 0);
}

export function getTravelFeedReportCount(post: TravelFeedPost) {
  return Number(post.reports_count ?? post.report_count ?? post.report_summary?.total ?? 0);
}

export function withTravelFeedCommentCount(post: TravelFeedPost, delta: number) {
  const nextCount = Math.max(0, getTravelFeedCommentCount(post) + delta);
  return {
    ...post,
    comment_count: nextCount,
    comments_count: nextCount
  };
}

export function getTravelFeedCommentId(comment: TravelFeedComment) {
  return Number(comment.comment_id ?? comment.post_comment_id ?? comment.travel_post_comment_id ?? comment.id ?? 0);
}

export function getTravelFeedCommentUserId(comment: TravelFeedComment) {
  return Number(comment.user_id ?? comment.user?.user_id ?? comment.user?.id ?? comment.User?.user_id ?? comment.User?.id ?? 0);
}

export function getTravelFeedCommentContent(comment: TravelFeedComment) {
  return firstString(comment.content, comment.comment);
}

export function getTravelFeedCommentAuthor(comment: TravelFeedComment) {
  const author = comment.author ?? comment.user ?? comment.User;
  return firstString(comment.author_name, comment.user_name, comment.customer_name, author?.name, author?.email) || "Traveler";
}

export function getTravelFeedCommentPostId(comment: TravelFeedComment) {
  const post = comment.post ?? comment.travel_post ?? comment.TravelPost;
  return Number(comment.post_id ?? comment.travel_post_id ?? post?.post_id ?? post?.travel_post_id ?? post?.id ?? 0);
}

export function getTravelFeedCommentPostTitle(comment: TravelFeedComment) {
  const post = comment.post ?? comment.travel_post ?? comment.TravelPost;
  return firstString(comment.post_title, post?.title, post?.caption, comment.post_content, post?.content) || `Post #${getTravelFeedCommentPostId(comment) || "-"}`;
}

export function getTravelFeedCommentReplies(comment: TravelFeedComment) {
  return [...(comment.replies ?? []), ...(comment.Replies ?? [])];
}

export function getTravelFeedSharePreviewUrl(postId: number | string) {
  return api.getUri({ url: `/travel-feed/${postId}/share-preview` });
}

export function getTravelFeedBlockedUserId(item: TravelFeedBlockedUser) {
  const user = item.blocked_user ?? item.blockedUser ?? item.user;
  return Number(item.blocked_user_id ?? item.blockedUserId ?? item.user_id ?? item.id ?? user?.user_id ?? user?.id ?? 0);
}

export function getTravelFeedBlockedUserName(item: TravelFeedBlockedUser) {
  const user = item.blocked_user ?? item.blockedUser ?? item.user;
  return firstString(item.name, user?.name, item.email, user?.email) || `User #${getTravelFeedBlockedUserId(item)}`;
}

export function isTravelFeedLiked(post: TravelFeedPost) {
  return Boolean(post.is_liked ?? post.liked ?? post.has_liked ?? post.liked_by_me);
}

export function withTravelFeedLikeState(post: TravelFeedPost, liked: boolean) {
  const currentCount = getTravelFeedLikeCount(post);
  const wasLiked = isTravelFeedLiked(post);
  const nextCount = Math.max(0, currentCount + (liked === wasLiked ? 0 : liked ? 1 : -1));

  return {
    ...post,
    is_liked: liked,
    liked,
    has_liked: liked,
    liked_by_me: liked,
    like_count: nextCount,
    likes_count: nextCount
  };
}

export function isTravelFeedReported(post: TravelFeedPost) {
  return Boolean(post.is_reported ?? post.reported ?? post.has_reported ?? post.reported_by_me ?? post.my_report ?? post.report);
}

export function getTravelFeedReportStatus(post: TravelFeedPost) {
  return post.report_status ?? post.my_report?.status ?? post.report?.status ?? null;
}

export function getTravelFeedReportPayload(post: TravelFeedPost): TravelFeedReportPayload | null {
  const report = post.my_report ?? post.report;
  const reason = report?.reason;
  if (!isTravelFeedReportReason(reason)) return null;

  return {
    reason,
    description: report?.description?.trim() || undefined
  };
}

export function isTravelFeedReportPending(post: TravelFeedPost) {
  const status = getTravelFeedReportStatus(post);
  return !status || status === "pending";
}

export function withTravelFeedReportState(post: TravelFeedPost, payload: TravelFeedReportPayload, status: TravelFeedReportStatus = "pending") {
  return {
    ...post,
    is_reported: true,
    reported: true,
    has_reported: true,
    reported_by_me: true,
    report_status: status,
    my_report: {
      ...(post.my_report ?? post.report ?? {}),
      ...payload,
      status
    }
  };
}

function isTravelFeedReportReason(value: unknown): value is TravelFeedReportReason {
  return value === "spam" ||
    value === "inappropriate_content" ||
    value === "harassment" ||
    value === "false_information" ||
    value === "scam" ||
    value === "other";
}

export const travelFeedService = {
  async list(params: TravelFeedListParams = {}) {
    const response = await api.get("/travel-feed", { params });
    return unwrapList(response.data);
  },
  async detailPost(postId: number | string) {
    const searchResult = await this.list({ search: String(postId), limit: 100 });
    const searchMatch = searchResult.items.find((post) => String(getTravelFeedPostId(post)) === String(postId));
    if (searchMatch) return searchMatch;

    const newestResult = await this.list({ limit: 100, sort: "newest" });
    return newestResult.items.find((post) => String(getTravelFeedPostId(post)) === String(postId)) ?? null;
  },
  async create(payload: CreateTravelFeedPostPayload) {
    const hasPhotos = Boolean(payload.photos?.length);

    if (!hasPhotos) {
      const response = await api.post("/travel-feed", {
        content: payload.content,
        destination_id: payload.destination_id,
        location_id: payload.location_id
      });
      return unwrapPost(response.data);
    }

    const formData = new FormData();
    formData.append("content", payload.content);
    if (payload.destination_id) formData.append("destination_id", String(payload.destination_id));
    if (payload.location_id) formData.append("location_id", String(payload.location_id));
    payload.photos?.forEach((photo) => formData.append("photos", photo));

    const response = await api.post("/travel-feed", formData);
    return unwrapPost(response.data);
  },
  async likePost(postId: number | string) {
    const response = await api.post(`/travel-feed/${postId}/like`);
    return unwrapPost(response.data);
  },
  async unlikePost(postId: number | string) {
    const response = await api.delete(`/travel-feed/${postId}/like`);
    return unwrapPost(response.data);
  },
  async reportPost(postId: number | string, payload: TravelFeedReportPayload) {
    const response = await api.post(`/travel-feed/${postId}/reports`, payload);
    return response.data;
  },
  async updatePostReport(postId: number | string, payload: TravelFeedReportPayload) {
    const response = await api.patch(`/travel-feed/${postId}/report`, payload);
    return response.data;
  },
  async listComments(postId: number | string, params: { page?: number; limit?: number } = {}) {
    const response = await api.get(`/travel-feed/${postId}/comments`, { params });
    return unwrapCommentList(response.data);
  },
  async createComment(postId: number | string, payload: TravelFeedCommentPayload) {
    const response = await api.post(`/travel-feed/${postId}/comments`, payload);
    return unwrapComment(response.data);
  },
  async updateComment(commentId: number | string, payload: Pick<TravelFeedCommentPayload, "content">) {
    const response = await api.patch(`/travel-feed/comments/${commentId}`, payload);
    return unwrapComment(response.data);
  },
  async deleteComment(commentId: number | string) {
    const response = await api.delete(`/travel-feed/comments/${commentId}`);
    return response.data;
  },
  async sharePost(postId: number | string, payload: TravelFeedSharePayload) {
    const response = await api.post(`/travel-feed/${postId}/share`, payload);
    return unwrapShareResult(response.data);
  },
  async listBlockedUsers(params: { page?: number; limit?: number } = {}) {
    const response = await api.get("/travel-feed/blocked-users", { params });
    return unwrapBlockedUsers(response.data);
  },
  async blockUser(userId: number | string) {
    const response = await api.post(`/travel-feed/users/${userId}/block`);
    return response.data;
  },
  async unblockUser(userId: number | string) {
    const response = await api.delete(`/travel-feed/users/${userId}/block`);
    return response.data;
  },
  async getBlockStatus(userId: number | string) {
    const response = await api.get(`/travel-feed/users/${userId}/block-status`);
    return unwrapBlockStatus(response.data);
  }
};

export const adminTravelFeedService = {
  async listPosts(params: AdminTravelFeedListParams = {}) {
    const response = await api.get("/admin/travel-feed", { params });
    return unwrapList(response.data);
  },
  async detailPost(postId: number | string) {
    const result = await this.listPosts({ search: String(postId), include_deleted: true, limit: 100 });
    return result.items.find((post) => String(getTravelFeedPostId(post)) === String(postId)) ?? null;
  },
  async deletePost(postId: number | string) {
    const response = await api.delete(`/admin/travel-feed/${postId}`);
    return response.data;
  },
  async listComments(params: AdminTravelFeedCommentListParams = {}) {
    const response = await api.get("/admin/travel-feed/comments", { params });
    return unwrapCommentListResult(response.data);
  },
  async deleteComment(commentId: number | string) {
    const response = await api.delete(`/admin/travel-feed/comments/${commentId}`);
    return response.data;
  }
};
