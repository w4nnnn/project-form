import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes - only superadmin can access
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "superadmin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Forms management routes - only admin and superadmin can access
    if (pathname.startsWith("/forms") && !pathname.startsWith("/forms/fill")) {
      if (token?.role !== "superadmin" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/forms/:path*",
    "/my-forms/:path*",
    "/my-responses/:path*",
  ],
};
