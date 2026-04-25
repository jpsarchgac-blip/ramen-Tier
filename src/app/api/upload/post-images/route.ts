import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const org = formData.get('org') as string
  const files = formData.getAll('files') as File[]

  if (!files.length || !org) return NextResponse.json({ error: 'Missing files or org' }, { status: 400 })

  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const postId = crypto.randomUUID()
  const urls: string[] = []

  for (const file of files.slice(0, 4)) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${organization.id}/${postId}/${crypto.randomUUID()}.${ext}`
    const buf = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(path, buf, { contentType: file.type })
    if (data) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }
  }

  return NextResponse.json({ urls })
}
