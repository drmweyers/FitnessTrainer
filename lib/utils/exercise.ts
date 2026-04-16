/**
 * Normalise a raw gifUrl value from the database into a fully-qualified path
 * that can be used as an <img> or Next.js <Image> src.
 *
 * Supported input formats:
 *   - null / undefined / empty string  → placeholder SVG
 *   - Full HTTP URL                     → returned as-is
 *   - Absolute path ("/foo.gif")        → returned as-is
 *   - Bare filename ("2gPfomN.gif")     → prefixed with /exerciseGifs/
 */
export function getGifUrl(gifUrl: string | null | undefined): string {
  if (!gifUrl || gifUrl === 'null' || gifUrl === 'undefined') {
    return '/images/exercise-placeholder.svg'
  }
  if (gifUrl.startsWith('http://') || gifUrl.startsWith('https://')) {
    return gifUrl
  }
  if (gifUrl.startsWith('/')) {
    return gifUrl
  }
  return `/exerciseGifs/${gifUrl}`
}
