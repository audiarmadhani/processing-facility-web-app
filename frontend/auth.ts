import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const bcrypt = require('bcryptjs'); // Use bcryptjs for compatibility

// Define the User type to include role
type User = {
  id: string;
  email: string;
  password: string; // Hashed password
  name: string;
  role: string; // User role (e.g., 'admin', 'user')
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
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

          // Call the login API with the provided credentials
          const response = await axios.post(
            'https://processing-facility-backend.onrender.com/api/login',
            {
              email: credentials.email,
              password: credentials.password,
            }
          );

          if (response.status === 200) {
            const { id, name, email, role } = response.data.user as User; // Assert the type here

            // Validate password using bcrypt
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              response.data.user.password
            );

            if (isPasswordValid) {
              return { id, name, email, role }; // Include role in the user object
            } else {
              console.error('Invalid password.');
              return null;
            }
          }

          console.error('Invalid email or password.');
          return null;
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin', // Redirect to this page if unauthorized
  },
  callbacks: {
    // Add the role to the JWT token
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role as string; // Assert the type here
      }
      return token;
    },

    // Make the role available in the session
    session: async ({ session, token }) => {
      if (token) {
        session.user = {
          ...session.user,
          role: token.role as string, // Assert the type here
        };
      }
      return session;
    },

    // Handle route authorization
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith('/public'); // Example public route

      if (isPublicPage || isLoggedIn) {
        return true; // Allow access if it's a public page or the user is logged in
      }

      return false; // Deny access for unauthenticated users
    },
  },
});