'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/lib/actions/members'

export default function AccountPage() {
  const router = useRouter()
  const { org } = useParams<{ org: string }>()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [memberName, setMemberName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email ?? '')

      const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', org).single()
      if (!orgData) return

      const { data: m } = await supabase
        .from('members')
        .select('role, joined_at, display_name')
        .eq('user_id', user.id)
        .eq('organization_id', orgData.id)
        .single()
      if (!m) return

      setRole(m.role)
      setJoinedAt(m.joined_at)
      setMemberName(m.display_name ?? '')
    }
    load()
  }, [org])

  const handleDelete = async () => {
    if (deleteInput !== memberName && deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      const result = await deleteAccount(org)
      if (result.ok) {
        router.push('/login')
      }
    } finally {
      setDeleting(false)
    }
  }

  const roleLabel: Record<string, string> = {
    owner: 'オーナー',
    admin: '管理者',
    member: 'メンバー',
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${org}/dashboard`} className="text-[#9C9688] hover:text-[#1C1A16]">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[#1C1A16] text-xl">アカウント設定</h1>
      </div>

      {/* Account info */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] divide-y divide-[#E4E0D8]">
        <div className="p-4">
          <p className="text-xs text-[#9C9688] mb-0.5">メールアドレス</p>
          <p className="text-sm font-medium text-[#1C1A16]">{email || '読み込み中...'}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#9C9688] mb-0.5">権限</p>
          <p className="text-sm font-medium text-[#1C1A16]">{role ? (roleLabel[role] ?? role) : '読み込み中...'}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#9C9688] mb-0.5">参加日</p>
          <p className="text-sm font-medium text-[#1C1A16]">
            {joinedAt ? new Date(joinedAt).toLocaleDateString('ja-JP') : '読み込み中...'}
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#FFFFFF] border border-red-200 p-5 space-y-4">
        <h2 className="font-semibold text-red-600 text-sm flex items-center gap-2">
          <span className="material-symbols-rounded text-[18px]">warning</span>
          危険な操作
        </h2>

        {!showDeleteConfirm ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#1C1A16]">アカウントを削除する</p>
              <p className="text-xs text-[#9C9688] mt-0.5">コミュニティからの脱退・全データの削除。この操作は取り消せません。</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 text-sm text-[#E8593C] border border-[#E8593C] px-3 py-1.5 hover:bg-red-50"
            >
              削除する
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#1C1A16]">
              本当に削除しますか？確認のため、表示名 <strong>{memberName}</strong> または <strong>DELETE</strong> を入力してください。
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={memberName}
              className="w-full border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="flex-1 border border-[#E4E0D8] py-2 text-sm text-[#9C9688] hover:bg-[#F7F5F0]"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || (deleteInput !== memberName && deleteInput !== 'DELETE')}
                className="flex-1 bg-red-500 text-white py-2 text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
