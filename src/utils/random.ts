export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pickUniqueNumbers(count: number, maxExclusive: number) {
  const values = Array.from({ length: maxExclusive }, (_, index) => index)

  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = randomInt(0, index)
    ;[values[index], values[target]] = [values[target], values[index]]
  }

  return values.slice(0, count)
}

export function getDisplayDuration(length: number) {
  return Math.max(2000, length * 1000)
}
