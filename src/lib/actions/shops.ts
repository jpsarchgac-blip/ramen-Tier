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
