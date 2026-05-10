"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type ConsentPreferences = {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

type CookieConsentContextType = {
  preferences: ConsentPreferences | null
  hasConsented: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (prefs: ConsentPreferences) => void
  openManage: () => void
}

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(null)
  const [hasConsented, setHasConsented] = useState<boolean>(false)
  const [isManageOpen, setIsManageOpen] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem("tcglore_cookie_consent")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(parsed)
        setHasConsented(true)
      } catch {
        setPreferences(defaultPreferences)
      }
    } else {
      setPreferences(defaultPreferences)
    }
  }, [])

  const saveToStorage = (prefs: ConsentPreferences) => {
    localStorage.setItem("tcglore_cookie_consent", JSON.stringify(prefs))
    setPreferences(prefs)
    setHasConsented(true)
    setIsManageOpen(false)
  }

  const acceptAll = () => {
    saveToStorage({ necessary: true, analytics: true, marketing: true, functional: true })
  }

  const rejectAll = () => {
    saveToStorage({ necessary: true, analytics: false, marketing: false, functional: false })
  }

  const savePreferences = (prefs: ConsentPreferences) => {
    saveToStorage(prefs)
  }

  const openManage = () => {
    setIsManageOpen(true)
  }

  // During SSR or before hydration, preferences is null.
  // Always provide the context so child components never crash.
  const contextValue: CookieConsentContextType = {
    preferences: preferences ?? defaultPreferences,
    hasConsented,
    acceptAll,
    rejectAll,
    savePreferences,
    openManage,
  }

  // Don't show banner/modal until client-side hydration completes
  const isHydrated = preferences !== null

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      {isHydrated && !hasConsented && !isManageOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cookie Preferences</h3>
                <p className="text-sm text-gray-600 mb-2">
                  We use necessary cookies to make the site work. With your consent, we may also use analytics and marketing cookies to improve the website and measure performance. You can accept, reject, or manage your preferences.
                </p>
                <div className="text-xs text-gray-500 flex gap-4">
                  <a href="/privacy" className="underline hover:text-blue-600">Privacy Policy</a>
                  <a href="/cookies" className="underline hover:text-blue-600">Cookie Policy</a>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
                <button 
                  onClick={openManage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Manage Preferences
                </button>
                <button 
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 transition-colors"
                >
                  Reject Non-Essential
                </button>
                <button 
                  onClick={acceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isHydrated && isManageOpen && (
        <ManagePreferencesModal 
          currentPrefs={preferences!} 
          onSave={savePreferences} 
          onClose={() => hasConsented ? setIsManageOpen(false) : null}
          canClose={hasConsented}
        />
      )}
    </CookieConsentContext.Provider>
  )
}

function ManagePreferencesModal({ 
  currentPrefs, 
  onSave, 
  onClose,
  canClose
}: { 
  currentPrefs: ConsentPreferences, 
  onSave: (p: ConsentPreferences) => void,
  onClose: () => void,
  canClose: boolean
}) {
  const [prefs, setPrefs] = useState<ConsentPreferences>(currentPrefs)

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Manage Cookie Preferences</h2>
          {canClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Strictly Necessary</h3>
              <p className="text-sm text-gray-600 mt-1">These cookies are required for the website to function properly. They handle security, payments, and basic site operations. They cannot be disabled.</p>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 shrink-0">
              <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">These cookies help us understand how visitors interact with our website, discover errors, and provide a better overall experience.</p>
            </div>
            <button 
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${prefs.analytics ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${prefs.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Functional</h3>
              <p className="text-sm text-gray-600 mt-1">These cookies enable additional features like third-party reviews, live chat, or interactive map functionality.</p>
            </div>
            <button 
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${prefs.functional ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setPrefs(p => ({ ...p, functional: !p.functional }))}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${prefs.functional ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-gray-100 pt-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Marketing</h3>
              <p className="text-sm text-gray-600 mt-1">These cookies are used to track visitors across websites to display relevant advertisements and measure ad campaign performance.</p>
            </div>
            <button 
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${prefs.marketing ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${prefs.marketing ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={() => setPrefs({ necessary: true, analytics: false, marketing: false, functional: false })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reject Non-Essential
          </button>
          <button 
            onClick={() => onSave(prefs)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider")
  }
  return context
}
