import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { getDb } from './lib/db';

// 懒加载 adapter，避免 build 阶段触发数据库连接
function getAdapter() {
  return PrismaAdapter(getDb());
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => ({
  adapter: getAdapter(),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
}));
