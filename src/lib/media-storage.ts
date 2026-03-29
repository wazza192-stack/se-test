import {
  buildAwardsMediaObjectKey,
  buildClubMediaObjectKey,
  buildNewsMediaObjectKey
} from "./media-paths";

export type MediaBucketLike = {
  put: (
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
      customMetadata?: Record<string, string>;
    }
  ) => Promise<unknown>;
};

type ImageKitUploadResponse = {
  url?: unknown;
  filePath?: unknown;
  message?: unknown;
  help?: unknown;
};

export type MediaUploadTarget =
  | {
      kind: "club";
      clubSlug: string;
      slot: "crest" | "hero" | "christmas" | "play-on-pitch";
    }
  | {
      kind: "news";
      slug: string;
      publishedAt?: string | null;
      slot?: "cover" | "og";
    }
  | {
      kind: "awards";
      slug: string;
      type: "programme" | "page" | "category";
    };

function getPublicMediaBaseUrl(): string | null {
  return typeof import.meta.env.PUBLIC_MEDIA_BASE_URL === "string" && import.meta.env.PUBLIC_MEDIA_BASE_URL.trim()
    ? import.meta.env.PUBLIC_MEDIA_BASE_URL.trim().replace(/\/+$/, "")
    : null;
}

function getImageKitUrlEndpoint(): string | null {
  if (typeof import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT === "string" && import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT.trim()) {
    return import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT.trim().replace(/\/+$/, "");
  }

  return getPublicMediaBaseUrl();
}

function getImageKitPrivateKey(): string | null {
  return typeof import.meta.env.IMAGEKIT_PRIVATE_KEY === "string" && import.meta.env.IMAGEKIT_PRIVATE_KEY.trim()
    ? import.meta.env.IMAGEKIT_PRIVATE_KEY.trim()
    : null;
}

function getImageKitErrorMessage(payload: ImageKitUploadResponse | null): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (Array.isArray(payload.message)) {
    const joined = payload.message.filter((item): item is string => typeof item === "string" && item.trim()).join(", ");
    return joined || null;
  }

  if (typeof payload.help === "string" && payload.help.trim()) {
    return payload.help.trim();
  }

  return null;
}

export function isMediaUploadConfigured(bucket?: MediaBucketLike | null): boolean {
  return Boolean(getImageKitPrivateKey() || bucket);
}

export function buildMediaObjectKey(target: MediaUploadTarget, fileName: string): string {
  if (target.kind === "club") {
    return buildClubMediaObjectKey({
      clubSlug: target.clubSlug,
      slot: target.slot,
      fileName
    });
  }

  if (target.kind === "news") {
    const slot = target.slot === "og" ? "og" : "cover";
    const baseKey = buildNewsMediaObjectKey({
      slug: target.slug,
      fileName,
      publishedAt: target.publishedAt
    });

    return slot === "cover" ? baseKey : baseKey.replace(/cover(\.[a-z0-9]+)$/i, `og$1`);
  }

  return buildAwardsMediaObjectKey({
    slug: target.slug,
    fileName,
    type: target.type
  });
}

export function buildPublicMediaUrl(objectKey: string, baseUrl = getPublicMediaBaseUrl()): string | null {
  if (!baseUrl) {
    return null;
  }

  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}

export async function uploadMediaFile(options: {
  bucket?: MediaBucketLike | null;
  file: File;
  target: MediaUploadTarget;
  uploadedBy?: string | null;
}): Promise<{ objectKey: string; url: string }> {
  const { bucket, file, target, uploadedBy } = options;

  if (!(file instanceof File) || !file.size) {
    throw new Error("An image file is required.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be 10MB or smaller.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  const objectKey = buildMediaObjectKey(target, file.name);
  const imageKitPrivateKey = getImageKitPrivateKey();

  if (imageKitPrivateKey) {
    const fileName = objectKey.split("/").at(-1) ?? file.name;
    const folder = `/${objectKey.split("/").slice(0, -1).join("/")}`;
    const uploadBody = new FormData();

    uploadBody.set("file", file);
    uploadBody.set("fileName", fileName);
    uploadBody.set("folder", folder);
    uploadBody.set("useUniqueFileName", "false");
    uploadBody.set("overwriteFile", "true");
    uploadBody.set("tags", ["stadium-experience", target.kind].join(","));

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${imageKitPrivateKey}:`)}`
      },
      body: uploadBody
    });

    const payload = await response.json().catch(() => null) as ImageKitUploadResponse | null;

    if (!response.ok) {
      throw new Error(getImageKitErrorMessage(payload) ?? "ImageKit upload failed.");
    }

    const urlEndpoint = getImageKitUrlEndpoint();
    const uploadedUrl =
      typeof payload?.url === "string" && payload.url
        ? payload.url
        : (urlEndpoint ? buildPublicMediaUrl(objectKey, urlEndpoint) : null);

    if (!uploadedUrl) {
      throw new Error("ImageKit upload completed, but no public URL was returned.");
    }

    return {
      objectKey,
      url: uploadedUrl
    };
  }

  const url = buildPublicMediaUrl(objectKey);

  if (!bucket) {
    throw new Error("No media upload provider is configured.");
  }

  if (!url) {
    throw new Error("PUBLIC_MEDIA_BASE_URL is not configured.");
  }

  await bucket.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || undefined
    },
    customMetadata: {
      uploadedBy: uploadedBy ?? "unknown",
      sourceFileName: file.name,
      targetKind: target.kind
    }
  });

  return {
    objectKey,
    url
  };
}
