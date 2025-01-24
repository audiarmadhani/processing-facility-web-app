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

        // Fetch the list of users from the API
        const response = await axios.get('https://processing-facility-backend.onrender.com/api/');
        const users: User[] = response.data; // Ensure the users array is typed

        // Find the user with the matching email
        const user = users.find((u: User) => u.email === credentials.email);
        if (!user) {
          console.error('No user found with the provided email.');
          return null;
        }

        // Validate the password
        if (!user.password) {
          console.error('User password is missing in the API response.');
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (isPasswordValid) {
          // Return the user object for the session
          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
          };
        } else {
          console.error('Invalid password.');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }

      return null; // Return null if no user found or credentials are incorrect
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