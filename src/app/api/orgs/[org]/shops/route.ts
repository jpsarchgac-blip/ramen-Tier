import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await supabase
    .from('ramen_shops')
    .select('*')
    .eq('organization_id', organization.id)
    .order('name')

  return NextResponse.json(data ?? [])
}

export async function POST(
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

  const { data, error } = await supabase
    .from('ramen_shops')
    .upsert({
      organization_id: organization.id,
      google_place_id: body.placeId || null,
      name: body.name,
      address: body.address || null,
      lat: body.lat || null,
      lng: body.lng || null,
      ramen_type: body.ramenTypes?.length > 0 ? body.ramenTypes : null,
      photo_url: body.photoUrl || null,
      added_by: member.id,
    }, { onConflict: 'organization_id,google_place_id', ignoreDuplicates: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
