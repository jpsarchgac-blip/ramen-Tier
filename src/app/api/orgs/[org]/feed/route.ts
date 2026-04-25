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

  const { data } = await supabase
    .from('posts')
    .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json(data ?? [])
}
