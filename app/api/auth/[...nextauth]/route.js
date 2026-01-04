import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import WorkspaceMember from '@/models/WorkspaceMember';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();

        // Find user with password field explicitly selected
        const user = await User.findOne({ email: credentials.email.toLowerCase() })
          .select('+password')
          .lean();

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Compare password using bcrypt
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Get user's default workspace (first one they're a member of)
        const membership = await WorkspaceMember.findOne({ userId: user._id })
          .populate('workspaceId', 'slug name')
          .lean();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          onboardingCompleted: user.onboardingCompleted || false,
          defaultWorkspace: membership?.workspaceId
            ? {
                id: membership.workspaceId._id.toString(),
                slug: membership.workspaceId.slug,
                name: membership.workspaceId.name,
              }
            : null,
        };
      },
    }),
    // Google OAuth can be added later
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-in',
    error: '/sign-in',
    newUser: '/onboarding',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.onboardingCompleted = user.onboardingCompleted;
        token.defaultWorkspace = user.defaultWorkspace;
      }

      // Handle session updates (e.g., workspace switch, onboarding complete)
      if (trigger === 'update') {
        if (session?.currentWorkspace) {
          token.currentWorkspace = session.currentWorkspace;
        }
        if (session?.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session?.defaultWorkspace) {
          token.defaultWorkspace = session.defaultWorkspace;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.defaultWorkspace = token.defaultWorkspace;
        session.user.currentWorkspace = token.currentWorkspace || token.defaultWorkspace;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
