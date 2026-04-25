import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string; shopId: string }> }
) {
  const { org, shopId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', organization.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('wish_list')
    .delete()
    .eq('member_id', member.id)
    .eq('shop_id', shopId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
