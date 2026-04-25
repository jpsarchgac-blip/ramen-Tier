'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadPostImages(orgSlug: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', urls: [] }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found', urls: [] }

  const files = formData.getAll('files') as File[]
  if (!files.length) return { error: 'No files', urls: [] }

  const postId = crypto.randomUUID()
  const urls: string[] = []

  for (const file of files.slice(0, 4)) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${org.id}/${postId}/${crypto.randomUUID()}.${ext}`
    const buf = await file.arrayBuffer()
    const { data } = await supabase.storage
      .from('post-images')
      .upload(path, buf, { contentType: file.type })
    if (data) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }
  }

  return { urls }
}
