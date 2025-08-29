import { Link } from 'react-router-dom'
export default function Home(){
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">競馬予想</h1>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/predict" className="card">予想</Link>
	      <Link to="/backtest" className="card">予想テスト</Link>
        <Link to="/settings" className="card">設定（データ）</Link>
        <p className="text-xs text-gray-500">
          iPhoneはSafariの共有メニューから「ホーム画面に追加」でインストールできます。
        </p>
      </div>
    </div>
  )
}
