'use server'

import { createClient } from '@/lib/supabase/server'

export async function getShops(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return []

  const { data } = await supabase
    .from('ramen_shops')
    .select('*')
    .eq('organization_id', org.id)
    .order('name')

  return data ?? []
}

export async function getMyShops(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return []

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return []

  const { data } = await supabase
    .from('tier_ratings')
    .select('ramen_shops(*)')
    .eq('member_id', member.id)
    .order('updated_at', { ascending: false })

  return (data ?? []).map((r: any) => r.ramen_shops).filter(Boolean)
}
