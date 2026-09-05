(() => {
  'use strict';

  const GA_MEASUREMENT_ID = 'G-EET73MQB7L';
  const CONSENT_KEY = 'acai-dudu-analytics-consent-v1';
  const SCRIPT_ID = 'ot-ga4-script';
  const BANNER_ID = 'ot-cookie-consent';
  const STYLE_ID = 'ot-cookie-consent-style';

  let analyticsLoaded = false;
  let dataLayerBridgeInstalled = false;

  const readConsent = () => {
    try {
      const value = window.localStorage.getItem(CONSENT_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch (_) {
      return null;
    }
  };

  const writeConsent = (value) => {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
  };

  const deleteAnalyticsCookies = () => {
    const hostParts = window.location.hostname.split('.');
    const parentDomain = hostParts.length >= 2 ? `.${hostParts.slice(-2).join('.')}` : '';
    document.cookie.split(';').forEach((rawCookie) => {
      const name = rawCookie.split('=')[0]?.trim();
      if (!name || !name.startsWith('_ga')) return;
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      if (parentDomain) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parentDomain}; SameSite=Lax`;
    });
  };

  const sanitizePayload = (payload = {}) => {
    const cleaned = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value == null) return;

      if (key === 'destination' && typeof value === 'string') {
        try {
          const url = new URL(value, window.location.href);
          cleaned.destination_host = url.hostname.slice(0, 100);
          cleaned.destination_path = url.pathname.slice(0, 100);
        } catch (_) {}
        return;
      }

      if (typeof value === 'string') cleaned[key] = value.slice(0, 100);
      else if (typeof value === 'number' || typeof value === 'boolean') cleaned[key] = value;
    });
    return cleaned;
  };

  const sendMappedEvent = (eventName, payload = {}) => {
    if (readConsent() !== 'granted' || typeof window.gtag !== 'function') return;
    const clean = sanitizePayload(payload);
    window.gtag('event', eventName, clean);

    if (eventName === 'cta_click' && String(clean.cta || '').includes('whatsapp')) {
      window.gtag('event', 'generate_lead', {
        method: 'whatsapp',
        cta: String(clean.cta || '').slice(0, 100)
      });
    }

    if (eventName === 'product_open' && clean.product_id && clean.product_name) {
      window.gtag('event', 'view_item', {
        items: [{
          item_id: String(clean.product_id).slice(0, 100),
          item_name: String(clean.product_name).slice(0, 100)
        }]
      });
    }
  };

  const installDataLayerBridge = () => {
    if (dataLayerBridgeInstalled) return;
    dataLayerBridgeInstalled = true;

    window.dataLayer = window.dataLayer || [];
    const nativePush = window.dataLayer.push.bind(window.dataLayer);

    window.dataLayer.push = (...items) => {
      const result = nativePush(...items);
      items.forEach((item) => {
        const isPlainObject = item && typeof item === 'object' && Object.getPrototypeOf(item) === Object.prototype;
        if (!isPlainObject || typeof item.event !== 'string') return;
        const { event, ...payload } = item;
        sendMappedEvent(event, payload);
      });
      return result;
    };
  };

  const ensureGtag = () => {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
    }
  };

  const setGoogleConsent = (status) => {
    ensureGtag();
    window.gtag('consent', status === 'default' ? 'default' : 'update', {
      analytics_storage: status === 'granted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: status === 'default' ? 500 : undefined
    });
  };

  const loadAnalytics = () => {
    if (analyticsLoaded || readConsent() !== 'granted') return;
    analyticsLoaded = true;
    installDataLayerBridge();
    ensureGtag();
    setGoogleConsent('granted');

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
      document.head.appendChild(script);
    }
  };

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID} {
        position: fixed;
        z-index: 99999;
        left: 50%;
        bottom: max(16px, env(safe-area-inset-bottom));
        width: min(760px, calc(100% - 28px));
        transform: translateX(-50%);
        padding: 18px;
        color: #fff;
        background: rgba(39, 5, 49, .97);
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 20px;
        box-shadow: 0 24px 70px rgba(18, 2, 24, .38);
        backdrop-filter: blur(14px);
      }

      #${BANNER_ID}[hidden] { display: none !important; }

      #${BANNER_ID} .ot-cookie-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
      }

      #${BANNER_ID} strong {
        display: block;
        margin-bottom: 4px;
        color: #ffd21f;
        font-size: .95rem;
      }

      #${BANNER_ID} p {
        margin: 0;
        color: rgba(255,255,255,.82);
        font-size: .82rem;
        line-height: 1.45;
      }

      #${BANNER_ID} a {
        color: #ffd21f;
        font-weight: 800;
      }

      #${BANNER_ID} .ot-cookie-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      #${BANNER_ID} button {
        min-height: 42px;
        padding: 0 15px;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        font-size: .78rem;
        font-weight: 900;
      }

      #${BANNER_ID} [data-cookie-accept] {
        color: #2b0538;
        background: #ffd21f;
      }

      #${BANNER_ID} [data-cookie-reject] {
        color: #fff;
        background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.18);
      }

      .ot-privacy-settings {
        appearance: none;
        padding: 0;
        color: inherit;
        background: none;
        border: 0;
        cursor: pointer;
        font: inherit;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      @media (max-width: 680px) {
        #${BANNER_ID} {
          bottom: max(10px, env(safe-area-inset-bottom));
          width: calc(100% - 20px);
          padding: 16px;
          border-radius: 18px;
        }

        #${BANNER_ID} .ot-cookie-inner {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        #${BANNER_ID} .ot-cookie-actions {
          justify-content: stretch;
        }

        #${BANNER_ID} button {
          flex: 1 1 130px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const getBanner = () => document.getElementById(BANNER_ID);

  const showBanner = () => {
    const banner = getBanner();
    if (banner) banner.hidden = false;
  };

  const hideBanner = () => {
    const banner = getBanner();
    if (banner) banner.hidden = true;
  };

  const chooseConsent = (value) => {
    writeConsent(value);
    if (value === 'granted') {
      loadAnalytics();
    } else {
      setGoogleConsent('denied');
      deleteAnalyticsCookies();
    }
    hideBanner();
  };

  const installBanner = () => {
    if (getBanner()) return;
    const banner = document.createElement('aside');
    banner.id = BANNER_ID;
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferências de privacidade e cookies');
    banner.innerHTML = `
      <div class="ot-cookie-inner">
        <div>
          <strong>Privacidade primeiro</strong>
          <p>Usamos cookies opcionais do Google Analytics para entender visitas e melhorar o site. Você pode aceitar ou recusar sem perder nenhuma função. <a href="/privacidade.html">Saiba mais</a>.</p>
        </div>
        <div class="ot-cookie-actions">
          <button type="button" data-cookie-reject>Recusar</button>
          <button type="button" data-cookie-accept>Aceitar Analytics</button>
        </div>
      </div>
    `;

    banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => chooseConsent('granted'));
    banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => chooseConsent('denied'));
    document.body.appendChild(banner);
  };

  const installPrivacySettingsLink = () => {
    if (document.querySelector('.ot-privacy-settings')) return;
    const footer = document.querySelector('.footer-bottom');
    if (!(footer instanceof HTMLElement)) return;

    const separator = document.createTextNode(' · ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ot-privacy-settings';
    button.textContent = 'Privacidade e cookies';
    button.addEventListener('click', showBanner);
    footer.append(separator, button);
  };

  const init = () => {
    installStyles();
    installDataLayerBridge();
    ensureGtag();
    setGoogleConsent('default');
    installBanner();
    installPrivacySettingsLink();

    const consent = readConsent();
    if (consent === 'granted') {
      hideBanner();
      loadAnalytics();
    } else if (consent === 'denied') {
      hideBanner();
      setGoogleConsent('denied');
    } else {
      showBanner();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

(() => {
  'use strict';
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path !== '/cardapio') return;
  if (document.getElementById('ot-cardapio-polish-script')) return;
  const script = document.createElement('script');
  script.id = 'ot-cardapio-polish-script';
  script.src = '/assets/js/cardapio-polish.js?v=20260905-final-2';
  script.defer = true;
  document.head.appendChild(script);
})();
