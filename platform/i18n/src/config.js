const debugMode = !!(process.env.NODE_ENV !== 'production' && process.env.REACT_APP_I18N_DEBUG);

const detectionOptions = {
  // Respect explicit or saved preferences; otherwise i18next uses the Persian default.
  order: ['querystring', 'localStorage', 'cookie'],

  // keys or params to lookup language from
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,

  // cache user language on
  caches: ['localStorage', 'cookie'],
  excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

  // optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement,
};

export { debugMode, detectionOptions };
