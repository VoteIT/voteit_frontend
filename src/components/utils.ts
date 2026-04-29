/**
 * Ensure value is within bounds.
 * Default between 0 and 100.
 */
export function withinBounds(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Helper to make focus point centered in container
 * @param position Percentage position in positioned dimension
 * @param c1 positioned dimension for container
 * @param c2 other dimension for container
 * @param i1 positioned dimension for image
 * @param i2 other dimension for image
 */
function getPositioned(
  position: number,
  c1: number,
  c2: number,
  i1: number,
  i2: number
) {
  const scale = c2 / i2
  const partVisible = c1 / (i1 * scale)
  return withinBounds((position - partVisible / 2) / (1 - partVisible))
}

type Position = { x: number; y: number }

export function getImageRelativePosition(
  pos: Position,
  width: number,
  height: number,
  src: string
) {
  return new Promise<Position>((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const aspectRatio = width / height
      const imgAspectRatio = img.width / img.height
      // Image is higher than container - position vertically
      if (aspectRatio > imgAspectRatio)
        resolve({
          x: 0.5,
          y: getPositioned(pos.y, height, width, img.height, img.width)
        })
      // Image is wider than container - position horizontically
      else
        resolve({
          x: getPositioned(pos.x, width, height, img.width, img.height),
          y: 0.5
        })
    }
    img.src = src
  })
}
