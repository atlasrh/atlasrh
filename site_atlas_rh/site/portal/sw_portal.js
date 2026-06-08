/**
 * sw_portal.js — Service Worker do Portal do Colaborador
 * Atlas RH — com Web Push completo
 */

const CACHE = 'atlas-portal-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('googleapis.com') ||
      e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('cloudinary.com') ||
      e.request.url.includes('cdn.jsdelivr.net')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  let d = { titulo:'Atlas RH', corpo:'Você tem uma nova notificação.', tipo:'geral' };
  try { if (e.data) d = { ...d, ...e.data.json() }; } catch (_) { if (e.data) d.corpo = e.data.text(); }

  const fills = { holerite:'0B1E35', justificativa_aprovada:'059669', justificativa_rejeitada:'DC2626', comunicado:'2563EB', geral:'123482' };
  const fill = fills[d.tipo] || fills.geral;
  const icon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23${fill}'/><text y='46' font-size='36' fill='white' font-family='Arial' x='14'>A</text></svg>`;

  e.waitUntil(self.registration.showNotification(d.titulo, {
    body: d.corpo, icon, badge: icon,
    tag: d.tipo || 'geral', renotify: true, vibrate: [200, 100, 200],
    data: { tipo: d.tipo },
    actions: [{ action:'ver', title:'👁 Ver agora' }]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tipo = e.notification.data?.tipo || 'geral';
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(clients => {
      for (const c of clients) {
        if ('focus' in c) { c.postMessage({ type:'NOTIF_CLICK', tipo }); return c.focus(); }
      }
      return self.clients.openWindow('./');
    })
  );
});
