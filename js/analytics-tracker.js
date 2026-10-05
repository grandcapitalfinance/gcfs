/**
 * Grand Capital Financial - Intelligent Analytics Tracker & Google Analytics Integration
 * Realtime visitor tracking, click monitoring, device & location analytics
 */

(function () {
  'use strict';

  // --- 1. GOOGLE ANALYTICS 4 (G-R8GN8C2L7Y) AUTO-INJECTION ---
  const GA_MEASUREMENT_ID = 'G-R8GN8C2L7Y';

  if (!window.gtagScriptLoaded) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      anonymize_ip: true
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    window.gtagScriptLoaded = true;
  }

  // --- 2. VISITOR IDENTITY & SESSION MANAGEMENT ---
  function getVisitorId() {
    let vid = localStorage.getItem('gcfs_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('gcfs_visitor_id', vid);
      localStorage.setItem('gcfs_first_visit', new Date().toISOString());
    }
    return vid;
  }

  function getSessionId() {
    let sid = sessionStorage.getItem('gcfs_session_id');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('gcfs_session_id', sid);
    }
    return sid;
  }

  // --- 3. DEVICE & BROWSER DETECTION ---
  function getDeviceInfo() {
    const ua = navigator.userAgent || '';
    let device = 'Desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      device = 'Tablet';
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua) || window.innerWidth < 768) {
      device = 'Mobile';
    }

    let browser = 'Other';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    let os = 'Unknown OS';
    if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { device, browser, os, screen: `${window.innerWidth}x${window.innerHeight}` };
  }

  // --- 4. TRAFFIC SOURCE CLASSIFICATION ---
  function getTrafficSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) return utmSource.charAt(0).toUpperCase() + utmSource.slice(1);

    const ref = document.referrer;
    if (!ref) return 'Direct';

    try {
      const refUrl = new URL(ref);
      const host = refUrl.hostname.toLowerCase();
      const currentHost = window.location.hostname.toLowerCase();

      if (host === currentHost) return 'Internal';
      if (host.includes('google.')) return 'Google Search';
      if (host.includes('whatsapp') || host.includes('api.whatsapp.com')) return 'WhatsApp';
      if (host.includes('facebook.com') || host.includes('fb.com')) return 'Facebook';
      if (host.includes('instagram.com')) return 'Instagram';
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
      if (host.includes('linkedin.com')) return 'LinkedIn';
      if (host.includes('t.co') || host.includes('twitter.com') || host.includes('x.com')) return 'Twitter / X';
      if (host.includes('bing.com') || host.includes('yahoo.com')) return 'Search Engine (Bing/Yahoo)';

      return host.replace(/^www\./, '');
    } catch (e) {
      return 'Referral';
    }
  }

  // --- 5. VISITOR GEOLOCATION (ASYNCHRONOUS IP LOOKUP) ---
  let cachedLocation = null;
  function getCachedLocation() {
    try {
      const raw = localStorage.getItem('gcfs_visitor_geo');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Refresh every 7 days
        if (Date.now() - (parsed.time || 0) < 7 * 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (e) {}
    return null;
  }

  async function fetchLocation() {
    const cached = getCachedLocation();
    if (cached) {
      cachedLocation = cached;
      return cached;
    }

    try {
      const res = await fetch('https://freeipapi.com/api/json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        const loc = {
          city: data.cityName || 'Boisar / Mumbai Area',
          region: data.regionName || 'Maharashtra',
          country: data.countryName || 'India',
          ip: data.ipAddress ? data.ipAddress.replace(/\.\d+$/, '.xxx') : 'Anonymous'
        };
        localStorage.setItem('gcfs_visitor_geo', JSON.stringify({ time: Date.now(), data: loc }));
        cachedLocation = loc;
        return loc;
      }
    } catch (e) {
      // Fallback
    }

    // Default region fallback
    const fallback = { city: 'Boisar / Mumbai Area', region: 'Maharashtra', country: 'India', ip: 'Hidden' };
    cachedLocation = fallback;
    return fallback;
  }

  // Preload location
  fetchLocation();

  // --- 6. LOCAL ANALYTICS STORAGE ENGINE ---
  const STORAGE_KEY = 'gcfs_analytics_store';

  function getAnalyticsStore() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}

    return {
      version: 2,
      created: Date.now(),
      uniqueVisitors: {},
      totalPageViews: 0,
      totalEvents: 0,
      pageViewsByPath: {},
      sources: {},
      devices: {},
      browsers: {},
      locations: {},
      eventsByType: {},
      dailyStats: {},
      recentActivity: []
    };
  }

  function saveAnalyticsStore(store) {
    try {
      // Cap recent activity to latest 100 items
      if (store.recentActivity.length > 100) {
        store.recentActivity = store.recentActivity.slice(0, 100);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

      // Broadcast update to open tabs (like Admin Panel)
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('gcfs_analytics_channel');
          bc.postMessage({ type: 'ANALYTICS_UPDATED', timestamp: Date.now() });
        } catch (err) {}
      }
    } catch (e) {
      console.warn('Analytics store save error:', e);
    }
  }

  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getCleanPagePath() {
    let p = window.location.pathname || '/';
    p = p.replace(/\/index\.html$/, '/');
    if (!p.startsWith('/')) p = '/' + p;
    return p;
  }

  // --- 7. LOG EVENT FUNCTION ---
  window.gcfsTrackEvent = async function (category, action, label = '', extra = {}) {
    const store = getAnalyticsStore();
    const vid = getVisitorId();
    const sid = getSessionId();
    const today = getTodayKey();
    const pagePath = getCleanPagePath();
    const device = getDeviceInfo();
    const source = getTrafficSource();
    const loc = cachedLocation || (await fetchLocation());

    // Google Analytics Event Dispatch
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        page_path: pagePath,
        visitor_id: vid,
        ...extra
      });
    }

    // Daily stats tracking
    if (!store.dailyStats[today]) {
      store.dailyStats[today] = { views: 0, visitors: {}, events: 0 };
    }
    store.dailyStats[today].events = (store.dailyStats[today].events || 0) + 1;
    store.dailyStats[today].visitors[vid] = true;

    // Events by type
    const eventKey = `${category}: ${action}`;
    store.eventsByType[eventKey] = (store.eventsByType[eventKey] || 0) + 1;
    store.totalEvents = (store.totalEvents || 0) + 1;

    // Activity log entry
    const entry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: today,
      timestamp: Date.now(),
      type: 'event',
      category: category,
      action: action,
      label: label,
      page: pagePath,
      device: device.device,
      browser: device.browser,
      city: loc ? loc.city : 'Boisar',
      source: source
    };

    store.recentActivity.unshift(entry);
    saveAnalyticsStore(store);

    // Optional Appwrite Cloud Sync for events
    syncWithCloud('event', entry);

    return entry;
  };

  // --- 8. LOG PAGE VIEW FUNCTION ---
  window.gcfsTrackPageView = async function () {
    const store = getAnalyticsStore();
    const vid = getVisitorId();
    const today = getTodayKey();
    const pagePath = getCleanPagePath();
    const device = getDeviceInfo();
    const source = getTrafficSource();
    const loc = cachedLocation || (await fetchLocation());

    // Update Unique Visitors
    store.uniqueVisitors[vid] = store.uniqueVisitors[vid] || {
      firstSeen: Date.now(),
      visits: 0,
      device: device.device,
      source: source,
      city: loc ? loc.city : 'Boisar'
    };
    store.uniqueVisitors[vid].visits += 1;
    store.uniqueVisitors[vid].lastSeen = Date.now();

    // Increment Page Views
    store.totalPageViews = (store.totalPageViews || 0) + 1;
    store.pageViewsByPath[pagePath] = (store.pageViewsByPath[pagePath] || 0) + 1;

    // Increment Source
    store.sources[source] = (store.sources[source] || 0) + 1;

    // Increment Device
    store.devices[device.device] = (store.devices[device.device] || 0) + 1;
    store.browsers[device.browser] = (store.browsers[device.browser] || 0) + 1;

    // Increment Location
    const locKey = loc && loc.city ? `${loc.city}, ${loc.region || 'MH'}` : 'Boisar, Maharashtra';
    store.locations[locKey] = (store.locations[locKey] || 0) + 1;

    // Daily bucket
    if (!store.dailyStats[today]) {
      store.dailyStats[today] = { views: 0, visitors: {}, events: 0 };
    }
    store.dailyStats[today].views = (store.dailyStats[today].views || 0) + 1;
    store.dailyStats[today].visitors[vid] = true;

    // Activity log entry
    const entry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: today,
      timestamp: Date.now(),
      type: 'pageview',
      page: pagePath,
      title: document.title || 'Page',
      device: device.device,
      browser: device.browser,
      city: loc ? loc.city : 'Boisar',
      source: source
    };

    store.recentActivity.unshift(entry);
    saveAnalyticsStore(store);

    // Optional Appwrite Cloud Sync for views
    syncWithCloud('pageview', entry);
  };

  // --- 9. APPWRITE CLOUD SYNC (OPTIONAL/BACKGROUND) ---
  function syncWithCloud(type, payload) {
    if (typeof appwriteDatabases !== 'undefined' && appwriteDatabases && typeof APPWRITE_CONFIG !== 'undefined') {
      try {
        const colId = APPWRITE_CONFIG.analyticsCollectionId || 'site_analytics';
        appwriteDatabases.createDocument(
          APPWRITE_CONFIG.databaseId,
          colId,
          Appwrite.ID.unique(),
          {
            type: type,
            page: payload.page || '',
            device: payload.device || '',
            city: payload.city || '',
            source: payload.source || '',
            action: payload.action || '',
            date: new Date().toISOString()
          }
        ).catch(() => {
          // Silent catch if analytics collection not yet created in Appwrite
        });
      } catch (e) {}
    }
  }

  // --- 10. AUTO-CLICK INTERCEPTORS ---
  function setupAutoClickTracking() {
    document.addEventListener('click', function (e) {
      const target = e.target.closest('a, button, [data-track-click]');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = (target.innerText || target.getAttribute('title') || target.getAttribute('aria-label') || '').trim();

      // 1. WhatsApp Button Clicks
      if (href.includes('whatsapp') || href.includes('api.whatsapp.com') || target.classList.contains('whatsapp-btn') || target.id?.includes('whatsapp')) {
        window.gcfsTrackEvent('Conversion', 'WhatsApp Chat Click', text || href);
      }
      // 2. Phone Call Clicks
      else if (href.startsWith('tel:') || target.id?.includes('call') || target.classList.contains('call-btn')) {
        window.gcfsTrackEvent('Conversion', 'Phone Call Click', href.replace('tel:', ''));
      }
      // 3. Apply Loan Modal or Button
      else if (target.classList.contains('trigger-apply-modal') || href.includes('apply-loan') || href.includes('/apply') || text.toLowerCase().includes('apply now') || target.id === 'headerApplyBtn') {
        const loanType = target.getAttribute('data-service') || 'General Loan';
        window.gcfsTrackEvent('Action', 'Apply Loan Click', loanType);
      }
      // 4. Download Brochure / PDF / Documents
      else if (href.endsWith('.pdf') || href.includes('/download')) {
        window.gcfsTrackEvent('Action', 'Download Click', href);
      }
      // 5. Office Location / Map Click
      else if (href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) {
        window.gcfsTrackEvent('Action', 'Google Maps Office Click', 'Chitralaya Boisar Office');
      }
    }, true);

    // Track Form Submits
    document.addEventListener('submit', function (e) {
      const form = e.target;
      const formId = form.id || form.getAttribute('name') || 'Unnamed Form';
      window.gcfsTrackEvent('Conversion', 'Form Submitted', formId);
    }, true);

    // Track Loan Calculator Interaction (Debounced)
    let calcTimeout = null;
    const calcInputs = document.querySelectorAll('#heroAmountSlider, #heroTenureSlider, #mainCalcAmount, #mainCalcTenure');
    calcInputs.forEach(input => {
      input.addEventListener('change', () => {
        clearTimeout(calcTimeout);
        calcTimeout = setTimeout(() => {
          window.gcfsTrackEvent('Engagement', 'EMI Calculator Used', `Value: ${input.value}`);
        }, 800);
      });
    });
  }

  // --- 11. INITIALIZATION ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.gcfsTrackPageView();
      setupAutoClickTracking();
    });
  } else {
    window.gcfsTrackPageView();
    setupAutoClickTracking();
  }

})();
