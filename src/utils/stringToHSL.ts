export function hasher (acc: number, chr: string): number {
  // (| 0) converts to 32bit integer
  return ((acc << 5) - acc + chr.charCodeAt(0)) | 0
}

export default function stringToHSL (text: string): string {
  // '-' adds an extra iteration. Similar tags ending in -1, -2, etc makes hash results too close.
  const hash = [...text + '-'].reduce(hasher, 0)
  return `hsl(${Math.abs(hash) % 360}, 40%, 80%)`
}
