import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SSPortal/1.0 RSS Reader',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 300 }, // 5分キャッシュ
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch RSS: ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('RSS fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}
