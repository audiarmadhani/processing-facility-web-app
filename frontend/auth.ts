import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import axios from 'axios';

const bcrypt = require('bcryptjs'); // Use bcryptjs for compatibility

// Define the User type to match your user model
type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string; // Add the 'role' property
};

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: 'Email Address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: async (credentials) => {
      try {
        // Validate credentials
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password in credentials.');
          return null;
        }
    
        // Call the login API with the provided credentials
        const response = await axios.post(
          'https://processing-facility-backend.onrender.com/api/login',
          {
            email: credentials.email,
            password: credentials.password,
          }
        );
    
        if (response.status === 200) {
          const { id, name, email, role } = response.data.user; // Ensure role is returned from the API
    
          // Return the user object for the session
          return { id, name, email, role };
        }
    
        console.error('Invalid email or password.');
        return null;
      } catch (error) {
        console.error('Error during authentication:', error);
        return null;
      }
    },
  }),
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === 'function') {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  }
  return { id: provider.id, name: provider.name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Attach the role to the JWT token
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the role to the session
      if (token) {
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
});