'use server'

import { createClient } from '@/lib/supabase/server'

export async function getFeed(orgSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return []

  const { data } = await supabase
    .from('posts')
    .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

export async function createPost(orgSlug: string, payload: {
  caption: string
  ramenType: string
  shopId: string | null
  imageUrls: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      member_id: member.id,
      organization_id: org.id,
      shop_id: payload.shopId || null,
      caption: payload.caption || null,
      ramen_type: payload.ramenType || null,
      image_urls: payload.imageUrls?.length > 0 ? payload.imageUrls : null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function toggleLike(orgSlug: string, postId: string, liked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data: member } = await supabase
    .from('members').select('id').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' }

  if (liked) {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, member_id: member.id })
    if (error && error.code !== '23505') return { error: error.message }
  } else {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('member_id', member.id)
    if (error) return { error: error.message }
  }

  return { ok: true }
}

export async function addComment(orgSlug: string, postId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) return { error: 'Not found' }

  const { data: member } = await supabase
    .from('members').select('id, display_name, avatar_url').eq('user_id', user.id).eq('organization_id', org.id).single()
  if (!member) return { error: 'Forbidden' }

  if (!body?.trim()) return { error: 'Body required' }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, member_id: member.id, body })
    .select('*, members(id, display_name, avatar_url)')
    .single()

  if (error) return { error: error.message }
  return { data }
}
