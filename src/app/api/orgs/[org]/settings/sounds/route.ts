import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: any, userId: string, orgSlug: string) {
  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!organization) return null
  const { data: member } = await supabase
    .from('members').select('role').eq('user_id', userId).eq('organization_id', organization.id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) return null
  return organization.id
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('organizations')
    .select('bgm_url, bgm_enabled, bgm_volume')
    .eq('slug', org)
    .single()

  return NextResponse.json(data ?? {})
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await requireAdmin(supabase, user.id, org)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { bgmUrl, bgmEnabled, bgmVolume } = await request.json()

  const { error } = await supabase
    .from('organizations')
    .update({ bgm_url: bgmUrl, bgm_enabled: bgmEnabled, bgm_volume: bgmVolume })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  const { org } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await requireAdmin(supabase, user.id, org)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: orgData } = await supabase.from('organizations').select('bgm_url').eq('id', orgId).single()
  if (orgData?.bgm_url) {
    const path = orgData.bgm_url.split('/org-sounds/')[1]
    if (path) await supabase.storage.from('org-sounds').remove([path])
  }

  const { error } = await supabase
    .from('organizations')
    .update({ bgm_url: null, bgm_enabled: false })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
