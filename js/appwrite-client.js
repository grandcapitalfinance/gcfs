// Grand Capital Financial - Hybrid Cloud Lead Engine (Google Sheets + Appwrite Cloud + LocalStorage)
const GOOGLE_SHEET_LEADS_URL = 'https://script.google.com/macros/s/AKfycbx76iEkF99zPRe0YB3S8cgP6H-bsqVlK-WVB5U8pFGo6sqdPP23yhV0iOpZIefPHlEG/exec';

const DEFAULT_APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6abcf17f003452017081',
  databaseId: 'gcfs_database',
  collectionId: 'leads'
};

function getAppwriteConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem('gcfs_appwrite_config') || '{}');
    return { ...DEFAULT_APPWRITE_CONFIG, ...saved };
  } catch (e) {
    return DEFAULT_APPWRITE_CONFIG;
  }
}

let APPWRITE_CONFIG = getAppwriteConfig();
let appwriteClient = null;
let appwriteDatabases = null;

function initAppwrite() {
  APPWRITE_CONFIG = getAppwriteConfig();
  if (typeof Appwrite !== 'undefined') {
    try {
      appwriteClient = new Appwrite.Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);
      appwriteDatabases = new Appwrite.Databases(appwriteClient);
      console.log('Appwrite Cloud initialized with Project:', APPWRITE_CONFIG.projectId);
    } catch (e) {
      console.warn('Appwrite init error:', e);
    }
  }
}

// Auto init
initAppwrite();

/**
 * Universal Lead Dispatcher:
 * 1. Saves to browser LocalStorage cache
 * 2. Sends lead to Google Sheets (Permanent, Zero-Pause Cloud Database)
 * 3. Sends lead to Appwrite Cloud (if configured)
 * 4. Broadcasts lead across tabs & windows in realtime
 */
async function saveLeadToCloud(leadData) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const lead = {
    id: leadData.id || Date.now(),
    date: leadData.date || timestamp,
    name: leadData.name || 'Website Customer',
    phone: String(leadData.phone || '').replace(/[^0-9]/g, ''),
    loanType: leadData.loanType || 'Personal Loan',
    amount: String(leadData.amount || 'Not Specified'),
    location: leadData.location || 'Boisar, Palghar',
    email: leadData.email || '',
    message: leadData.message || ''
  };

  // 1. Local Storage Cache (Immediate offline-first)
  try {
    const existing = JSON.parse(localStorage.getItem('gcfs_customer_leads') || '[]');
    const isDup = existing.some(l => 
      (l.id && l.id === lead.id) || 
      (l.phone === lead.phone && l.loanType === lead.loanType && Math.abs((new Date(l.date || 0)) - (new Date(lead.date || 0))) < 10000)
    );
    if (!isDup) {
      existing.unshift(lead);
      localStorage.setItem('gcfs_customer_leads', JSON.stringify(existing));
    }
    try {
      const ch = new BroadcastChannel('gcfs_leads_channel');
      ch.postMessage({ type: 'NEW_LEAD', lead: lead });
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('gcfs_new_lead', { detail: lead }));
    } catch (e) {}
    console.log('✅ Lead recorded locally:', lead);
  } catch (err) {
    console.error('LocalStorage error:', err);
  }

  // 2. Google Sheets Cloud Realtime Sync (100% Free, Never Pauses, Direct to Google Drive)
  try {
    fetch(GOOGLE_SHEET_LEADS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(() => {
      console.log('✅ Lead synced to Google Sheet successfully:', lead.name);
    }).catch(err => {
      console.warn('Google Sheet sync background notice:', err);
    });
  } catch (err) {
    console.warn('Google Sheet fetch error:', err);
  }

  // 3. Appwrite Cloud Sync (Secondary cloud backup)
  if (appwriteDatabases && typeof Appwrite !== 'undefined') {
    try {
      await appwriteDatabases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionId,
        Appwrite.ID.unique(),
        {
          name: lead.name,
          phone: lead.phone,
          loanType: lead.loanType,
          amount: lead.amount,
          location: lead.location,
          date: timestamp
        }
      );
      console.log('Lead synced to Appwrite Cloud successfully!');
    } catch (err) {
      console.log('Appwrite notice:', err.message || err);
    }
  }

  return lead;
}

/**
 * Fetch all leads from Google Sheets Cloud
 */
async function fetchLeadsFromGoogleSheet() {
  try {
    const res = await fetch(GOOGLE_SHEET_LEADS_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item, idx) => ({
        id: item.id || ('gs_' + (item.date || '') + '_' + (item.phone || idx)),
        date: item.date || item.Date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        name: item.name || item.Name || 'Customer',
        phone: String(item.phone || item.Phone || '').replace(/[^0-9]/g, ''),
        loanType: item.loanType || item['Loan Type'] || item['loan type'] || 'Personal Loan',
        amount: String(item.amount || item.Amount || 'Not Specified'),
        location: item.location || item.Location || 'Boisar, Palghar',
        email: item.email || item.Email || '',
        message: item.message || item.Message || item.msg || ''
      }));
    }
    return [];
  } catch (err) {
    console.warn('Google Sheet fetch error:', err);
    return null;
  }
}
