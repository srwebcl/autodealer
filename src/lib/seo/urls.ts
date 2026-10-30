import { siteConfig } from "@/config/site";

export function absoluteUrl(path: string, base: string = siteConfig.url): string {
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}
