import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const bcrypt = require('bcryptjs');

type User = {
  id: string;
  email: string;
  password: string; // Hashed password
  name: string;
  role: string;
};

const providers = [
  CredentialsProvider({
    credentials: {
      email: { label: 'Email Address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (credentials) => {
      try {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password in credentials.');
          return null;
        }

        const response = await axios.post(
          'https://processing-facility-backend.onrender.com/api/login',
          {
            email: credentials.email,
            password: credentials.password,
          }
        );

        console.log("API response:", response.data); // Log the response

        if (response.status === 200) {
          const { id, name, email, role } = response.data.user as User;

          // Here we assume that the API handles password validation
          return { id, name, email, role }; // Include role in the user object
        }

        console.error('Invalid email or password:', response.data.message);
        return null;
      } catch (error) {
        console.error('Error during authentication:', error);
        return null;
      }
    },
  }),
];

export const providerMap = providers.map((provider) => ({
  id: provider.id,
  name: provider.name,
}));

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role as string;
      }
      return token;
    },

    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          role: token.role as string,
        };
      }
      return session;
    },

    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public');

      if (isPublicPage || isLoggedIn) {
        return true;
      }

      return false;
    },
  },
});