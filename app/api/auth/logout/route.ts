import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no logout:", error.message)
      return NextResponse.json(
        { error: "Erro ao fazer logout", details: error.message },
        { status: 500 }
      )
    }

    console.log("✅ Logout realizado com sucesso")

    // Return success response
    return NextResponse.json(
      { message: "Logout realizado com sucesso" },
      { 
        status: 200,
        headers: {
          // Clear any additional cookies if needed
          'Set-Cookie': [
            'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
            'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
          ].join(', ')
        }
      }
    )
  } catch (error) {
    console.error("❌ Erro inesperado no logout:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Also support GET for direct logout links
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    const redirectURL = new URL("/", request.url)
    
    if (error) {
      console.error("❌ Erro no logout:", error.message)
      redirectURL.pathname = "/login"
      redirectURL.searchParams.set("error", "logout-failed")
      redirectURL.searchParams.set("error_description", error.message)
    } else {
      console.log("✅ Logout realizado com sucesso")
      redirectURL.searchParams.set("message", "logout-success")
    }

    return NextResponse.redirect(redirectURL, {
      status: 303,
      headers: {
        // Clear cookies on redirect
        'Set-Cookie': [
          'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
          'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
        ].join(', ')
      }
    })
  } catch (error) {
    console.error("❌ Erro inesperado no logout:", error)
    const redirectURL = new URL("/login", request.url)
    redirectURL.searchParams.set("error", "logout-failed")
    return NextResponse.redirect(redirectURL, { status: 303 })
  }
}
