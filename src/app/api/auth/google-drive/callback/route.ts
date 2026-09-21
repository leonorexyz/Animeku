import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google-drive/callback
 * Menerima callback dari alur otentikasi Google OAuth 2.0 atau mock callback,
 * menukar authorization code dengan access token & refresh token,
 * serta menyimpan status koneksi ke tabel connected_sources.
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const isMock = searchParams.get("mock") === "true";

    const urlObj = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${urlObj.protocol}//${urlObj.host}`;

    let returnUrl = "/sources";
    if (stateParam) {
      try {
        const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString("utf-8"));
        if (decoded.returnUrl) returnUrl = decoded.returnUrl;
      } catch (e) {
        // Abaikan error decoding state
      }
    }

    // Tangani jika pengguna membatalkan atau terjadi error pada otorisasi
    if (errorParam) {
      console.warn("Google Drive OAuth error:", errorParam);
      return NextResponse.redirect(
        `${origin}${returnUrl}?error=${encodeURIComponent(
          "Otorisasi Google Drive dibatalkan atau gagal: " + errorParam
        )}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}${returnUrl}?error=${encodeURIComponent("Authorization code tidak ditemukan")}`
      );
    }

    let accessToken = "mock_access_token_" + Date.now();
    let refreshToken = "mock_refresh_token_" + Date.now();
    let userEmail = "animeku.personal@gmail.com";

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/google-drive/callback`;

    // Jika mode live nyata dengan Google OAuth
    if (!isMock && clientId && clientSecret) {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error("Token exchange failed:", errText);
        return NextResponse.redirect(
          `${origin}${returnUrl}?error=${encodeURIComponent("Gagal menukar token dengan Google OAuth")}`
        );
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        refreshToken = tokenData.refresh_token;
      }

      // Ambil profil pengguna (email)
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          if (userInfo.email) {
            userEmail = userInfo.email;
          }
        }
      } catch (profileErr) {
        console.warn("Failed to fetch user profile, using default label:", profileErr);
      }
    }

    const defaultUserId = "user-default";
    const now = new Date().toISOString();

    // Periksa apakah koneksi drive sudah pernah ada untuk user ini
    const existingConnections = await db
      .select()
      .from(schema.connectedSources)
      .where(
        and(
          eq(schema.connectedSources.userId, defaultUserId),
          eq(schema.connectedSources.provider, "drive")
        )
      )
      .limit(1);

    if (existingConnections.length > 0) {
      await db
        .update(schema.connectedSources)
        .set({
          accountLabel: userEmail,
          accessToken,
          refreshToken,
          createdAt: now,
        })
        .where(eq(schema.connectedSources.id, existingConnections[0].id));
    } else {
      const sourceId = `cs-drive-${Date.now()}`;
      await db.insert(schema.connectedSources).values({
        id: sourceId,
        userId: defaultUserId,
        provider: "drive",
        accountLabel: userEmail,
        accessToken,
        refreshToken,
        createdAt: now,
      });
    }

    // Jika request menginginkan respon JSON
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({
        success: true,
        message: "Google Drive berhasil terhubung",
        accountLabel: userEmail,
        provider: "drive",
      });
    }

    // Alihkan kembali ke halaman sumber dengan query param keberhasilan
    const redirectTarget = new URL(returnUrl, origin);
    redirectTarget.searchParams.set("connected", "google-drive");
    redirectTarget.searchParams.set("email", userEmail);

    return NextResponse.redirect(redirectTarget.toString());
  } catch (error: any) {
    console.error("Google Drive OAuth callback error:", error);
    const urlObj = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${urlObj.protocol}//${urlObj.host}`;
    return NextResponse.redirect(
      `${origin}/sources?error=${encodeURIComponent(error?.message || "Terjadi kesalahan sistem saat proses callback OAuth")}`
    );
  }
}
