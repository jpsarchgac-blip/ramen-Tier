import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export default async function FeedPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, bgm_url, bgm_enabled, bgm_volume')
    .eq('slug', org)
    .single()
  if (!organization) return <div>組織が見つかりません</div>

  const { data: myMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user!.id)
    .eq('organization_id', organization.id)
    .single()

  let posts: any[] = []
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (postsError) {
    const { data: fallback } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name)')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(20)
    posts = (fallback ?? []).map((p: any) => ({ ...p, post_likes: [], post_comments: [] }))
  } else {
    posts = postsData ?? []
  }

  return (
    <FeedClient
      org={org}
      initialPosts={posts as any}
      myMemberId={myMember!.id}
      bgmUrl={organization.bgm_enabled ? organization.bgm_url : null}
      bgmVolume={organization.bgm_volume}
    />
  )
}
