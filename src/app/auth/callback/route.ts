import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if setup is done
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('is_setup_done, organization_id, organizations(slug)')
          .eq('user_id', user.id)
          .single()

        if (member) {
          const org = member.organizations as unknown as { slug: string } | null
          if (!member.is_setup_done) {
            return NextResponse.redirect(`${origin}/setup`)
          }
          if (org?.slug) {
            return NextResponse.redirect(`${origin}/${org.slug}/dashboard`)
          }
        }
        return NextResponse.redirect(`${origin}/setup`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
