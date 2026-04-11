import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = NextAuth(authOptions)

type AuthRouteContext = {
  params: Promise<{ nextauth?: string | string[] }>
}

const hasResolvedAuthParams = async (context: AuthRouteContext) => {
  const params = await context.params
  if (Array.isArray(params?.nextauth)) {
    return params.nextauth.length > 0
  }

  return typeof params?.nextauth === "string" && params.nextauth.length > 0
}

export async function GET(request: Request, context: AuthRouteContext) {
  if (!(await hasResolvedAuthParams(context))) {
    return new Response(null, { status: 204 })
  }

  return handler(request, context as any)
}

export async function POST(request: Request, context: AuthRouteContext) {
  if (!(await hasResolvedAuthParams(context))) {
    return new Response(null, { status: 204 })
  }

  return handler(request, context as any)
}
