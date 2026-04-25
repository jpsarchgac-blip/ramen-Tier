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
    .from('members').select('role').eq('user_id', user.id).eq('organization_id', organization.id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'mp3'
  const path = `${organization.id}/bgm.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from('org-sounds')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('org-sounds').getPublicUrl(path)

  // Update org bgm_url
  await supabase.from('organizations').update({ bgm_url: urlData.publicUrl }).eq('id', organization.id)

  return NextResponse.json({ url: urlData.publicUrl })
}
