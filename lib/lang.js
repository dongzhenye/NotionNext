import BLOG from '@/blog.config'
import { getQueryVariable, isBrowser, mergeDeep } from '@/lib/utils'
import enUS from './lang/en-US'
import frFR from './lang/fr-FR'
import jaJP from './lang/ja-JP'
import trTR from './lang/tr-TR'
import zhCN from './lang/zh-CN'
import zhHK from './lang/zh-HK'
import zhTW from './lang/zh-TW'
import { extractLangPrefix } from './utils/pageId'

/**
 * 在这里配置所有支持的语言
 * 国家-地区
 */
const LANGS = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
  'fr-FR': frFR,
  'tr-TR': trTR,
  'ja-JP': jaJP
}

export default LANGS

/**
 * 获取当前语言字典
 * 如果匹配到完整的“国家-地区”语言，则显示国家的语言
 * @returns 不同语言对应字典
 */
export function generateLocaleDict(langString) {
  const supportedLocales = Object.keys(LANGS)
  let userLocale

  // 将语言字符串拆分为语言和地区代码，例如将 "zh-CN" 拆分为 "zh" 和 "CN"
  const [language, region] = langString?.split(/[-_]/)

  // 优先匹配语言和地区都匹配的情况
  const specificLocale = `${language}-${region}`
  if (supportedLocales.includes(specificLocale)) {
    userLocale = LANGS[specificLocale]
  }

  // 然后尝试匹配只有语言匹配的情况
  if (!userLocale) {
    const languageOnlyLocales = supportedLocales.filter(locale =>
      locale.startsWith(language)
    )
    if (languageOnlyLocales.length > 0) {
      userLocale = LANGS[languageOnlyLocales[0]]
    }
  }

  // 如果还没匹配到，则返回最接近的语言包
  if (!userLocale) {
    const fallbackLocale = supportedLocales.find(locale =>
      locale.startsWith('en')
    )
    userLocale = LANGS[fallbackLocale]
  }

  return mergeDeep({}, LANGS['en-US'], userLocale)
}

/**
 * 站点翻译
 * 借助router中的locale机制，根据locale自动切换对应的语言
 */
export function initLocale(locale, changeLang, updateLocale) {
  if (isBrowser) {
    // 根据router中的locale对象判断当前语言：表现为前缀中包含 zh、en 等。
    let pathLocaleLang = null
    if (locale === 'en' || locale === 'zh') {
      pathLocaleLang = locale === 'en' ? 'en-US' : 'zh-CN'
    }
    // 如果有query参数切换语言则优先
    const queryLang =
      getQueryVariable('locale') || getQueryVariable('lang') || pathLocaleLang

    if (queryLang) {
      const match = queryLang.match(/[a-zA-Z]{2}(?:-[a-zA-Z]{2})?/)
      if (match) {
        const targetLang = match[0]
        changeLang(targetLang)
        const targetLocale = generateLocaleDict(targetLang)
        updateLocale(targetLocale)
      }
    }
  }
}

/**
 * 从本地存储读取语言设置
 * @returns {*} 存储的语言代码
 */
export const loadLangFromLocalStorage = () => {
  try {
    const item = localStorage.getItem('lang')
    if (!item) return null

    const { value, expires } = JSON.parse(item)
    if (expires && new Date().getTime() > expires) {
      localStorage.removeItem('lang')
      return null
    }

    return value
  } catch (e) {
    console.error('Error loading language from localStorage:', e)
    return null
  }
}

/**
 * 将语言设置保存到本地存储
 * @param {string} lang 要保存的语言代码
 * @param {number} [expiryDays] 过期天数，默认使用配置中的 LANG_COOKIE_EXPIRE_DAYS
 */
export const saveLangToLocalStorage = (lang, expiryDays = BLOG.LANG_COOKIE_EXPIRE_DAYS) => {
  try {
    const item = {
      value: lang,
      expires: new Date().getTime() + (expiryDays * 24 * 60 * 60 * 1000)
    }
    localStorage.setItem('lang', JSON.stringify(item))
  } catch (e) {
    console.error('Error saving language to localStorage:', e)
  }
}

/**
 * 清除保存的语言设置
 */
export const clearLangFromLocalStorage = () => {
  try {
    localStorage.removeItem('lang')
  } catch (e) {
    console.error('Error clearing language from localStorage:', e)
  }
}

/**
 * 将用户重定向到其首选语言路径
 * 重定向逻辑：
 * 1. 优先使用 URL 参数中的语言设置（locale 或 lang）
 * 2. 其次使用本地存储中的语言设置
 * 3. 最后使用博客配置中的默认语言
 * @param {string} pageId 当前页面的 ID，用于多语言站点的处理
 * @param {boolean} redirectEnabled 是否启用重定向功能，默认使用配置中的 REDIRECT_LANG
 */
export function redirectUserLang(pageId, redirectEnabled = BLOG.REDIRECT_LANG) {
  if (!isBrowser || !redirectEnabled) return
  
  // 检查是否启用了语言重定向
  if (!BLOG.REDIRECT_LANG) return
  
  // 仅在根路径时进行重定向
  if (window.location.pathname !== '/') return

  // 从 URL 参数获取语言偏好
  const urlParams = new URLSearchParams(window.location.search)
  const localeParam = urlParams.get('locale')
  const langParam = urlParams.get('lang')
  
  // 获取存储的语言偏好
  const storedLang = loadLangFromLocalStorage()
  
  // 确定使用哪种语言
  const lang = localeParam || langParam || storedLang || BLOG.LANG
  
  // 将选定的语言保存到本地存储
  if (lang !== storedLang) {
    saveLangToLocalStorage(lang)
  }
  
  // 多语言站点处理
  if (pageId?.includes(',')) {
    const siteIds = pageId.split(',')
    // 检查当前语言是否有对应的站点
    for (const siteId of siteIds) {
      const prefix = extractLangPrefix(siteId)
      if (prefix === lang) {
        window.location.pathname = `/${lang}`
        return
      }
    }
  }
  
  // 单语言站点或未找到对应语言站点时的处理
  window.location.pathname = `/${lang}`
}
