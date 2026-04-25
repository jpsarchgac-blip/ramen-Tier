import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caption, ramenType, shopId, imageUrls } = await request.json()

  const { data, error } = await supabase
    .from('posts')
    .insert({
      member_id: member.id,
      organization_id: organization.id,
      shop_id: shopId || null,
      caption: caption || null,
      ramen_type: ramenType || null,
      image_urls: imageUrls?.length > 0 ? imageUrls : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
