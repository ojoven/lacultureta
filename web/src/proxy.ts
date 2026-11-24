import { NextRequest, NextResponse } from 'next/server';
export function proxy(request:NextRequest) {
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-cultureta-language',request.nextUrl.pathname.split('/')[1]==='eu'?'eu':'es');
  return NextResponse.next({request:{headers:requestHeaders}});
}
export const config={matcher:['/((?!api|_next/static|_next/image|fonts|icon.svg|robots.txt|sitemap.xml).*)']};
