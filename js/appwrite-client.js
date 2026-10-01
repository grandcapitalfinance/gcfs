// Grand Capital Financial - Appwrite Cloud Realtime Integration
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

// Save Lead to Appwrite Cloud + Local Storage
async function saveLeadToCloud(leadData) {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const lead = {
    id: Date.now(),
    date: timestamp,
    name: leadData.name || 'N/A',
    phone: leadData.phone || 'N/A',
    loanType: leadData.loanType || 'N/A',
    amount: String(leadData.amount || 'Not Specified'),
    location: leadData.location || 'Boisar, Palghar'
  };

  // 1. Local Storage Cache (Immediate offline-first)
  try {
    const existing = JSON.parse(localStorage.getItem('gcfs_customer_leads') || '[]');
    existing.unshift(lead);
    localStorage.setItem('gcfs_customer_leads', JSON.stringify(existing));
    try {
      const ch = new BroadcastChannel('gcfs_leads_channel');
      ch.postMessage({ type: 'NEW_LEAD', lead: lead });
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('gcfs_new_lead', { detail: lead }));
    } catch (e) {}
  } catch (err) {
    console.error('LocalStorage error:', err);
  }

  // 2. Appwrite Cloud Sync
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
      console.log('Appwrite document created or pending collection setup:', err.message || err);
    }
  }

  return lead;
}
