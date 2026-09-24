/* ============================================================
   LE VIKING — firebase-config.js
   Config Firebase + session + permissions.

   ⚠️ A REMPLIR : créez votre propre projet Firebase (gratuit) sur
   https://console.firebase.google.com puis collez sa config ci-dessous.
   Realtime Database > Règles : démarrez en mode test, puis restreignez.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDZmEjwS2Y3y4cKBBLJgZJLjxpsHc2LuCE",
  authDomain: "bmf-rp.firebaseapp.com",
  databaseURL: "https://bmf-rp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bmf-rp",
  storageBucket: "bmf-rp.firebasestorage.app",
  messagingSenderId: "701363604694",
  appId: "1:701363604694:web:48fa467ffad98f48700d77",
  measurementId: "G-M34X4J1XZ3"
};

const NOM_GROUPE = "Le Viking";

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

const authReady = new Promise(resolve => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) resolve(user);
    else firebase.auth().signInAnonymously().then(cred => resolve(cred.user));
  });
});

/* ---------- liste des pages de l'app (utilisée par admin + permissions) ---------- */
const PAGES_DISPO = [
  { page: "dashboard",     label: "Dashboard" },
  { page: "tracker",       label: "Tracker" },
  { page: "stats",         label: "Stats & Quotas" },
  { page: "stock",         label: "Stock" },
  { page: "blanchiment",   label: "Blanchiment" },
  { page: "paye",          label: "Paye" },
  { page: "transactions",  label: "Transactions" },
  { page: "taxes",         label: "Taxes" },
  { page: "admin",         label: "Admin" },
  { page: "profil",        label: "Profil" }
];

/* ---------- SESSION ---------- */
function getSession() {
  try { return JSON.parse(localStorage.getItem("viking_session") || "null"); }
  catch (e) { return null; }
}
function setSession(membre) {
  localStorage.setItem("viking_session", JSON.stringify(membre));
}
function clearSession() {
  localStorage.removeItem("viking_session");
}
function logout() {
  clearSession();
  window.location.href = pathToRoot() + "index.html";
}
/* calcule le chemin relatif vers la racine selon qu'on est dans /pages/ ou pas */
function pathToRoot() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}
/* à appeler en haut de chaque page protégée (sauf index/setup) */
function requireSession() {
  const s = getSession();
  if (!s) {
    window.location.href = pathToRoot() + "index.html";
    return null;
  }
  return s;
}

/* ---------- PERMISSIONS ----------
   Stockées dans Firebase sous permissions/{grade}/{page} = true/false
   Le Fondateur (role === 'admin') a toujours accès à tout, même si rien
   n'est configuré — pour ne jamais se retrouver bloqué hors de l'admin. */
let _permsCache = null;
async function loadPermissions() {
  if (_permsCache) return _permsCache;
  const snap = await db.ref("permissions").once("value");
  _permsCache = snap.val() || {};
  return _permsCache;
}
let _gradesCache = null;
async function loadGrades() {
  if (_gradesCache) return _gradesCache;
  const snap = await db.ref("grades").once("value");
  _gradesCache = snap.val() || {};
  return _gradesCache;
}
function gradeEmoji(nomGrade) {
  if (!_gradesCache || !nomGrade) return "";
  const g = Object.values(_gradesCache).find(g => g.nom === nomGrade);
  return g && g.emoji ? g.emoji : "";
}
async function canAccess(membre, page) {
  if (!membre) return false;
  if (membre.role === "admin") return true;
  const perms = await loadPermissions();
  const gradePerms = perms[membre.grade] || {};
  return gradePerms[page] === true;
}

/* ---------- UTILITAIRES ---------- */
function formatMoney(n) {
  n = Number(n) || 0;
  return n.toLocaleString("fr-FR") + " $";
}
function formatDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR");
  } catch (e) { return d; }
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
/* IMPORTANT : ne jamais utiliser snap.forEach seul (bug si pas d'index) —
   toujours repasser par Object.entries(snap.val() || {}) */
function entries(val) {
  return Object.entries(val || {});
}
function toast(msg, isErr) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast" + (isErr ? " err" : "");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
