import { createContext, useEffect, useState, useMemo } from 'react'
import c from 'cookie'

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf())
  date.setDate(date.getDate() + days)
  return date
}

const ENCODE = { path: '/', expires: new Date().addDays(1000) }

interface SiteSettings {
  accepted?: Boolean
  disableGoogleAnalytics?: Boolean
  language?: String
  updateSetting?: Function
  colorScheme: String
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  accepted: false,
  disableGoogleAnalytics: true,
  colorScheme: undefined,
}

export const context = createContext(DEFAULT_SITE_SETTINGS)

export const Provider = ({ sessionSettings, acceptLanguage, cookieKey, ...props }) => {
  const {
    accepted = false,
    disableGoogleAnalytics = true,
    language = acceptLanguage,
    colorScheme = undefined,
  } = sessionSettings

  /**
   * Set the initial settings state using stored cookie values
   */
  const [siteSettings, setSiteSettings]: [SiteSettings, Function] = useState({
    accepted,
    disableGoogleAnalytics,
    language: acceptLanguage,
    colorScheme,
  })

  /**
   * Whenever the siteSettings changes,
   * sync the state to a cookie
   */
  useEffect(() => {
    document.cookie = c.serialize(cookieKey, JSON.stringify(siteSettings), ENCODE)
  }, [siteSettings])

  const updateSetting = (obj: SiteSettings) => {
    setSiteSettings((s: SiteSettings) => ({ ...s, ...obj }))
  }

  /**
   * Client only
   *
   * This can only be done on the client, since the window
   * object is being updated
   */
  if (typeof window !== 'undefined') {
    if (siteSettings.disableGoogleAnalytics) {
      window.gaOptout?.()
    } else {
      window.gaOptin?.()
    }
  }

  /**
   * Client only
   *
   * If the language in the cookie is not the same as the
   * accept language HTTP header, re-render the page with
   * the language override
   */
  useEffect(() => {
    if (language !== acceptLanguage) {
      setSiteSettings((s: SiteSettings) => ({ ...s, language }))
    }
  }, [])

  return <context.Provider value={{ ...siteSettings, updateSetting }} {...props} />
}
