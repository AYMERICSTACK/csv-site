export type InstagramPost = {
  id: string;
  caption: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  media_type: string;
  thumbnail_url?: string;
};

type InstagramGraphResponse = {
  data?: Array<{
    id: string;
    caption?: string;
    media_url?: string;
    permalink?: string;
    timestamp?: string;
    media_type?: string;
    thumbnail_url?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

export async function getLatestInstagramPosts(
  limit = 3,
): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    throw new Error("Missing Instagram environment variables.");
  }

  const fields = [
    "id",
    "caption",
    "media_url",
    "permalink",
    "timestamp",
    "media_type",
    "thumbnail_url",
  ].join(",");

  const url =
    `https://graph.facebook.com/v23.0/${businessAccountId}/media` +
    `?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data: InstagramGraphResponse = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message ||
        "Failed to fetch Instagram posts from Meta Graph API.",
    );
  }

  return (data.data || []).map((post) => ({
    id: post.id,
    caption: post.caption || "",
    media_url: post.media_url || "",
    permalink: post.permalink || "",
    timestamp: post.timestamp || "",
    media_type: post.media_type || "",
    thumbnail_url: post.thumbnail_url,
  }));
}
