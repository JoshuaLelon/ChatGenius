import { Auth0Client } from "@auth0/auth0-spa-js"

export const auth0 = new Auth0Client({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN!,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
}) 