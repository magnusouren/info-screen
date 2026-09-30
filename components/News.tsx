"use client";

import NewsFeed from "./NewsFeed";

export default function News() {
  return (
    <div className="sm:h-full sm:min-h-0">
      <NewsFeed category="latest" title="Siste" />
    </div>
  );
}
