import { NextResponse } from "next/server";
import { getLatestInstagramPosts } from "@/lib/instagram";

export async function GET() {
  try {
    const posts = await getLatestInstagramPosts(3);

    return NextResponse.json(
      {
        success: true,
        posts,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Instagram API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Impossible de récupérer les publications Instagram.",
      },
      { status: 500 },
    );
  }
}
