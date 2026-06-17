export type NewsSource = "vg" | "nrk" | "tv2";

export interface NewsItem {
  title: string;
  url: string;
  source: NewsSource;
  publishedAt?: string;
}

export interface NewsData {
  items: NewsItem[];
}
