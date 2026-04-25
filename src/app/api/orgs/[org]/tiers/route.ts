import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT: upsert tier rating (create shop if needed)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', organization.id).single()
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const body = await request.json()
  let shopId = body.shopId

  // If new shop data provided, create/find the shop first
  if (body.shop) {
    const { data: shop, error: shopError } = await supabase
      .from('ramen_shops')
      .upsert({
        organization_id: organization.id,
        google_place_id: body.shop.placeId || null,
        name: body.shop.name,
        address: body.shop.address || null,
        lat: body.shop.lat || null,
        lng: body.shop.lng || null,
        ramen_type: body.shop.ramenTypes?.length > 0 ? body.shop.ramenTypes : null,
        photo_url: body.shop.photoUrl || null,
        added_by: member.id,
      }, { onConflict: 'organization_id,google_place_id', ignoreDuplicates: false })
      .select('id')
      .single()

    if (shopError || !shop) {
      // If upsert failed due to null place_id conflict, insert directly
      const { data: newShop, error: insertError } = await supabase
        .from('ramen_shops')
        .insert({
          organization_id: organization.id,
          google_place_id: null,
          name: body.shop.name,
          address: body.shop.address || null,
          ramen_type: body.shop.ramenTypes?.length > 0 ? body.shop.ramenTypes : null,
          added_by: member.id,
        })
        .select('id')
        .single()
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
      shopId = newShop!.id
    } else {
      shopId = shop.id
    }
  }

  if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('tier_ratings')
    .upsert({
      member_id: member.id,
      shop_id: shopId,
      organization_id: organization.id,
      tier: body.tier,
      score_noodle: body.scores?.noodle ?? null,
      score_soup: body.scores?.soup ?? null,
      score_toppings: body.scores?.toppings ?? null,
      score_wait: body.scores?.wait ?? null,
      score_speed: body.scores?.speed ?? null,
      score_location: body.scores?.location ?? null,
      highlights: body.highlights?.length > 0 ? body.highlights : null,
      comment: body.comment || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id,shop_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
