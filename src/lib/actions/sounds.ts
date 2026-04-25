'use server'

import { createClient } from '@/lib/supabase/server'

async function requireAdmin(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase, orgId: null }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found', supabase, orgId: null }

  const { data: member } = await supabase
    .from('members').select('role').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: 'Forbidden', supabase, orgId: null }
  }

  return { error: null, supabase, orgId: org.id }
}

export async function uploadBgm(orgSlug: string, formData: FormData) {
  const ctx = await requireAdmin(orgSlug)
  if (ctx.error) return { error: ctx.error }
  const { supabase, orgId } = ctx

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file' }

  const ext = file.name.split('.').pop() ?? 'mp3'
  const path = `${orgId}/bgm.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await supabase.storage
    .from('org-sounds')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage.from('org-sounds').getPublicUrl(path)
  await supabase.from('organizations').update({ bgm_url: urlData.publicUrl }).eq('id', orgId)

  return { url: urlData.publicUrl }
}

export async function saveSounds(orgSlug: string, payload: {
  bgmUrl: string | null
  bgmEnabled: boolean
  bgmVolume: number
}) {
  const ctx = await requireAdmin(orgSlug)
  if (ctx.error) return { error: ctx.error }
  const { supabase, orgId } = ctx

  const { error } = await supabase
    .from('organizations')
    .update({ bgm_url: payload.bgmUrl, bgm_enabled: payload.bgmEnabled, bgm_volume: payload.bgmVolume })
    .eq('id', orgId)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function deleteBgm(orgSlug: string) {
  const ctx = await requireAdmin(orgSlug)
  if (ctx.error) return { error: ctx.error }
  const { supabase, orgId } = ctx

  const { data: orgData } = await supabase.from('organizations').select('bgm_url').eq('id', orgId).single()
  if (orgData?.bgm_url) {
    const path = orgData.bgm_url.split('/org-sounds/')[1]
    if (path) await supabase.storage.from('org-sounds').remove([path])
  }

  const { error } = await supabase
    .from('organizations')
    .update({ bgm_url: null, bgm_enabled: false })
    .eq('id', orgId)

  if (error) return { error: error.message }
  return { ok: true }
}
