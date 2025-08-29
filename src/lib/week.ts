// iOS/ブラウザローカル時間で今週の土日をざっくり計算
export function fmt(d: Date){
    const y = d.getFullYear();
    const m = (d.getMonth()+1).toString().padStart(2,'0');
    const day = d.getDate().toString().padStart(2,'0');
    return `${y}${m}${day}`;
}


/**
* 日本競馬用に「今週の土(=6)・日(=0)」を推定
* - 週の開始を月(=1)として、土日を計算
*/
export function thisWeekendRange(base = new Date()): {from:string; to:string}{
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const w = d.getDay(); // 0:Sun ... 6:Sat
    // 土曜までの日数
    const toSat = (6 - w + 7) % 7;
    const sat = new Date(d); sat.setDate(d.getDate() + toSat);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    return { from: fmt(sat), to: fmt(sun) };
}