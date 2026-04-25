'use server'

import { createClient } from '@/lib/supabase/server'

export async function addToWishlist(orgSlug: string, shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' }

  const { error } = await supabase
    .from('wish_list')
    .insert({ member_id: member.id, shop_id: shopId, organization_id: org.id })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function removeFromWishlist(orgSlug: string, shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' }

  const { error } = await supabase
    .from('wish_list')
    .delete()
    .eq('member_id', member.id)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }
  return { ok: true }
}
