'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { TierRating, RamenShop, Member } from '@/types/database'
import { TIER_COLORS } from '@/lib/utils'

const TierDetailModal = dynamic(() => import('@/components/TierDetailModal'), { ssr: false })

interface Props {
  rating: TierRating
  shop: RamenShop
  member: Member
  org: string
}

export default function TierDetailModalTrigger({ rating, shop, member, org }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#F7F5F0] border border-[#E4E0D8] p-2 hover:border-[#F2D400] transition-all text-left"
        style={{ borderLeftWidth: 3, borderLeftColor: rating.tier ? TIER_COLORS[rating.tier as keyof typeof TIER_COLORS] : '#E4E0D8', borderLeftStyle: 'solid' }}
      >
        {shop.photo_url ? (
          <img src={shop.photo_url} alt={shop.name} className="w-8 h-8 object-cover shrink-0" />
        ) : (
          <div
            className="w-8 h-8 shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: rating.tier ? TIER_COLORS[rating.tier as keyof typeof TIER_COLORS] : '#9C9688' }}
          >
            {shop.name[0]}
          </div>
        )}
        <span className="text-sm font-medium text-[#1C1A16] truncate max-w-[120px]">{shop.name}</span>
      </button>

      {open && (
        <TierDetailModal
          rating={rating}
          shop={shop}
          member={member}
          org={org}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
