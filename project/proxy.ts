// TODO: Task 2.2 - Configure authentication middleware for route protection
// import { authMiddleware } from "@clerk/nextjs"

// NOTE: Next.js 16+ - The "middleware" file convention is deprecated.
// When implementing authentication, consider using the new "proxy" pattern.
// Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

// Placeholder middleware - currently allows all routes for development
// TODO: Replace with actual Clerk authMiddleware when authentication is implemented
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Define the routes that require a user to be logged in
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/projects(.*)",
  "/team(.*)",
  "/analytics(.*)",
  "/calendar(.*)",
  "/settings(.*)",
]);

// 2. Execute the Proxy (formerly middleware)
export default clerkMiddleware(async (auth, req) => {
  // If the user tries to access a protected route, force them to sign in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// 3. Configure the matcher (Skip Next.js internals and static files)
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

/*
TODO: Task 2.2 Implementation Notes for Interns:
- Install and configure Clerk
- Set up authMiddleware to protect routes
- Configure public routes: ["/", "/sign-in", "/sign-up"]
- Protect all dashboard routes: ["/dashboard", "/projects"]
- Add proper redirects for unauthenticated users

Example implementation when ready:
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: [],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
*/
