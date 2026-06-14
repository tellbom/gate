import { Session } from '/@/utils/storage'

export const EXTERNAL_AUTH_TOKEN_CACHE_KEY = 'externalAuthToken'
export const EXTERNAL_AUTH_TOKEN_QUERY_KEYS = ['auth', 'token', 'jwt', 'batoken', 'auth_token', 'jwt_token']

type QueryValue = string | (string | null)[] | null | undefined
type QueryLike = Record<string, QueryValue>

export const getExternalAuthTokenFromQuery = (query: QueryLike) => {
    for (const key of EXTERNAL_AUTH_TOKEN_QUERY_KEYS) {
        const value = query[key]
        if (Array.isArray(value)) return value[0] || ''
        if (typeof value === 'string' && value) return value
    }
    return ''
}

export const getExternalAuthTokenFromSearch = (search = window.location.search) => {
    const params = new URLSearchParams(search)

    for (const key of EXTERNAL_AUTH_TOKEN_QUERY_KEYS) {
        const value = params.get(key)
        if (value) return value
    }
    return ''
}

export const setExternalAuthToken = (token: string) => {
    if (token) Session.set(EXTERNAL_AUTH_TOKEN_CACHE_KEY, token)
}

export const getExternalAuthToken = () => {
    return Session.get(EXTERNAL_AUTH_TOKEN_CACHE_KEY) || ''
}

export const removeExternalAuthToken = () => {
    Session.remove(EXTERNAL_AUTH_TOKEN_CACHE_KEY)
}

export const cacheExternalAuthTokenFromSearch = (search = window.location.search) => {
    const token = getExternalAuthTokenFromSearch(search)
    setExternalAuthToken(token)
    return token
}
