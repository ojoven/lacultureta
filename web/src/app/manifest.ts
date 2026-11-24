import type { MetadataRoute } from 'next';
export default function manifest():MetadataRoute.Manifest {
  return {id:'/',name:'La Cultureta · Donostia',short_name:'La Cultureta',description:'Tu agenda cultural de Donostia. Descubre y guarda tus próximos planes.',start_url:'/es',scope:'/',display:'standalone',background_color:'#f8f9f6',theme_color:'#f8f9f6',lang:'es',icons:[{src:'/branding/icon-v2-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/branding/icon-v2-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/branding/icon-v2-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]};
}
