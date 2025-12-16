import functions from '../utils/builtInFunctions'

export function getSuggestions(
  context: Record<string, any>,
  currentWord: string,
  namespace?: string,
) {
  if (!currentWord) return []
  const parts = currentWord.split('.')
  let obj = context
  for (let i = 0; i < parts.length - 1; i++) {
    let part = parts[i]
    if (i === 0 && part === '' && namespace) part = namespace
    if (Object.prototype.hasOwnProperty.call(obj, part)) obj = obj[part]
    else return []
  }
  const lastPart = parts[parts.length - 1]
  const suggestions = []
  for (const v of Object.keys(obj))
    if (v.startsWith(lastPart) && v !== lastPart) suggestions.push(v)
  for (const f of Object.keys(functions))
    if (f.startsWith(currentWord) && f !== currentWord) suggestions.push(f)
  return suggestions
}

export function insert(text: string, start: number, end: number, value: string) {
  return text.substring(0, start) + value + text.substring(end)
}
export function wrap(text: string, start: number, end: number, open: string, close: string) {
  return text.substring(0, start) + open + text.substring(start, end) + close + text.substring(end)
}
