export default function stringToHSL (text: string): string {
  let hash = 0
  for (const chr of text + '-') { // Add '-' to do an extra step, because tag ending -1, -2, etc makes hash results too close
    hash = ((hash << 5) - hash) + chr.charCodeAt(0)
    hash |= 0 // Convert to 32bit integer
  }
  return `hsl(${Math.abs(hash) % 360}, 40%, 80%)`
}
