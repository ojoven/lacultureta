import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Analytics } from '@/components/analytics';
export const metadata: Metadata = {
  metadataBase: new URL('https://lacultureta.com'), title:{default:'La Cultureta · Tu próximo gran plan en Donostia',template:'%s · La Cultureta'},
  description:'Descubre la agenda cultural de Donostia. Conciertos, cine, teatro, exposiciones y planes para guardar y vivir.',
  icons:{icon:[{url:'/branding/favicon-v2.ico',sizes:'16x16 32x32 48x48',type:'image/x-icon'},{url:'/branding/icon-v2-192.png',sizes:'192x192',type:'image/png'}],apple:'/branding/apple-touch-icon-v2.png'}, appleWebApp:{capable:true,title:'La Cultureta',statusBarStyle:'default'}, openGraph:{type:'website',siteName:'La Cultureta',locale:'es_ES',title:'La Cultureta · Tu próximo gran plan',description:'La cultura se vive fuera. Descubre todo lo que pasa en Donostia.'},
};
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#f8f9f6'};
export default async function RootLayout({children}:{children:React.ReactNode}) {
  const language=(await headers()).get('x-cultureta-language')==='eu'?'eu':'es';
  return <html lang={language} data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">{language==='eu'?'Joan edukira':'Ir al contenido'}</a>{children}<Analytics/></body></html>;
}
