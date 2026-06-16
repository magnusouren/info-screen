export type NewsSource = "vg" | "nrk";

export interface NewsItem {
  title: string;
  url: string;
  summary?: string;
  imageUrl?: string;
  canFetchFull: boolean;
}

export interface NewsData {
  items: NewsItem[];
  source: NewsSource;
}

export interface FullArticle {
  title: string;
  lead?: string;
  body: string;
  author?: string;
  published?: string;
  mainImage?: string;
  summary?: string[];
  url: string;
}
