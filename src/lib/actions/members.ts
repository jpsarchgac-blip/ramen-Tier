'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateMember(orgSlug: string, payload: {
  displayName: string
  bio: string
  favoriteTypes: string[]
  favoriteShopId: string | null
  tierPublic: boolean
  avatarUrl: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data, error } = await supabase
    .from('members')
    .update({
      display_name: payload.displayName,
      bio: payload.bio || null,
      favorite_types: payload.favoriteTypes,
      favorite_shop_id: payload.favoriteShopId || null,
      tier_public: payload.tierPublic,
      avatar_url: payload.avatarUrl || null,
    })
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deleteAccount(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('user_id', user.id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }
  await supabase.auth.signOut()
  return { ok: true }
}
