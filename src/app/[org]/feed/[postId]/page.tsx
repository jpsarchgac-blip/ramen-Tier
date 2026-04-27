import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import CommentSection from './CommentSection'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ org: string; postId: string }>
}) {
  const { org, postId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase.from('organizations').select('id').eq('slug', org).single()
  if (!organization) notFound()

  const { data: myMember } = await supabase
    .from('members').select('id').eq('user_id', user!.id).eq('organization_id', organization.id).single()

  let post: any = null
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
    .eq('id', postId)
    .single()

  if (postError || !postData) {
    const { data: fallback } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name)')
      .eq('id', postId)
      .single()
    post = fallback ? { ...fallback, post_likes: [], post_comments: [] } : null
  } else {
    post = postData
  }

  if (!post) notFound()
  if (!myMember) notFound()

  const { data: comments } = await supabase
    .from('post_comments')
    .select('*, members(id, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link href={`/${org}/feed`} className="flex items-center gap-1 text-sm text-[#9C9688] hover:text-[#1C1A16]">
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        フィードに戻る
      </Link>

      <PostCard post={post as any} org={org} myMemberId={myMember.id} />

      <CommentSection
        org={org}
        postId={postId}
        initialComments={(comments ?? []) as any}
        myMemberId={myMember.id}
      />
    </div>
  )
}
