'use client'

import { useState } from 'react'
import Link from 'next/link'
import HelpTooltip from '@/components/HelpTooltip'
import { uploadOrgLogo, deleteOrgLogo } from '@/lib/actions/orgSettings'

interface Props {
  org: string
  initialLogoUrl: string | null
}

export default function LogoClient({ org, initialLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('ファイルサイズは2MB以内にしてください')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadOrgLogo(org, formData)
      if (result.url) {
        setLogoUrl(result.url)
        setImgError(false)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('ロゴを削除しますか？')) return
    setDeleting(true)
    try {
      await deleteOrgLogo(org)
      setLogoUrl(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${org}/settings`} className="text-[#9C9688] hover:text-[#1C1A16]">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[#1C1A16] text-xl">ロゴ管理</h1>
        <HelpTooltip text="ヘッダーに表示するコミュニティのロゴ画像を設定できます。画像がない場合はロゴは表示されません。" position="bottom" />
      </div>

      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-5 space-y-5">
        {/* Current logo */}
        <div>
          <p className="text-sm font-medium text-[#1C1A16] mb-2">現在のロゴ</p>
          {(logoUrl && !imgError) ? (
            <div className="flex items-center gap-3 bg-[#F7F5F0] border border-[#E4E0D8] px-3 py-3">
              <img
                src={logoUrl}
                alt="logo"
                className="h-10 w-auto max-w-[160px] object-contain"
                onError={() => setImgError(true)}
              />
              <div className="flex-1" />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[#E8593C] hover:opacity-70 text-xs font-ui disabled:opacity-50"
              >
                削除
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#9C9688]">ロゴが設定されていません（設定すると自動でヘッダーに表示されます）</p>
          )}
        </div>

        {/* Upload */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm font-medium text-[#1C1A16]">ロゴをアップロード</p>
            <HelpTooltip text="png・jpg・svg・webp形式、最大2MBまでアップロードできます。透過PNGを推奨します。" position="right" />
          </div>
          <p className="text-xs text-[#9C9688] mb-2">png / jpg / svg / webp（最大2MB）</p>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#E4E0D8] p-4 cursor-pointer hover:border-[#F2D400] hover:bg-[#FEFAE0] transition-colors text-[#9C9688]">
            <span className="material-symbols-rounded text-[20px]">upload</span>
            <span className="text-sm">{uploading ? 'アップロード中...' : 'ファイルを選択'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
