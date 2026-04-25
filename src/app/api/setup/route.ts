import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { displayName, bio, favoriteTypes, avatarUrl } = await request.json()

  // Find the organization matching user's email domain
  const domain = user.email?.split('@')[1]
  if (!domain) return NextResponse.json({ error: 'No email domain' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('allowed_domain', domain)
    .single()

  if (!org) return NextResponse.json({ error: 'No organization for this domain' }, { status: 404 })

  // Upsert member
  const { data: member, error } = await supabase
    .from('members')
    .upsert({
      user_id: user.id,
      organization_id: org.id,
      display_name: displayName,
      bio: bio || null,
      favorite_types: favoriteTypes.length > 0 ? favoriteTypes : null,
      avatar_url: avatarUrl || user.user_metadata?.avatar_url || null,
      is_setup_done: true,
    }, { onConflict: 'user_id,organization_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ orgSlug: org.slug, member })
}
