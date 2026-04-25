import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function SettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase.from('organizations').select('*').eq('slug', org).single()
  if (!organization) notFound()

  const { data: member } = await supabase
    .from('members').select('role').eq('user_id', user!.id).eq('organization_id', organization.id).single()
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) redirect(`/${org}/dashboard`)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-bold text-[#1C1A16] text-xl">組織設定</h1>

      <div className="bg-[#FFFFFF] border border-[#E4E0D8] divide-y divide-[#E4E0D8]">
        <div className="p-4">
          <h2 className="font-semibold text-[#1C1A16] mb-1">{organization.name}</h2>
          <p className="text-sm text-[#9C9688]">
            許可ドメイン: <code className="bg-[#F7F5F0] px-1">@{organization.allowed_domain}</code>
          </p>
        </div>

        <Link
          href={`/${org}/settings/sounds`}
          className="flex items-center justify-between p-4 hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-[20px] text-[#F2D400]">music_note</span>
            <div>
              <p className="text-sm font-medium text-[#1C1A16]">BGM管理</p>
              <p className="text-xs text-[#9C9688]">フィードで流れる音楽を設定する</p>
            </div>
          </div>
          <span className="material-symbols-rounded text-[16px] text-[#9C9688]">chevron_right</span>
        </Link>
      </div>
    </div>
  )
}
