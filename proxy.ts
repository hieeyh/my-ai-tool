import { auth } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const session = await auth();
  const isLoggedIn = !!session;
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth');

  // 放行认证相关路由
  if (isApiAuth) return NextResponse.next();

  // 未登录且不在登录页 → 跳转到登录页
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 已登录但在登录页 → 跳转到首页
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
