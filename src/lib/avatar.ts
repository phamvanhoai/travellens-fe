export function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  try {
    const url = new URL(apiUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
}

export function resolveBackendAssetUrl(url?: string) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) {
    return url ?? "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${getApiOrigin()}${path}`;
}

export function withCacheBust(url: string) {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const [baseUrl, hash = ""] = url.split("#");
  const [path, queryString = ""] = baseUrl.split("?");
  const params = new URLSearchParams(queryString);

  params.set("v", String(Date.now()));

  return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

export function getAvatarImageSrc(url?: string, cacheBust = false) {
  const resolvedUrl = resolveBackendAssetUrl(url);
  return cacheBust ? withCacheBust(resolvedUrl) : resolvedUrl;
}
