import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";
import { headers, cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/login
 * Custom credentials login endpoint with rate limiting
 * Prevents brute force attacks on the login endpoint
 * 
 * Rate limit: 5 login attempts per 15 minutes per IP
 */
export async function POST(req: NextRequest) {
  await headers();
  await cookies();
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Rate limiting: 5 attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(req, 'login');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          remaining: rateLimit.remaining,
          retryAfter: rateLimit.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 900), // 15 minutes in seconds
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(new Date(rateLimit.resetTime).toISOString()),
          }
        }
      );
    }

    // Attempt sign-in using NextAuth
    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (!result || result.error) {
      return NextResponse.json(
        { 
          error: "Invalid email or password",
          remaining: rateLimit.remaining - 1, // Shows user how many attempts left (approximate)
        },
        { status: 401 }
      );
    }

    if (result.ok) {
      return NextResponse.json(
        { 
          message: "Login successful",
          remaining: rateLimit.remaining,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );

  } catch (error) {
    console.error("[Auth] Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/login
 * Return rate limit status for email (useful for frontend to show warning)
 */
export async function GET(req: NextRequest) {
  await headers();
  await cookies();
  try {
    const rateLimit = checkRateLimit(req, 'login');
    
    return NextResponse.json({
      allowed: rateLimit.allowed,
      remaining: rateLimit.remaining,
      resetTime: new Date(rateLimit.resetTime).toISOString(),
      retryAfter: rateLimit.retryAfter,
    });
  } catch (error) {
    console.error("[Auth] Login status error:", error);
    return NextResponse.json(
      { error: "Failed to check login status" },
      { status: 500 }
    );
  }
}
