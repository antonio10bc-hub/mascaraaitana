const C="mascara-v3";
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
