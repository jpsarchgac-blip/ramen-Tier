'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { TIER_LEVELS, TIER_COLORS } from '@/lib/utils'
import type { TierLevel, TierRating, RamenShop, Member } from '@/types/database'
import TierDetailModalTrigger from './TierDetailModalTrigger'
import HelpTooltip from '@/components/HelpTooltip'
import { removeFromWishlist } from '@/lib/actions/wishlist'
import { createClient } from '@/lib/supabase/client'

const ShopAddModal = dynamic(() => import('@/components/ShopAddModal'), { ssr: false })

interface WishItem {
  id: string
  shop_id: string
  ramen_shops: {
    id: string
    name: string
    address: string | null
    photo_url: string | null
    ramen_type: string[] | null
    google_place_id: string | null
    organization_id: string
    lat: number | null
    lng: number | null
    added_by: string
    created_at: string
  }
}

interface PostItem {
  id: string
  image_urls: string[] | null
  caption: string | null
  created_at: string
}

interface Props {
  org: string
  member: Member
  isOwn: boolean
  ratings: any[]
  wishItems: WishItem[]
  posts: PostItem[]
  grouped: Record<TierLevel, any[]>
  onWishlistChange?: () => void
}

type Tab = 'tier' | 'wish' | 'posts'

export default function ProfileTabs({ org, member, isOwn, ratings, wishItems: initialWishItems, posts: initialPosts, grouped }: Props) {
  const [tab, setTab] = useState<Tab>('tier')
  const [wishItems, setWishItems] = useState(initialWishItems)
  const [postItems, setPostItems] = useState(initialPosts)
  const [upgradeShop, setUpgradeShop] = useState<WishItem['ramen_shops'] | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  const handleDeletePost = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return
    setDeletingPostId(postId)
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      alert(`削除に失敗しました: ${error.message}`)
    } else {
      setPostItems(prev => prev.filter(p => p.id !== postId))
    }
    setDeletingPostId(null)
  }

  const handleRemoveWish = async (wishId: string, shopId: string) => {
    setRemovingId(wishId)
    await removeFromWishlist(org, shopId)
    setWishItems(prev => prev.filter(w => w.id !== wishId))
    setRemovingId(null)
  }

  const handleUpgradeDone = (shopId: string) => {
    setWishItems(prev => prev.filter(w => w.shop_id !== shopId))
    setUpgradeShop(null)
  }

  const TABS: { key: Tab; label: string; help: string }[] = [
    { key: 'tier', label: `Tierリスト（${ratings.length}）`, help: 'S〜Dの5段階でランク付けしたラーメン屋の一覧です。カードをクリックすると詳細な評価を確認できます。' },
    { key: 'wish', label: `行きたい（${wishItems.length}）`, help: 'まだ行っていないけど気になっているお店のリストです。「行った！」ボタンでTier評価に格上げできます。' },
    { key: 'posts', label: `投稿（${postItems.length}）`, help: 'このメンバーがフィードに投稿したラーメン写真の一覧です。' },
  ]

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-[#E4E0D8] gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-4 py-2.5 text-sm font-ui font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[#F2D400] text-[#1C1A16]'
                : 'border-transparent text-[#9C9688] hover:text-[#1C1A16]'
            }`}
          >
            {t.key === 'tier' && 'Tier'}
            {t.key === 'wish' && '行きたい'}
            {t.key === 'posts' && '投稿'}
            <span className="text-xs">({t.key === 'tier' ? ratings.length : t.key === 'wish' ? wishItems.length : postItems.length})</span>
            <HelpTooltip text={t.help} position="bottom" />
          </button>
        ))}
      </div>

      {/* Tier tab */}
      {tab === 'tier' && (
        <div className="space-y-3 animate-fade-in">
          {(!member.tier_public && !isOwn) ? (
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
              このメンバーのTierリストは非公開です
            </div>
          ) : ratings.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
              まだTierに登録された店舗がありません
            </div>
          ) : (
            TIER_LEVELS.map(tier => {
              if (grouped[tier].length === 0) return null
              return (
                <div key={tier} className="bg-[#FFFFFF] border border-[#E4E0D8]">
                  <div
                    className="px-4 py-2 text-sm font-ui font-bold border-b border-[#E4E0D8]"
                    style={{ borderLeftWidth: 4, borderLeftColor: TIER_COLORS[tier], borderLeftStyle: 'solid', color: TIER_COLORS[tier] }}
                  >
                    Tier {tier}
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {grouped[tier].map((rating: any) => (
                      <TierDetailModalTrigger
                        key={rating.id}
                        rating={rating}
                        shop={rating.ramen_shops}
                        member={member}
                        org={org}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Wishlist tab */}
      {tab === 'wish' && (
        <div className="animate-fade-in">
          {wishItems.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
              {isOwn ? '気になるお店をウィッシュリストに追加しましょう。' : '行きたいリストはまだありません。'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wishItems.map(wish => {
                const s = wish.ramen_shops
                return (
                  <div key={wish.id} className="bg-[#FFFFFF] border border-[#E4E0D8] flex gap-3 p-3">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-16 h-16 object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-[#FEFAE0] shrink-0 flex items-center justify-center text-2xl">🍜</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/${org}/shops/${s.id}`} className="text-sm font-medium text-[#1C1A16] hover:text-[#F2D400] truncate block">
                        {s.name}
                      </Link>
                      {s.address && <p className="text-xs text-[#9C9688] truncate mt-0.5">{s.address}</p>}
                      {(s.ramen_type?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.ramen_type?.map((t: string) => (
                            <span key={t} className="text-[10px] bg-[#FEFAE0] border border-[#F2D400] px-1.5 py-0.5">{t}</span>
                          ))}
                        </div>
                      )}
                      {isOwn && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setUpgradeShop(s)}
                            className="text-xs bg-[#F2D400] text-[#1C1A16] font-ui font-semibold px-2.5 py-1 hover:bg-[#B8A000] flex items-center gap-1"
                          >
                            <span className="material-symbols-rounded text-[12px]">star</span>
                            行った！
                          </button>
                          <button
                            onClick={() => handleRemoveWish(wish.id, s.id)}
                            disabled={removingId === wish.id}
                            className="text-xs text-[#9C9688] hover:text-[#E8593C] border border-[#E4E0D8] px-2.5 py-1 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Posts tab */}
      {tab === 'posts' && (
        <div className="animate-fade-in">
          {postItems.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
              まだ投稿がありません
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {postItems.map(post => (
                <div key={post.id} className="relative aspect-square bg-[#F7F5F0] border border-[#E4E0D8] overflow-hidden group">
                  <Link href={`/${org}/feed/${post.id}`} className="block w-full h-full">
                    {post.image_urls?.[0] ? (
                      <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-rounded text-[32px] text-[#E4E0D8]">ramen_dining</span>
                      </div>
                    )}
                  </Link>
                  {isOwn && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      title="削除"
                    >
                      <span className="material-symbols-rounded text-[14px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade modal: convert wish to tier */}
      {upgradeShop && (
        <ShopAddModal
          org={org}
          initialShop={{
            placeId: upgradeShop.google_place_id,
            name: upgradeShop.name,
            address: upgradeShop.address ?? '',
            lat: upgradeShop.lat,
            lng: upgradeShop.lng,
            photoUrl: upgradeShop.photo_url,
            ramenTypes: upgradeShop.ramen_type ?? [],
          }}
          onClose={() => setUpgradeShop(null)}
          onSaved={() => handleUpgradeDone(upgradeShop.id)}
        />
      )}
    </>
  )
}
