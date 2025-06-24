import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy danh sách Pokémon
  const pokeRes = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=10000');
  const pokemons = pokeRes.data.results;
  // Lấy danh sách type
  const typeRes = await axios.get('https://pokeapi.co/api/v2/type');
  const types = typeRes.data.results.filter((t: any) => t.name !== 'unknown' && t.name !== 'shadow');

  const baseUrl = 'https://your-domain.com'; // Thay bằng domain thật khi deploy

  let urls = [
    `<url><loc>${baseUrl}/</loc></url>`
  ];
  urls = urls.concat(
    pokemons.map((p: any) => `<url><loc>${baseUrl}/pokemon/${p.name}</loc></url>`)
  );
  urls = urls.concat(
    types.map((t: any) => `<url><loc>${baseUrl}/type/${t.name}</loc></url>`)
  );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 