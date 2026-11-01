const C="mascara-v4";
const SHELL=["/","/icon.svg","/apple-touch-icon.png","/manifest.webmanifest","/icon-192.png","/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||!r.url.startsWith("http"))return;
  if(new URL(r.url).pathname.startsWith("/api/"))return; // datos: siempre de la red
  // HTML: red primero (siempre la última versión), caché si no hay conexión
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put("/",cp));return res}).catch(()=>caches.match("/")));
    return;
  }
  // Resto (iconos, fuentes): caché al instante y se actualiza en segundo plano
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok||res.type==="opaque"){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
    return hit||net;
  }));
});

/* Recordatorio diario: notificación con "Sí" / "No" */
self.addEventListener("push",e=>{
  let d={};try{d=e.data.json()}catch(_){}
  e.waitUntil(self.registration.showNotification(d.title||"Máscara LED",{
    body:d.body||"¿Te has puesto la máscara hoy?",
    icon:"/icon-192.png",badge:"/badge-96.png",tag:"recordatorio",renotify:true,requireInteraction:true,
    actions:[{action:"yes",title:"Sí"},{action:"no",title:"No"}]
  }));
});
const pad=n=>String(n).padStart(2,"0");
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  if(e.action==="no")return;
  const work=(async()=>{
    const wins=await clients.matchAll({type:"window",includeUncontrolled:true});
    if(e.action==="yes"){
      const day=today();
      try{await fetch("/api/marks",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({day})})}catch(_){}
      wins.forEach(w=>w.postMessage({type:"marked",day}));
      return;
    }
    // Toque en la notificación (o iOS, sin botones): abrir la app
    if(wins.length)return wins[0].focus();
    return clients.openWindow("/");
  })();
  e.waitUntil(work);
});
