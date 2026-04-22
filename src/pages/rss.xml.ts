import data from '../../public/data.json';

export async function GET() {
  const livePosts = (data.blogPosts || [])
    .filter((p: any) => p.body?.trim().length > 10)
    .sort((a: any, b: any) => b.id - a.id);

  const items = livePosts.map((post: any) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://bharcode.com/blog/${post.id}</link>
      <guid>https://bharcode.com/blog/${post.id}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.id).toUTCString()}</pubDate>
    </item>
  `).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bharcode</title>
    <link>https://bharcode.com</link>
    <description>Building passive income from code. Singapore CS student documenting the journey.</description>
    <language>en</language>
    <atom:link href="https://bharcode.com/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
