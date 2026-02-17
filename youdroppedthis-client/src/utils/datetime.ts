const longDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  hour12: false,
})
const shortDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
export function formatDateTime(datetime: string | number | Date, withYear?: boolean) {
  return (withYear ? longDateTimeFormatter : shortDateTimeFormatter).format(new Date(datetime))
}

const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity]
const units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'] as const
const relativeTimeFormatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

export function formatRelativeTime(datetime: string | number | Date) {
  const deltaSeconds = Math.round((new Date(datetime).getTime() - Date.now()) / 1000)
  const unitIndex = cutoffs.findIndex((cutoff) => cutoff > Math.abs(deltaSeconds))
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1
  return relativeTimeFormatter.format(Math.floor(deltaSeconds / divisor), units[unitIndex])
}

export function getH_M_S(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3_600_000)
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000)
  const seconds = Math.floor((milliseconds % 60_000) / 1_000)
  return { hours, minutes, seconds }
}
