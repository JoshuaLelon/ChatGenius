import { auth0 } from "./config"
import { JWTVerifyResult, jwtVerify } from "jose"

export async function getSession(request: Request) {
  const token = request.headers.get("authorization")?.split(" ")[1]
  if (!token) return null

  try {
    const user = await validateToken(token)
    return user ? { user } : null
  } catch (error) {
    console.error("Session validation failed:", error)
    return null
  }
}

export async function validateToken(token: string): Promise<JWTVerifyResult | null> {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH0_SECRET)
    const result = await jwtVerify(token, secret, {
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    })
    return result
  } catch (error) {
    console.error("Token validation failed:", error)
    return null
  }
}

export async function handleCallback(request: Request) {
  try {
    const { code, state } = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    )

    if (!code || !state) {
      throw new Error("Missing code or state parameter")
    }

    const token = await auth0.getTokenSilently({
      authorizationParams: {
        code,
        state,
      },
    })

    return { token }
  } catch (error) {
    console.error("Auth callback failed:", error)
    throw error
  }
} 