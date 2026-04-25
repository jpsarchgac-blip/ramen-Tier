'use server'

import { createClient } from '@/lib/supabase/server'

async function getOrgAndMember(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, supabase, user: null, org: null, member: null }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' as const, supabase, user, org: null, member: null }

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' as const, supabase, user, org, member: null }

  return { error: null, supabase, user, org, member }
}

export async function upsertTier(orgSlug: string, body: {
  shopId?: string
  shop?: {
    placeId: string | null
    name: string
    address: string
    lat: number | null
    lng: number | null
    photoUrl: string | null
    ramenTypes: string[]
  }
  tier: string
  scores?: Record<string, number | null>
  highlights?: string[]
  comment?: string
}) {
  const ctx = await getOrgAndMember(orgSlug)
  if (ctx.error) return { error: ctx.error }
  const { supabase, org, member } = ctx

  let shopId = body.shopId

  if (body.shop) {
    const { data: shop, error: shopError } = await supabase
      .from('ramen_shops')
      .upsert({
        organization_id: org!.id,
        google_place_id: body.shop.placeId || null,
        name: body.shop.name,
        address: body.shop.address || null,
        lat: body.shop.lat || null,
        lng: body.shop.lng || null,
        ramen_type: body.shop.ramenTypes?.length > 0 ? body.shop.ramenTypes : null,
        photo_url: body.shop.photoUrl || null,
        added_by: member!.id,
      }, { onConflict: 'organization_id,google_place_id', ignoreDuplicates: false })
      .select('id')
      .single()

    if (shopError || !shop) {
      const { data: newShop, error: insertError } = await supabase
        .from('ramen_shops')
        .insert({
          organization_id: org!.id,
          google_place_id: null,
          name: body.shop.name,
          address: body.shop.address || null,
          ramen_type: body.shop.ramenTypes?.length > 0 ? body.shop.ramenTypes : null,
          added_by: member!.id,
        })
        .select('id')
        .single()
      if (insertError) return { error: insertError.message }
      shopId = newShop!.id
    } else {
      shopId = shop.id
    }
  }

  if (!shopId) return { error: 'shopId required' }

  const { data, error } = await supabase
    .from('tier_ratings')
    .upsert({
      member_id: member!.id,
      shop_id: shopId,
      organization_id: org!.id,
      tier: body.tier,
      score_noodle: body.scores?.noodle ?? null,
      score_soup: body.scores?.soup ?? null,
      score_toppings: body.scores?.toppings ?? null,
      score_wait: body.scores?.wait ?? null,
      score_speed: body.scores?.speed ?? null,
      score_location: body.scores?.location ?? null,
      highlights: body.highlights?.length ? body.highlights : null,
      comment: body.comment || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id,shop_id' })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function deleteTier(orgSlug: string, shopId: string) {
  const ctx = await getOrgAndMember(orgSlug)
  if (ctx.error) return { error: ctx.error }
  const { supabase, member } = ctx

  const { error } = await supabase
    .from('tier_ratings')
    .delete()
    .eq('member_id', member!.id)
    .eq('shop_id', shopId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function getMyTiers(orgSlug: string) {
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
    .select('*, ramen_shops(*)')
    .eq('member_id', member.id)
    .order('updated_at', { ascending: false })

  return data ?? []
}
