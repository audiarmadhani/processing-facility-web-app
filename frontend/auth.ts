import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import axios from 'axios';

const bcrypt = require('bcryptjs'); // Use bcryptjs for compatibility

// Define the User type to match your user model
type User = {
  id: string; // Change to string if your database uses string IDs
  email: string;
  password: string; // Assuming this will be hashed in the database
  name: string; // Adjust according to your User model
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
          const { id, name, email } = response.data.user;
    
          // Return the user object for the session
          return { id, name, email };
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
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public');

      if (isPublicPage || isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
});