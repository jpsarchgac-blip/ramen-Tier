'use server'

import { createClient } from '@/lib/supabase/server'

export async function setupUser(payload: {
  displayName: string
  bio: string
  favoriteTypes: string[]
  avatarUrl: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const }

  const domain = user.email?.split('@')[1]
  if (!domain) return { error: 'No email domain' as const }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug')
    .or(`allowed_domain.eq.${domain},allowed_domain.eq.*`)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!org) return { error: 'No organization for this domain' as const }

  const { error } = await supabase
    .from('members')
    .upsert({
      user_id: user.id,
      organization_id: org.id,
      display_name: payload.displayName,
      bio: payload.bio || null,
      favorite_types: payload.favoriteTypes.length > 0 ? payload.favoriteTypes : null,
      avatar_url: payload.avatarUrl || user.user_metadata?.avatar_url || null,
      is_setup_done: true,
    }, { onConflict: 'user_id,organization_id' })

  if (error) return { error: error.message }

  return { orgSlug: org.slug }
}
