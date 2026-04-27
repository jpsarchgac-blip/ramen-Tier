'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import PostCard from '@/components/PostCard'
import HelpTooltip from '@/components/HelpTooltip'

const PostCreateModal = dynamic(() => import('@/components/PostCreateModal'), { ssr: false })
const BgmPlayer = dynamic(() => import('@/components/BgmPlayer'), { ssr: false })

interface FeedClientProps {
  org: string
  initialPosts: any[]
  myMemberId: string
  bgmUrl: string | null
  bgmVolume: number
}

export default function FeedClient({ org, initialPosts, myMemberId, bgmUrl, bgmVolume }: FeedClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadPosts = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: orgData } = await supabase
      .from('organizations').select('id').eq('slug', org).single()
    if (!orgData) { setLoading(false); return }

    // Try with org filter + all joins
    const { data: d1 } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name), post_likes(member_id), post_comments(id)')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (d1 && d1.length > 0) { setPosts(d1); setLoading(false); return }

    // Try without post_likes/post_comments (those joins may cause issues)
    const { data: d2 } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name)')
      .eq('organization_id', orgData.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (d2 && d2.length > 0) {
      setPosts(d2.map(p => ({ ...p, post_likes: [], post_comments: [] })))
      setLoading(false); return
    }

    // Try without org filter (rely on RLS only)
    const { data: d3 } = await supabase
      .from('posts')
      .select('*, members(id, display_name, avatar_url), ramen_shops(id, name)')
      .order('created_at', { ascending: false })
      .limit(20)
    if (d3 && d3.length > 0) {
      setPosts(d3.map(p => ({ ...p, post_likes: [], post_comments: [] })))
      setLoading(false); return
    }

    // Last resort: no joins
    const { data: d4 } = await supabase
      .from('posts')
      .select('id, member_id, organization_id, caption, image_urls, ramen_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    if (d4) {
      // Fetch member info separately for posts we found
      const memberIds = [...new Set(d4.map(p => p.member_id))]
      const { data: members } = await supabase
        .from('members')
        .select('id, display_name, avatar_url')
        .in('id', memberIds)
      const memberMap = Object.fromEntries((members ?? []).map(m => [m.id, m]))
      setPosts(d4.map(p => ({
        ...p,
        members: memberMap[p.member_id] ?? null,
        ramen_shops: null,
        post_likes: [],
        post_comments: [],
      })))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [org])

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-[#1C1A16] text-xl">ラーメンインスタ</h1>
          <HelpTooltip text="コミュニティメンバーが投稿したラーメン写真を見られるフィードです。いいねやコメントで盛り上がりましょう。BGMを設定するとお店の雰囲気を演出できます。" position="bottom" />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold text-sm px-4 py-2 hover:bg-[#B8A000] flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-[18px]">add</span>
          投稿
        </button>
      </div>

      {loading ? (
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-8 text-center text-[#9C9688]">
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-8 text-center text-[#9C9688]">
          <span className="material-symbols-rounded text-[48px] text-[#9C9688] mb-2">photo_camera</span>
          <p className="text-sm">まだ投稿がありません。最初の投稿をしてみましょう！</p>
        </div>
      ) : (
        posts.map((post: any) => (
          <PostCard key={post.id} post={post} org={org} myMemberId={myMemberId} />
        ))
      )}

      {showCreate && (
        <PostCreateModal org={org} onClose={() => setShowCreate(false)} onPosted={loadPosts} />
      )}

      {bgmUrl && (
        <BgmPlayer bgmUrl={bgmUrl} defaultVolume={bgmVolume} />
      )}
    </div>
  )
}
