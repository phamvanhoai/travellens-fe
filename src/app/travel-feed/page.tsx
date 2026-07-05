"use client";

import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { CalendarDays, Filter, Heart, ImagePlus, Loader2, MapPin, MessageCircle, Search, Send, SlidersHorizontal, X } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import {
  getTravelFeedAuthor,
  getTravelFeedCommentCount,
  getTravelFeedContent,
  getTravelFeedDestinationId,
  getTravelFeedDestinationName,
  getTravelFeedLocationId,
  getTravelFeedLikeCount,
  getTravelFeedLocationName,
  getTravelFeedPhotos,
  getTravelFeedPostId,
  getTravelFeedTitle,
  isTravelFeedLiked,
  travelFeedService,
  type TravelFeedPost,
  type TravelFeedSort
} from "@/services/travel-feed.service";
import { destinationService, getPublicDestinationId } from "@/services/destination.service";
import { getPublicLocationId, locationService } from "@/services/location.service";
import { formatDate } from "@/utils/format";

const pageSize = 10;

const sortOptions: Array<{ label: string; value: TravelFeedSort }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Popular", value: "popular" }
];

type PlaceSelection = {
  id: number;
  name: string;
  type: "destination" | "location";
};

export default function TravelFeedPage() {
  return (
    <AuthGuard allowedRoles={["customer"]}>
      <TravelFeedContent />
    </AuthGuard>
  );
}

function TravelFeedContent() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

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
        setPosts(result.items);
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
  }, [page, search, sort, destinationId, locationId, refreshKey]);

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

  return (
    <>
      <PageHero
        title="Travel Feed"
        subtitle="See public travel posts from other customers, with real-time likes, photos, locations and destinations from the Travel360 API."
        image={images.balloons}
        searchContent={
          <form onSubmit={submitSearch} className="rounded-lg bg-white p-3 text-ink shadow-soft">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="rounded-lg border border-slate-100 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold text-slate-500">Search feed</span>
                <span className="flex items-center gap-2">
                  <Search size={16} className="text-brand-600" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-slate-400"
                    placeholder="Search posts, places, experiences..."
                  />
                </span>
              </label>
              <button type="submit" className="inline-flex h-full min-h-14 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
                <Search size={17} /> Search
              </button>
            </div>
          </form>
        }
      />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreatePost(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <ImagePlus size={17} /> Create post
          </button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Filter size={16} />
            <select
              value={sort}
              onChange={(event) => {
                setPage(1);
                setSort(event.target.value as TravelFeedSort);
              }}
              className="bg-transparent outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600"
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
          <div className="grid h-72 place-items-center rounded-lg border border-slate-100 bg-white">
            <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Loader2 className="size-5 animate-spin text-brand-600" />
              Loading travel feed
            </div>
          </div>
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
      </section>
    </>
  );
}

function CreatePostModal({
  destinationNames,
  locationNames,
  onClose,
  onCreated
}: {
  destinationNames: Record<number, string>;
  locationNames: Record<number, string>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
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
    if (!trimmedContent && photos.length === 0) {
      setError("Please write something or add at least one photo.");
      return;
    }

    if (trimmedContent.length > 5000) {
      setError("Post content must be 5000 characters or fewer.");
      return;
    }

    setIsCreating(true);

    try {
      const place = placeName.trim()
        ? selectedPlace ?? await resolvePlaceSelection(placeName, destinationNames, locationNames)
        : null;

      if (placeName.trim() && !place) {
        setError(`Place "${placeName.trim()}" was not found.`);
        return;
      }

      await travelFeedService.create({
        content: trimmedContent,
        destination_id: place?.type === "destination" ? place.id : undefined,
        location_id: place?.type === "location" ? place.id : undefined,
        photos
      });

      setContent("");
      setPlaceName("");
      setSelectedPlace(null);
      setPhotos([]);
      setMessage("");
      onCreated();
    } catch (err) {
      setError(getCreatePostError(err));
    } finally {
      setIsCreating(false);
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    setPhotos((current) => [...current, ...imageFiles].slice(0, 10));
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <form onSubmit={submitPost} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Create post</h2>
            <p className="mt-1 text-sm text-slate-500">Share your travel moment with other customers.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create post popup"
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
                <span className="text-xs font-semibold text-slate-500">{photos.length}/10 photos</span>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Send size={16} />}
                  Create post
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
  destinationNames,
  locationNames
}: {
  post: TravelFeedPost;
  destinationNames: Record<number, string>;
  locationNames: Record<number, string>;
}) {
  const author = getTravelFeedAuthor(post);
  const photos = getTravelFeedPhotos(post);
  const locationName = getTravelFeedLocationName(post) || locationNames[getTravelFeedLocationId(post)] || "";
  const destinationName = getTravelFeedDestinationName(post) || destinationNames[getTravelFeedDestinationId(post)] || "";
  const content = getTravelFeedContent(post);
  const createdAt = post.created_at ? safeFormatDate(post.created_at) : "";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        {author.avatar ? (
          <img src={author.avatar} alt={author.name} className="size-11 rounded-full object-cover" />
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
      </div>

      {photos.length > 0 ? (
        <div className={photos.length === 1 ? "aspect-[16/9] overflow-hidden bg-slate-100" : "grid gap-1 bg-slate-100 sm:grid-cols-2"}>
          {photos.slice(0, 4).map((photo, index) => (
            <div key={`${photo}-${index}`} className={photos.length === 1 ? "h-full" : "relative aspect-[4/3] overflow-hidden"}>
              <img src={photo} alt={`${getTravelFeedTitle(post)} photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 3 && photos.length > 4 ? (
                <div className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-bold text-white">+{photos.length - 4}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="p-4">
        <h2 className="text-lg font-bold text-ink">{getTravelFeedTitle(post)}</h2>
        {content ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{content}</p> : null}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
          <span className={isTravelFeedLiked(post) ? "inline-flex items-center gap-2 text-rose-600" : "inline-flex items-center gap-2"}>
            <Heart size={17} fill={isTravelFeedLiked(post) ? "currentColor" : "none"} />
            {getTravelFeedLikeCount(post)} likes
          </span>
          <span className="inline-flex items-center gap-2">
            <MessageCircle size={17} />
            {getTravelFeedCommentCount(post)} comments
          </span>
        </div>
      </div>
    </article>
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

function getTravelFeedError(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) return "Please sign in with a customer account to view the travel feed.";
    if (error.response?.status === 403) return "Only customer accounts can view the travel feed.";
  }

  return "Cannot load travel feed.";
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
