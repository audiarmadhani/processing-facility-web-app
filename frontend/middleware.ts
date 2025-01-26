export { auth as middleware } from './auth';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|auth/signin|auth/signup).*)', // Exclude auth/signin and auth/signup
  ],
};