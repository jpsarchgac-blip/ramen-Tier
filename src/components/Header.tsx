'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/types/database'

interface HeaderProps {
  org: string
  member: Member | null
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'home', path: 'dashboard' },
  { label: 'Tier', icon: 'star', path: 'tier' },
  { label: 'Search', icon: 'search', path: 'search' },
  { label: 'Feed', icon: 'photo_camera', path: 'feed' },
]

export default function Header({ org, member }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) => pathname.includes(`/${org}/${path}`)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = member?.role === 'owner' || member?.role === 'admin'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF] border-b border-[#E4E0D8] h-14">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <Link
          href={`/${org}/dashboard`}
          className="font-display text-[#1C1A16] text-[20px] font-bold whitespace-nowrap mr-2 flex items-center gap-1"
        >
          🍜 <span className="hidden sm:inline">ラーメンTier</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              href={`/${org}/${item.path}`}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-ui font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-[#F2D400] text-[#1C1A16]'
                  : 'text-[#9C9688] hover:text-[#1C1A16] hover:bg-[#FEFAE0]'
              }`}
            >
              <span className="material-symbols-rounded text-[18px]">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/${org}/settings`}
              className="text-[#9C9688] hover:text-[#1C1A16] p-1.5"
              title="設定"
            >
              <span className="material-symbols-rounded text-[20px]">settings</span>
            </Link>
          )}

          {/* Account menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {member?.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name ?? ''}
                  className="w-8 h-8 rounded-full object-cover border border-[#E4E0D8]"
                  style={{ boxShadow: menuOpen ? '0 0 0 3px #F2D400' : undefined }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#F2D400] flex items-center justify-center">
                  <span className="material-symbols-rounded text-[16px] text-[#1C1A16]">person</span>
                </div>
              )}
              <span className="material-symbols-rounded text-[16px] text-[#9C9688]">expand_more</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 z-50 bg-[#FFFFFF] border border-[#E4E0D8] shadow-lg min-w-[180px]">
                  <Link
                    href={`/${org}/profile/${member?.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1C1A16] hover:bg-[#FEFAE0] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-symbols-rounded text-[16px]">person</span>
                    プロフィールを見る
                  </Link>
                  <Link
                    href={`/${org}/profile/edit`}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1C1A16] hover:bg-[#FEFAE0] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-symbols-rounded text-[16px]">edit</span>
                    プロフィールを編集する
                  </Link>
                  <hr className="border-[#E4E0D8]" />
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#E8593C] hover:bg-[#FEFAE0] transition-colors w-full"
                  >
                    <span className="material-symbols-rounded text-[16px]">logout</span>
                    ログアウト
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
