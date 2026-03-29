/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_CLUB_DIRECTORY_URL?: string;
  readonly PUBLIC_OWNED_IMAGE_HOSTS?: string;
  readonly PUBLIC_OWNED_IMAGE_PREFIXES?: string;
  readonly PUBLIC_MEDIA_BASE_URL?: string;
  readonly PUBLIC_IMAGEKIT_URL_ENDPOINT?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly IMAGEKIT_PRIVATE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
