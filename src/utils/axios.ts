import type { AxiosRequestConfig, Method } from 'axios'
import axios from 'axios'
import { ElLoading, ElNotification, type LoadingOptions } from 'element-plus'
import { refreshToken } from '/@/api/common'
import { i18n } from '/@/lang/index'
import router from '/@/router/index'
import adminBaseRoute from '/@/router/static/adminBase'
// import { memberCenterBaseRoutePath } from '/@/router/static/memberCenterBase'
import { useAdminInfo } from '/@/stores/adminInfo'
import { useConfig } from '/@/stores/config'
import { useUserInfo } from '/@/stores/userInfo'
import { isAdminApp } from '/@/utils/common'

window.requests = []
window.tokenRefreshing = false
const pendingMap = new Map()
const loadingInstance: LoadingInstance = {
    target: null,
    count: 0,
}

/**
 * 根据运行环境获取基础请求URL
 */
export const getUrl = (): string => {
    const value = (import.meta.env.VITE_AXIOS_BASE_URL as string | undefined)?.trim()
    if (!value) return ''
    return value == 'getCurrentDomain' ? window.location.origin : value
}

/**
 * 根据运行环境获取基础请求URL的端口
 */
export const getUrlPort = (): string => {
    const url = getUrl()
    return url ? new URL(url, window.location.origin).port : window.location.port
}

/**
 * 创建`Axios`
 * 默认开启`reductDataFormat(简洁响应)`,返回类型为`ApiPromise`
 * 关闭`reductDataFormat`,返回类型则为`AxiosPromise`
 */
function createAxios<Data = any, T = ApiPromise<Data>>(axiosConfig: AxiosRequestConfig, options: Options = {}, loading: LoadingOptions = {}): T {
    const config = useConfig()
    const adminInfo = useAdminInfo()
    const userInfo = useUserInfo()

    const Axios = axios.create({
        baseURL: getUrl(),
        timeout: 1000 * 10,
        headers: {
            'think-lang': config.lang.defaultLang,
            server: true,
        },
        responseType: 'json',
    })

    // 合并默认请求选项
    options = Object.assign(
        {
            CancelDuplicateRequest: true, // 是否开启取消重复请求, 默认为 true
            loading: false, // 是否开启loading层效果, 默认为false
            reductDataFormat: true, // 是否开启简洁的数据结构响应, 默认为true
            showErrorMessage: true, // 是否开启接口错误信息展示,默认为true
            showCodeMessage: true, // 是否开启code不为1时的信息提示, 默认为true
            showSuccessMessage: false, // 是否开启code为1时的信息提示, 默认为false
            anotherToken: '', // 当前请求使用另外的用户token
        },
        options
    )

    // 请求拦截
    Axios.interceptors.request.use(
        (config) => {
            removePending(config)
            options.CancelDuplicateRequest && addPending(config)
            // 创建loading实例
            if (options.loading) {
                loadingInstance.count++
                if (loadingInstance.count === 1) {
                    loadingInstance.target = ElLoading.service(loading)
                }
            }

            // 注入鉴权头：从 Pinia store 实时读取，避免闭包过期 token
            const adminInfo = useAdminInfo()
            const token = adminInfo.getToken?.() ?? adminInfo.token ?? ''
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`
            }

            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    // 响应拦截
    Axios.interceptors.response.use(
        (response) => {
            removePending(response.config)
            options.loading && closeLoading(options) // 关闭loading

            return options.reductDataFormat ? response.data : response
        },
        (error) => {
            error.config && removePending(error.config)
            options.loading && closeLoading(options) // 关闭loading
            options.showErrorMessage && httpErrorStatusHandle(error) // 处理错误状态码
            return Promise.reject(error) // 错误继续返回给到具体页面
        }
    )
    if (options.urlPrefix && axiosConfig.url && !isAbsoluteUrl(axiosConfig.url)) {
        axiosConfig.url = joinUrl(options.urlPrefix, axiosConfig.url)
    }

    return Axios(axiosConfig) as T
}

export default createAxios

/**
 * 处理异常
 * @param {*} error
 */
function httpErrorStatusHandle(error: any) {
    // 处理被取消的请求
    if (axios.isCancel(error)) return console.error(i18n.global.t('axios.Automatic cancellation due to duplicate request:') + error.message)
    let message = ''
    if (error && error.response) {
        switch (error.response.status) {
            case 302:
                message = i18n.global.t('axios.Interface redirected!')
                break
            case 400:
                message = i18n.global.t('axios.Incorrect parameter!')
                break
            case 401:
                message = i18n.global.t('axios.You do not have permission to operate!')
                break
            case 403:
                message = i18n.global.t('axios.You do not have permission to operate!')
                break
            case 404:
                message = i18n.global.t('axios.Error requesting address:') + error.response.config.url
                break
            case 408:
                message = i18n.global.t('axios.Request timed out!')
                break
            case 409:
                message = i18n.global.t('axios.The same data already exists in the system!')
                break
            case 500:
                message = i18n.global.t('axios.Server internal error!')
                break
            case 501:
                message = i18n.global.t('axios.Service not implemented!')
                break
            case 502:
                message = i18n.global.t('axios.Gateway error!')
                break
            case 503:
                message = i18n.global.t('axios.Service unavailable!')
                break
            case 504:
                message = i18n.global.t('axios.The service is temporarily unavailable Please try again later!')
                break
            case 505:
                message = i18n.global.t('axios.HTTP version is not supported!')
                break
            default:
                message = i18n.global.t('axios.Abnormal problem, please contact the website administrator!')
                break
        }
    }
    if (error.message.includes('timeout')) message = i18n.global.t('axios.Network request timeout!')
    if (error.message.includes('Network'))
        message = window.navigator.onLine ? i18n.global.t('axios.Server exception!') : i18n.global.t('axios.You are disconnected!')

    ElNotification({
        type: 'error',
        message,
        zIndex: 9999,
    })
}

/**
 * 关闭Loading层实例
 */
function closeLoading(options: Options) {
    if (options.loading && loadingInstance.count > 0) loadingInstance.count--
    if (loadingInstance.count === 0) {
        loadingInstance.target.close()
        loadingInstance.target = null
    }
}

/**
 * 储存每个请求的唯一cancel回调, 以此为标识
 */
function addPending(config: AxiosRequestConfig) {
    const pendingKey = getPendingKey(config)
    config.cancelToken =
        config.cancelToken ||
        new axios.CancelToken((cancel) => {
            if (!pendingMap.has(pendingKey)) {
                pendingMap.set(pendingKey, cancel)
            }
        })
}

/**
 * 删除重复的请求
 */
function removePending(config: AxiosRequestConfig) {
    const pendingKey = getPendingKey(config)
    if (pendingMap.has(pendingKey)) {
        const cancelToken = pendingMap.get(pendingKey)
        cancelToken(pendingKey)
        pendingMap.delete(pendingKey)
    }
}

/**
 * 生成每个请求的唯一key
 */
function getPendingKey(config: AxiosRequestConfig) {
    let { data } = config
    const { url, method, params, headers } = config
    if (typeof data === 'string') data = JSON.parse(data) // response里面返回的config.data是个字符串对象
    return [
        url,
        method,
        headers && (headers as anyObj).batoken ? (headers as anyObj).batoken : '',
        headers && (headers as anyObj)['ba-user-token'] ? (headers as anyObj)['ba-user-token'] : '',
        JSON.stringify(params),
        JSON.stringify(data),
    ].join('&')
}

/**
 * 根据请求方法组装请求数据/参数
 */
export function requestPayload(method: Method, data: anyObj) {
    if (method == 'GET') {
        return {
            params: data,
        }
    } else if (method == 'POST') {
        return {
            data: data,
        }
    }
}

function isAbsoluteUrl(url: string): boolean {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

function joinUrl(prefix: string, url: string): string {
    return `${prefix.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

interface LoadingInstance {
    target: any
    count: number
}
interface Options {
    // 是否开启取消重复请求, 默认为 true
    CancelDuplicateRequest?: boolean
    // 是否开启loading层效果, 默认为false
    loading?: boolean
    // 是否开启简洁的数据结构响应, 默认为true
    reductDataFormat?: boolean
    // 是否开启接口错误信息展示,默认为true
    showErrorMessage?: boolean
    // 是否开启code不为1时的信息提示, 默认为true
    showCodeMessage?: boolean
    // 是否开启code为1时的信息提示, 默认为false
    showSuccessMessage?: boolean
    urlPrefix?: string
    // 当前请求使用另外的用户token
    anotherToken?: string
}

/*
 * 感谢掘金@橙某人提供的思路和分享
 * 本axios封装详细解释请参考：https://juejin.cn/post/6968630178163458084?share_token=7831c9e0-bea0-469e-8028-b587e13681a8#heading-27
 */
