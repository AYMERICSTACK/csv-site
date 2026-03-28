"use client";

import FacebookFeed from "@/components/FacebookFeed";

export default function FacebookFeedClient({ pageUrl }: { pageUrl: string }) {
  return <FacebookFeed pageUrl={pageUrl} />;
}
