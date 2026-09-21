import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

/**
 * GET /api/auth/google-drive
 * Menghasilkan URL otentikasi Google OAuth 2.0 untuk integrasi Google Drive
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "url" | "redirect"
    const returnUrl = searchParams.get("returnUrl") || "/sources";
    const forceMock = searchParams.get("mock") === "true";

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Tentukan origin dan redirect URI
    const urlObj = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${urlObj.protocol}//${urlObj.host}`;
    const redirectUri = `${origin}/api/auth/google-drive/callback`;

    // Jika belum ada kredensial Google Client ID atau dipaksa mock, gunakan rute simulasi OAuth
    const isMock = forceMock || !clientId || !clientSecret;

    let authUrl: string;

    if (isMock) {
      // Alur simulasi ramah pengembangan lokal tanpa perlu konfigurasi Google Cloud Console langsung
      const mockState = Buffer.from(
        JSON.stringify({ returnUrl, isMock: true, timestamp: Date.now() })
      ).toString("base64");
      authUrl = `${origin}/api/auth/google-drive/callback?code=mock_code_${Date.now()}&state=${mockState}&mock=true`;
    } else {
      // Alur otentikasi resmi Google OAuth 2.0
      const state = Buffer.from(
        JSON.stringify({ returnUrl, isMock: false, timestamp: Date.now() })
      ).toString("base64");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: GOOGLE_OAUTH_SCOPES,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      });

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    if (mode === "url" || req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({
        success: true,
        authUrl,
        isConfigured: !isMock,
        mode: isMock ? "sandbox_mock" : "google_oauth_v2",
        scopes: GOOGLE_OAUTH_SCOPES.split(" "),
        redirectUri,
      });
    }

    // Jika diakses langsung via browser redirect
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Error generating Google Drive OAuth URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal membuat URL otentikasi Google Drive",
      },
      { status: 500 }
    );
  }
}
