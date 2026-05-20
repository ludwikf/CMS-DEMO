import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    stale?: boolean;
  }
}


export async function resolveSessionUserId(
  sessionUserId: string | undefined | null
): Promise<string | null> {
  if (!sessionUserId) return null;
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@mail.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });
        if (!existingUser) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          existingUser.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: existingUser.id.toString(),
          email: existingUser.email,
          role: existingUser.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { id: true, email: true, role: true },
        });
        if (!dbUser) {
          return { ...token, stale: true };
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.stale || !token.id) {
        return { ...session, user: undefined };
      }
      return {
        ...session,
        user: {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
        },
      };
    },
  },
};
