export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export interface NewsData {
  items: NewsItem[];
}
