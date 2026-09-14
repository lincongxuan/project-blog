import { site } from '@/data/site';

export function absoluteUrl(path = '/') {
  return new URL(path, site.url).href;
}

export function getOgImage(image?: string) {
  return absoluteUrl(image || '/og-default.png');
}
