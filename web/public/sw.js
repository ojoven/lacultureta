/* Push only. The agenda always uses current server data. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message={};try{message=event.data?.json()||{};}catch{}
  const title=typeof message.title==='string'?message.title.slice(0,120):'La Cultureta';
  let url='/es';
  try{const target=new URL(message.url||'/es',self.location.origin);if(target.origin===self.location.origin&&/^\/(es|eu)(\/|\?|$)/.test(target.pathname+target.search))url=target.pathname+target.search;}catch{}
  event.waitUntil(self.registration.showNotification(title,{
    body:typeof message.body==='string'?message.body.slice(0,300):'Descubre tus próximos planes en Donostia.',
    icon:'/branding/icon-v2-192.png',badge:'/badge.png',tag:typeof message.tag==='string'?message.tag:'lacultureta',data:{url},
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/es',self.location.origin);
  if(target.origin!==self.location.origin)return;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    for(const client of clients)if(new URL(client.url).origin===self.location.origin){await client.navigate(target.href);return client.focus();}
    return self.clients.openWindow(target.href);
  }));
});
