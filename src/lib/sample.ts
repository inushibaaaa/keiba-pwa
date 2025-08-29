import type { Race, Entry, Result } from './types'

export const sampleData: {races: Race[]; entries: Entry[]; results: Result[]} = {
  races: [
    { raceId:'202401010101', date:'20240101', course:'中山11R', distance:1600, surface:'芝', classLabel:'G3' },
    { raceId:'202401020201', date:'20240102', course:'京都10R', distance:1400, surface:'ダート', classLabel:'OP' }
  ],
  entries: [
    { raceId:'202401010101', horseId:'h1', horseName:'アルファ', timeIndex5:[92,95,null,101,98], flags:{checkValues:[95,101,98]} },
    { raceId:'202401010101', horseId:'h2', horseName:'ブラボー', timeIndex5:[88,90,91,89,92],    flags:{checkValues:[90,91,92]} },
    { raceId:'202401010101', horseId:'h3', horseName:'チャーリー', timeIndex5:[null,87,84,85,86], flags:{checkValues:[86]} },
    { raceId:'202401010101', horseId:'h4', horseName:'デルタ',   timeIndex5:[102,null,99,97,96], flags:{checkValues:[102,99,97,96]} },

    { raceId:'202401020201', horseId:'a1', horseName:'エコー',   timeIndex5:[80,81,79,83,85], flags:{checkValues:[83,85]} },
    { raceId:'202401020201', horseId:'a2', horseName:'フォックス', timeIndex5:[84,86,88,87,86], flags:{checkValues:[84,86,88,87,86]} },
    { raceId:'202401020201', horseId:'a3', horseName:'ガンマ',   timeIndex5:[70,null,76,74,73], flags:{checkValues:[76,74,73]} },
    { raceId:'202401020201', horseId:'a4', horseName:'ホテル',   timeIndex5:[90,88,87,91,92], flags:{checkValues:[90,88,91,92]} }
  ],
  results: [
    { raceId:'202401010101', top3:['デルタ','アルファ','ブラボー'], payouts:{'単勝':350,'馬連':1240,'三連複':2680,'三連単':15890} },
    { raceId:'202401020201', top3:['ホテル','フォックス','エコー'], payouts:{'単勝':420,'馬連':980,'三連複':3120,'三連単':20980} }
  ]
}
