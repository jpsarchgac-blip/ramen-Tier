import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { displayName, bio, favoriteTypes, favoriteShopId, tierPublic, avatarUrl } = await request.json()

  const { data, error } = await supabase
    .from('members')
    .update({
      display_name: displayName,
      bio: bio || null,
      favorite_types: favoriteTypes,
      favorite_shop_id: favoriteShopId || null,
      tier_public: tierPublic,
      avatar_url: avatarUrl || null,
    })
    .eq('user_id', user.id)
    .eq('organization_id', organization.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
