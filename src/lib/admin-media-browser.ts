import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaLibraryItem, MediaLibraryListResult, MediaUploadTarget } from "./media-storage";
import { getBrowserSupabase } from "./supabase-browser";

async function getAdminAccessToken(supabase: SupabaseClient | null): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase Auth is not configured.");
  }

  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error || !token) {
    throw new Error("Admin session is required.");
  }

  return token;
}

export async function uploadAdminMediaFile(
  options: {
    file: File;
    target: MediaUploadTarget;
  },
  supabase: SupabaseClient | null = getBrowserSupabase()
): Promise<{ objectKey: string; url: string }> {
  const token = await getAdminAccessToken(supabase);
  const formData = new FormData();

  formData.set("file", options.file);
  formData.set("kind", options.target.kind);

  if (options.target.kind === "club") {
    formData.set("clubSlug", options.target.clubSlug);
    formData.set("slot", options.target.slot);
  } else if (options.target.kind === "news") {
    formData.set("slug", options.target.slug);
    if (options.target.publishedAt) {
      formData.set("publishedAt", options.target.publishedAt);
    }
    formData.set("slot", options.target.slot ?? "cover");
  } else {
    formData.set("slug", options.target.slug);
    formData.set("type", options.target.type);
  }

  const response = await fetch("/api/admin/media/upload", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const message = (await response.text().catch(() => "")) || "Unable to upload the image.";
    throw new Error(message);
  }

  const payload = await response.json().catch(() => null);

  if (typeof payload?.url !== "string" || typeof payload?.objectKey !== "string") {
    throw new Error("Upload completed, but the media response was invalid.");
  }

  return payload;
}

export type AdminMediaLibraryCacheEntry = MediaLibraryListResult;

type AdminMediaLibraryPickerOptions = {
  cache: Map<string, AdminMediaLibraryCacheEntry>;
  fieldName: string;
  getCacheKey: () => string;
  getCurrentValue?: () => string | null | undefined;
  getTarget: () => MediaUploadTarget;
  onSelect: (item: MediaLibraryItem) => void;
  pageSize?: number;
  setStatus: (message: string, isError?: boolean) => void;
  supabase?: SupabaseClient | null;
};

function appendMediaTarget(searchParams: URLSearchParams, target: MediaUploadTarget) {
  searchParams.set("kind", target.kind);

  if (target.kind === "club") {
    searchParams.set("clubSlug", target.clubSlug);
    searchParams.set("slot", target.slot);
    return;
  }

  if (target.kind === "news") {
    searchParams.set("slug", target.slug);
    if (target.publishedAt) {
      searchParams.set("publishedAt", target.publishedAt);
    }
    searchParams.set("slot", target.slot ?? "cover");
    return;
  }

  searchParams.set("slug", target.slug);
  searchParams.set("type", target.type);
}

export async function listAdminMediaFiles(
  options: {
    target: MediaUploadTarget;
    limit?: number;
    skip?: number;
  },
  supabase: SupabaseClient | null = getBrowserSupabase()
): Promise<AdminMediaLibraryCacheEntry> {
  const token = await getAdminAccessToken(supabase);
  const searchParams = new URLSearchParams();

  appendMediaTarget(searchParams, options.target);

  if (options.limit) {
    searchParams.set("limit", String(options.limit));
  }

  if (options.skip) {
    searchParams.set("skip", String(options.skip));
  }

  const response = await fetch(`/api/admin/media/list?${searchParams.toString()}`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const message = (await response.text().catch(() => "")) || "Unable to load media library items.";
    throw new Error(message);
  }

  const payload = await response.json().catch(() => null);

  if (!payload || typeof payload !== "object" || !Array.isArray(payload.items)) {
    throw new Error("Media library response was invalid.");
  }

  const items = payload.items.filter((item): item is MediaLibraryItem => {
    return (
      item &&
      typeof item === "object" &&
      typeof item.fileId === "string" &&
      typeof item.name === "string" &&
      typeof item.url === "string"
    );
  });

  const skip = typeof payload.skip === "number" && Number.isFinite(payload.skip) && payload.skip >= 0 ? payload.skip : 0;
  const limit = typeof payload.limit === "number" && Number.isFinite(payload.limit) && payload.limit > 0 ? payload.limit : items.length || 24;
  const hasMore = payload.hasMore === true;
  const nextSkip =
    typeof payload.nextSkip === "number" && Number.isFinite(payload.nextSkip) && payload.nextSkip >= 0
      ? payload.nextSkip
      : hasMore
        ? skip + items.length
        : null;

  return {
    items,
    hasMore,
    limit,
    nextSkip,
    skip
  };
}

function asTrimmedString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normaliseFilterTerm(value: string): string {
  return value.trim().toLowerCase();
}

function matchesFilter(item: MediaLibraryItem, term: string): boolean {
  if (!term) {
    return true;
  }

  const searchContent = [item.name, item.filePath ?? "", item.url].join(" ").toLowerCase();
  return searchContent.includes(term);
}

function mergeMediaLibraryEntries(
  current: AdminMediaLibraryCacheEntry | undefined,
  next: AdminMediaLibraryCacheEntry
): AdminMediaLibraryCacheEntry {
  if (!current) {
    return next;
  }

  const itemsByFileId = new Map<string, MediaLibraryItem>();

  current.items.forEach((item) => {
    itemsByFileId.set(item.fileId, item);
  });

  next.items.forEach((item) => {
    itemsByFileId.set(item.fileId, item);
  });

  return {
    items: Array.from(itemsByFileId.values()),
    hasMore: next.hasMore,
    limit: next.limit,
    nextSkip: next.nextSkip,
    skip: current.skip
  };
}

function createMediaLibraryEmptyState(message: string): HTMLDivElement {
  const emptyState = document.createElement("div");
  emptyState.className = "admin-media-library-empty";
  emptyState.textContent = message;
  return emptyState;
}

function createMediaLibraryItemButton(options: {
  item: MediaLibraryItem;
  isSelected: boolean;
  onSelect: () => void;
}): HTMLButtonElement {
  const { item, isSelected, onSelect } = options;
  const button = document.createElement("button");
  const media = document.createElement("span");
  const copy = document.createElement("span");
  const name = document.createElement("span");

  button.type = "button";
  button.className = "admin-media-library-item";
  button.classList.toggle("is-selected", isSelected);

  media.className = "admin-media-library-item-media";

  if (item.thumbnailUrl) {
    const image = document.createElement("img");
    image.src = item.thumbnailUrl;
    image.alt = "";
    image.loading = "lazy";
    media.appendChild(image);
  }

  copy.className = "admin-media-library-item-copy";
  name.className = "admin-media-library-item-name";
  name.textContent = item.name;
  copy.appendChild(name);

  if (item.filePath) {
    const path = document.createElement("span");
    path.className = "admin-media-library-item-path";
    path.textContent = item.filePath;
    copy.appendChild(path);
  }

  if (isSelected) {
    const badge = document.createElement("span");
    badge.className = "admin-media-library-item-badge";
    badge.textContent = "Current image";
    copy.appendChild(badge);
  }

  button.append(media, copy);
  button.addEventListener("click", onSelect);

  return button;
}

export function wireAdminMediaLibraryPicker(options: AdminMediaLibraryPickerOptions): void {
  const {
    cache,
    fieldName,
    getCacheKey,
    getCurrentValue,
    getTarget,
    onSelect,
    pageSize = 24,
    setStatus,
    supabase = getBrowserSupabase()
  } = options;

  const button = document.querySelector<HTMLButtonElement>(`[data-library-button="${fieldName}"]`);
  const panel = document.querySelector<HTMLElement>(`[data-library-panel="${fieldName}"]`);
  const list = document.querySelector<HTMLElement>(`[data-library-list="${fieldName}"]`);
  const meta = document.querySelector<HTMLElement>(`[data-library-meta="${fieldName}"]`);
  const search = document.querySelector<HTMLInputElement>(`[data-library-search="${fieldName}"]`);
  const loadMore = document.querySelector<HTMLButtonElement>(`[data-library-load-more="${fieldName}"]`);

  if (!button || !panel || !list) {
    return;
  }

  let activeCacheKey: string | null = null;
  let isLoading = false;
  let isLoadingMore = false;

  const setMeta = (message: string) => {
    if (meta) {
      meta.textContent = message;
    }
  };

  const getActiveEntry = (): AdminMediaLibraryCacheEntry | undefined => {
    const cacheKey = activeCacheKey ?? getCacheKey();
    return cache.get(cacheKey);
  };

  const render = () => {
    const entry = getActiveEntry();
    const filterTerm = normaliseFilterTerm(search?.value ?? "");
    const selectedUrl = asTrimmedString(getCurrentValue?.() ?? null);
    const filteredItems = entry?.items.filter((item) => matchesFilter(item, filterTerm)) ?? [];

    panel.hidden = false;
    list.replaceChildren();

    if (search) {
      search.disabled = !entry?.items.length;
    }

    if (loadMore) {
      loadMore.hidden = !entry?.hasMore;
      loadMore.disabled = isLoading || isLoadingMore;
      loadMore.textContent = isLoadingMore ? "Loading more images..." : "Load more images";
    }

    if (!entry?.items.length) {
      list.appendChild(createMediaLibraryEmptyState("No images found in this media folder yet."));
      setMeta("This view stays limited to the current ImageKit folder.");
      return;
    }

    if (!filteredItems.length) {
      list.appendChild(createMediaLibraryEmptyState("No loaded images match this filter."));
      setMeta(`Showing 0 of ${entry.items.length} loaded image${entry.items.length === 1 ? "" : "s"}.`);
      return;
    }

    const fragment = document.createDocumentFragment();

    filteredItems.forEach((item) => {
      fragment.appendChild(
        createMediaLibraryItemButton({
          item,
          isSelected: Boolean(selectedUrl && selectedUrl === item.url),
          onSelect: () => {
            onSelect(item);
            render();
            panel.hidden = true;
            setStatus("Image selected from Media Library.");
          }
        })
      );
    });

    list.appendChild(fragment);

    const itemLabel = `${entry.items.length} loaded image${entry.items.length === 1 ? "" : "s"}`;
    const filterLabel = filterTerm ? `Showing ${filteredItems.length} of ${itemLabel}.` : `Showing ${itemLabel}.`;
    const moreLabel = entry.hasMore ? " Load more to see older images in this folder." : "";
    setMeta(`${filterLabel}${moreLabel}`);
  };

  const loadPage = async (skip: number) => {
    const cacheKey = getCacheKey();
    const page = await listAdminMediaFiles(
      {
        target: getTarget(),
        limit: pageSize,
        skip
      },
      supabase
    );

    const merged = skip > 0 ? mergeMediaLibraryEntries(cache.get(cacheKey), page) : page;
    cache.set(cacheKey, merged);
    activeCacheKey = cacheKey;
    return merged;
  };

  button.addEventListener("click", async () => {
    const cacheKey = getCacheKey();

    if (activeCacheKey !== cacheKey && search) {
      search.value = "";
    }

    activeCacheKey = cacheKey;
    panel.hidden = false;

    const cached = cache.get(cacheKey);

    if (cached) {
      render();
      return;
    }

    isLoading = true;
    button.disabled = true;
    setStatus("Loading media library...");

    try {
      await loadPage(0);
      render();
      setStatus("Media library loaded.");
    } catch (error) {
      panel.hidden = true;
      setStatus(error instanceof Error ? error.message : "Unable to load the media library.", true);
    } finally {
      isLoading = false;
      button.disabled = false;
      if (cache.get(cacheKey)) {
        render();
      }
    }
  });

  search?.addEventListener("input", () => {
    render();
  });

  loadMore?.addEventListener("click", async () => {
    const entry = getActiveEntry();

    if (!entry?.hasMore || isLoading || isLoadingMore) {
      return;
    }

    isLoadingMore = true;
    loadMore.disabled = true;
    setStatus("Loading more images...");

    try {
      await loadPage(entry.nextSkip ?? entry.items.length);
      render();
      setStatus("More images loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load more images.", true);
    } finally {
      isLoadingMore = false;
      render();
    }
  });
}
