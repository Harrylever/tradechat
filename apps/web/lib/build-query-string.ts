type QueryParamValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | null
  | undefined

export type QueryRecord = Record<string, QueryParamValue>

/**
 * Universally converts any flat object payload into a clean, web-safe query parameter string.
 * Automatically discards null, undefined, or empty values.
 */
export function buildQueryString<T>(params?: T): string {
  if (!params || Object.keys(params as Record<string, unknown>).length === 0)
    return ''

  const searchParams = new URLSearchParams()

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== '') {
          searchParams.append(key, String(item))
        }
      })
    } else {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
