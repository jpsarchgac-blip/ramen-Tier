import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getContext(org: string, userId: string, supabase: any) {
  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) return null
  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', userId).eq('organization_id', organization.id).single()
  return member ? { orgId: organization.id, memberId: member.id } : null
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ org: string; postId: string }> }
) {
  const { org, postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getContext(org, user.id, supabase)
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, member_id: ctx.memberId })

  if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string; postId: string }> }
) {
  const { org, postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getContext(org, user.id, supabase)
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('member_id', ctx.memberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
