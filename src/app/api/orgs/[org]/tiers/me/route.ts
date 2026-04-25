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
  if (!organization) return NextResponse.json([], { status: 200 })

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', organization.id).single()
  if (!member) return NextResponse.json([], { status: 200 })

  const { data } = await supabase
    .from('tier_ratings')
    .select('*, ramen_shops(*)')
    .eq('member_id', member.id)
    .order('updated_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
