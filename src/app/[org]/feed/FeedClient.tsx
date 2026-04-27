'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import PostCard from '@/components/PostCard'
import HelpTooltip from '@/components/HelpTooltip'
import PostCreateModal from '@/components/PostCreateModal'
import { getFeed } from '@/lib/actions/posts'

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

  const handleRefresh = async () => {
    const data = await getFeed(org)
    setPosts(data)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
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

      {/* Posts */}
      {posts.length === 0 ? (
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
        <PostCreateModal org={org} onClose={() => setShowCreate(false)} onPosted={handleRefresh} />
      )}

      {bgmUrl && (
        <BgmPlayer bgmUrl={bgmUrl} defaultVolume={bgmVolume} />
      )}
    </div>
  )
}
