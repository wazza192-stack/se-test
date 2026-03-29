import type { SeoMeta } from "../data/site";

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  noindex: boolean;
};

export type ResolveSeoInput = {
  title: string;
  description: string;
  seo?: SeoMeta | null;
  canonicalUrl?: string | null;
  canonicalPath?: string | null;
  socialImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noindex?: boolean;
};

export function resolveSeo(input: ResolveSeoInput): ResolvedSeo {
  const seo = input.seo ?? null;
  const title = seo?.metaTitle ?? input.title;
  const description = seo?.metaDescription ?? input.description;

  return {
    title,
    description,
    canonical: seo?.canonicalUrl ?? seo?.canonicalPath ?? input.canonicalUrl ?? input.canonicalPath ?? null,
    ogTitle: seo?.ogTitle ?? input.ogTitle ?? title,
    ogDescription: seo?.ogDescription ?? input.ogDescription ?? description,
    ogImage: seo?.ogImage ?? seo?.socialImage ?? input.ogImage ?? input.socialImage ?? null,
    noindex: seo?.noindex ?? input.noindex ?? false
  };
}
