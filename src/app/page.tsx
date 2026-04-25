import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      {/* Hero */}
      <header className="bg-[#FFFFFF] border-b border-[#E4E0D8] px-6 py-4 flex items-center justify-between">
        <span className="font-display text-[#1C1A16] text-xl font-bold">🍜 ラーメンTier</span>
        <Link
          href="/login"
          className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold px-5 py-2 text-sm hover:bg-[#B8A000] transition-colors"
        >
          ログイン
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <div className="text-6xl mb-6">🍜</div>
          <h1 className="font-display text-[#1C1A16] text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            あなたのコミュニティの<br />ラーメンを格付けしよう
          </h1>
          <p className="text-[#9C9688] text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            食べログ・Googlemapは「不特定多数のレビュー」がベース。<br />
            <strong className="text-[#1C1A16]">ラーメンTier</strong>は「自分が信頼するコミュニティのデータ」がベース。
          </p>

          <Link
            href="/login"
            className="inline-block bg-[#F2D400] text-[#1C1A16] font-ui font-bold px-8 py-3 text-base hover:bg-[#B8A000] transition-colors"
          >
            Googleアカウントではじめる
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {[
            { icon: 'star', title: 'Tier格付け', desc: 'S〜DのTierでラーメン屋を格付け。レーダーチャートで詳細評価も可能。' },
            { icon: 'group', title: 'コミュニティ', desc: '企業・チーム・友人グループだけのプライベート空間で共有。' },
            { icon: 'search', title: 'AI検索', desc: 'Gemini AIがコミュニティデータをもとにおすすめを提案。' },
          ].map(f => (
            <div key={f.title} className="bg-[#FFFFFF] border border-[#E4E0D8] p-5 text-left">
              <span className="material-symbols-rounded text-[28px] text-[#F2D400] mb-3 block">{f.icon}</span>
              <h3 className="font-bold text-[#1C1A16] mb-1">{f.title}</h3>
              <p className="text-[#9C9688] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-12 max-w-2xl w-full">
          <h2 className="font-bold text-[#1C1A16] text-lg mb-4">食べログとの違い</h2>
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F7F5F0] border-b border-[#E4E0D8]">
                  <th className="px-4 py-3 text-left text-[#9C9688] font-medium">比較軸</th>
                  <th className="px-4 py-3 text-center text-[#9C9688] font-medium">食べログ</th>
                  <th className="px-4 py-3 text-center text-[#F2D400] font-bold">ラーメンTier</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['レビュアー', '不特定多数', '信頼できるコミュニティ'],
                  ['可視化', '星・点数', 'Tierリスト＋チャート'],
                  ['SNS', 'なし', 'ラーメン特化インスタ'],
                  ['対象', '一般大衆', '企業・チーム・友人グループ'],
                ].map(([axis, other, ours]) => (
                  <tr key={axis} className="border-b border-[#E4E0D8] last:border-0">
                    <td className="px-4 py-3 text-[#9C9688]">{axis}</td>
                    <td className="px-4 py-3 text-center text-[#9C9688]">{other}</td>
                    <td className="px-4 py-3 text-center font-medium text-[#1C1A16]">{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E4E0D8] py-6 text-center text-sm text-[#9C9688]">
        © 2026 ラーメンTier
      </footer>
    </div>
  )
}
