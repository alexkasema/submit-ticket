import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { logEvent } from "@/utils/sentry";

//! convert the secret to a Uint8Array to work with jose
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const cookieName = "auth-token";

//! take the payload and sign it with the secret
//! Encrypt and sign token
export const signAuthToken = async (payload: any) => {
  try {
    //! encrypt the payload with the secret
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return token;
  } catch (error) {
    logEvent("Token signing failed", "auth", { payload }, "error", error);
    throw new Error("Token signing failed");
  }
};

//! verify the token and return the payload
//! Decrypt and verify token
export const verifyAuthToken = async <T>(token: string): Promise<T> => {
  try {
    const { payload } = await jwtVerify(token, secret);

    return payload as T;
  } catch (error) {
    logEvent(
      "Token decryption failed",
      "auth",
      { tokenSnippet: token.slice(0, 10) },
      "error",
      error
    );
    throw new Error("Token decryption failed");
  }
};

//! put the token in the cookie
//! Set the auth cookie
//! send it with every request to get validated/decrypted
export const setAuthCookie = async (token: string) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Days
    });
  } catch (error) {
    logEvent("Failed to set cookie", "auth", { token }, "error", error);
  }
};

//! Get auth token from cookie
export const getAuthCookie = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName);
  return token?.value;
};

//! Remove auth token cookie
export const removeAuthCookie = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
  } catch (error) {
    logEvent("Failed to remove the auth cookie", "auth", {}, "error", error);
  }
};
