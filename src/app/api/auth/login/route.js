import { NextResponse } from "next/server";
import { signSession, comparePassword, COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const envUsername = process.env.APP_USERNAME || "admin";
    let envPasswordHash = process.env.APP_PASSWORD_HASH;
    if (envPasswordHash && !envPasswordHash.startsWith("$2")) {
      try {
        const decoded = Buffer.from(envPasswordHash, "base64").toString("utf-8");
        if (decoded.startsWith("$2")) {
          envPasswordHash = decoded;
        }
      } catch (e) {}
    }

    if (!envPasswordHash) {
      return NextResponse.json(
        { error: "APP_PASSWORD_HASH belum dikonfigurasi di file .env" },
        { status: 500 }
      );
    }

    if (username !== envUsername) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const isMatch = comparePassword(password, envPasswordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const token = await signSession({ username });

    const response = NextResponse.json({
      success: true,
      user: { username },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
