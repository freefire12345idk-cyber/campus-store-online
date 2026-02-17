// Custom image loader for CDN optimization
export default function myImageLoader({ src, width, quality }) {
  return `https://vercel.com/api/v1/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
