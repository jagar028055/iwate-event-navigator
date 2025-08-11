import { SourceDefinition } from './SourceDefinition';
import { IwateRegion, SourceCategory } from '../types';

// 岩手県33市町村の完全データセット
export interface MunicipalityInfo {
  name: string;
  region: IwateRegion;
  officialUrl: string;
  eventPath: string;
  population: number;
  majorAttractions: string[];
  specialEvents: string[];
}

export const IWATE_MUNICIPALITIES: MunicipalityInfo[] = [
  // 県央地域 (8市町村)
  {
    name: "盛岡市",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.city.morioka.iwate.jp/",
    eventPath: "/kanko/event/",
    population: 290000,
    majorAttractions: ["盛岡城跡公園", "岩手県立美術館", "盛岡手づくり村"],
    specialEvents: ["盛岡さんさ踊り", "盛岡秋まつり", "雪あかり"]
  },
  {
    name: "八幡平市",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.city.hachimantai.lg.jp/",
    eventPath: "/kanko/",
    population: 25000,
    majorAttractions: ["八幡平", "安比高原", "松川温泉"],
    specialEvents: ["八幡平雪まつり", "安比高原ゴンドラまつり"]
  },
  {
    name: "雫石町",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.town.shizukuishi.iwate.jp/",
    eventPath: "/kanko/",
    population: 16000,
    majorAttractions: ["小岩井農場", "雫石スキー場", "鶯宿温泉"],
    specialEvents: ["しずくいし軽トラ市", "雫石よしゃれまつり"]
  },
  {
    name: "葛巻町",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.town.kuzumaki.iwate.jp/",
    eventPath: "/tourism/",
    population: 6000,
    majorAttractions: ["くずまき高原牧場", "風力発電所"],
    specialEvents: ["葛巻町産業まつり", "くずまき高原牧場まつり"]
  },
  {
    name: "岩手町",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.town.iwate.iwate.jp/",
    eventPath: "/kanko/",
    population: 12000,
    majorAttractions: ["石神の丘美術館", "岩手山"],
    specialEvents: ["いわて春まつり", "岩手町産業まつり"]
  },
  {
    name: "滝沢市",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.city.takizawa.iwate.jp/",
    eventPath: "/kurashi/bunka/",
    population: 55000,
    majorAttractions: ["岩手県立大学", "チャグチャグ馬コ"],
    specialEvents: ["滝沢市産業まつり", "チャグチャグ馬コ"]
  },
  {
    name: "紫波町",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.town.shiwa.iwate.jp/",
    eventPath: "/kanko/",
    population: 33000,
    majorAttractions: ["紫波中央駅", "フルーツライン"],
    specialEvents: ["紫波町産業まつり", "しわフルーツまつり"]
  },
  {
    name: "矢巾町",
    region: IwateRegion.KENOU,
    officialUrl: "https://www.town.yahaba.iwate.jp/",
    eventPath: "/kanko/",
    population: 27000,
    majorAttractions: ["煙山ダム", "南昌山"],
    specialEvents: ["やはば夏まつり", "矢巾町産業まつり"]
  },

  // 県南地域 (7市町)
  {
    name: "花巻市",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.city.hanamaki.iwate.jp/",
    eventPath: "/kanko/event/",
    population: 95000,
    majorAttractions: ["宮沢賢治記念館", "花巻温泉", "イーハトーブ館"],
    specialEvents: ["花巻まつり", "宮沢賢治イーハトーブ館まつり", "花巻温泉バラまつり"]
  },
  {
    name: "北上市",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.city.kitakami.iwate.jp/",
    eventPath: "/kanko/event/",
    population: 93000,
    majorAttractions: ["北上展勝地", "立花毘沙門堂", "鬼の館"],
    specialEvents: ["北上みちのく芸能まつり", "北上展勝地さくらまつり"]
  },
  {
    name: "奥州市",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.city.oshu.iwate.jp/",
    eventPath: "/kanko/",
    population: 115000,
    majorAttractions: ["中尊寺", "毛越寺", "胆沢ダム"],
    specialEvents: ["水沢競馬場まつり", "奥州前沢牛まつり", "江刺鹿踊"]
  },
  {
    name: "金ケ崎町",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.town.kanegasaki.iwate.jp/",
    eventPath: "/kanko/",
    population: 15000,
    majorAttractions: ["金ケ崎要害歴史館", "森山総合公園"],
    specialEvents: ["金ケ崎町産業まつり", "要害まつり"]
  },
  {
    name: "一関市",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.city.ichinoseki.iwate.jp/",
    eventPath: "/kanko/",
    population: 110000,
    majorAttractions: ["猊鼻渓", "厳美渓", "達谷窟毘沙門堂"],
    specialEvents: ["一関夏まつり", "大東大原水かけ祭り", "骨寺村荘園まつり"]
  },
  {
    name: "平泉町",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.town.hiraizumi.iwate.jp/",
    eventPath: "/kanko/",
    population: 7000,
    majorAttractions: ["中尊寺", "毛越寺", "観自在王院跡"],
    specialEvents: ["中尊寺薪能", "平泉文化遺産センターまつり", "春の藤原まつり"]
  },
  {
    name: "西和賀町",
    region: IwateRegion.KENNAN,
    officialUrl: "https://www.town.nishiwaga.lg.jp/",
    eventPath: "/kanko/",
    population: 5000,
    majorAttractions: ["錦秋湖", "ほっとゆだ", "雪まつり"],
    specialEvents: ["西和賀雪まつり", "錦秋湖大滝まつり"]
  },

  // 沿岸地域 (10市町村)
  {
    name: "宮古市",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.city.miyako.iwate.jp/",
    eventPath: "/kanko/",
    population: 54000,
    majorAttractions: ["浄土ヶ浜", "龍泉洞", "重茂半島"],
    specialEvents: ["宮古さんま祭り", "浄土ヶ浜まつり", "宮古秋まつり"]
  },
  {
    name: "大船渡市",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.city.ofunato.iwate.jp/",
    eventPath: "/kanko/",
    population: 36000,
    majorAttractions: ["碁石海岸", "大船渡湾", "三陸鉄道"],
    specialEvents: ["大船渡港まつり", "碁石海岸観光まつり", "さんままつり"]
  },
  {
    name: "陸前高田市",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.city.rikuzentakata.iwate.jp/",
    eventPath: "/kanko/",
    population: 19000,
    majorAttractions: ["高田松原", "奇跡の一本松", "道の駅高田松原"],
    specialEvents: ["陸前高田うごく七夕まつり", "高田松原まつり"]
  },
  {
    name: "釜石市",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.city.kamaishi.iwate.jp/",
    eventPath: "/kanko/",
    population: 32000,
    majorAttractions: ["釜石大観音", "橋野鉄鉱山", "釜石ラグビー場"],
    specialEvents: ["釜石まつり", "橋野鉄鉱山まつり", "釜石ラグビーまつり"]
  },
  {
    name: "住田町",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.town.sumita.iwate.jp/",
    eventPath: "/kanko/",
    population: 5000,
    majorAttractions: ["種山ヶ原", "滝観洞"],
    specialEvents: ["住田町産業まつり", "種山ヶ原まつり"]
  },
  {
    name: "大槌町",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.town.otsuchi.iwate.jp/",
    eventPath: "/kanko/",
    population: 10000,
    majorAttractions: ["大槌湾", "新山神社"],
    specialEvents: ["大槌まつり", "大槌湾まつり"]
  },
  {
    name: "山田町",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.town.yamada.iwate.jp/",
    eventPath: "/kanko/",
    population: 14000,
    majorAttractions: ["山田湾", "オランダ島"],
    specialEvents: ["山田町産業まつり", "山田湾まつり"]
  },
  {
    name: "岩泉町",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.town.iwaizumi.lg.jp/",
    eventPath: "/kanko/",
    population: 9000,
    majorAttractions: ["龍泉洞", "安家洞", "早坂高原"],
    specialEvents: ["いわいずみ産業まつり", "龍泉洞まつり"]
  },
  {
    name: "田野畑村",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.vill.tanohata.iwate.jp/",
    eventPath: "/kanko/",
    population: 3000,
    majorAttractions: ["北山崎", "鵜の巣断崖"],
    specialEvents: ["たのはた村産業まつり", "北山崎観光まつり"]
  },
  {
    name: "普代村",
    region: IwateRegion.ENGAN,
    officialUrl: "https://www.vill.fudai.iwate.jp/",
    eventPath: "/kanko/",
    population: 2500,
    majorAttractions: ["黒崎", "太田名部漁港"],
    specialEvents: ["普代村産業まつり", "黒崎観光まつり"]
  },

  // 県北地域 (8市町村)
  {
    name: "二戸市",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.city.ninohe.lg.jp/",
    eventPath: "/kanko/",
    population: 26000,
    majorAttractions: ["九戸城跡", "天台寺", "二戸まつり"],
    specialEvents: ["二戸まつり", "天台寺参道まつり", "九戸城まつり"]
  },
  {
    name: "久慈市",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.city.kuji.iwate.jp/",
    eventPath: "/kanko/",
    population: 34000,
    majorAttractions: ["久慈地下水族科学館", "琥珀博物館", "小袖海岸"],
    specialEvents: ["久慈秋まつり", "久慈地下水族科学館まつり", "あまちゃんまつり"]
  },
  {
    name: "洋野町",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.town.hirono.iwate.jp/",
    eventPath: "/kanko/",
    population: 15000,
    majorAttractions: ["種市海浜公園", "八木港"],
    specialEvents: ["洋野町産業まつり", "種市海浜公園まつり"]
  },
  {
    name: "野田村",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.vill.noda.iwate.jp/",
    eventPath: "/kanko/",
    population: 4000,
    majorAttractions: ["野田塩", "のだ塩工房"],
    specialEvents: ["野田村産業まつり", "のだ塩まつり"]
  },
  {
    name: "九戸村",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.vill.kunohe.iwate.jp/",
    eventPath: "/kanko/",
    population: 5000,
    majorAttractions: ["折爪岳", "九戸城跡"],
    specialEvents: ["九戸村産業まつり", "折爪岳まつり"]
  },
  {
    name: "軽米町",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.town.karumai.iwate.jp/",
    eventPath: "/kanko/",
    population: 8000,
    majorAttractions: ["軽米町立雪谷川ダムフォリストパーク"],
    specialEvents: ["軽米町産業まつり", "軽米秋まつり"]
  },
  {
    name: "一戸町",
    region: IwateRegion.KENPOKU,
    officialUrl: "https://www.town.ichinohe.iwate.jp/",
    eventPath: "/kanko/",
    population: 12000,
    majorAttractions: ["御所野遺跡", "一戸まつり"],
    specialEvents: ["一戸まつり", "御所野縄文まつり", "一戸町産業まつり"]
  }
];

// 初期化関数：全市町村の情報源を登録
export function initializeIwateMunicipalitySources(): void {
  console.log('Initializing Iwate municipality sources...');
  
  for (const municipality of IWATE_MUNICIPALITIES) {
    // 公式サイト情報源を登録
    const officialSource = SourceDefinition.createOfficialGovernmentSource({
      id: `official-${municipality.name}`,
      name: `${municipality.name}公式サイト`,
      url: municipality.officialUrl,
      region: municipality.region,
      category: SourceCategory.GENERAL,
      eventPath: municipality.eventPath
    });
    
    SourceDefinition.registerSource(officialSource);

    // 特別イベントがある場合は専用情報源も作成
    if (municipality.specialEvents.length > 0) {
      const specialSource = SourceDefinition.createCulturalSource({
        id: `special-${municipality.name}`,
        name: `${municipality.name}特別イベント`,
        url: municipality.officialUrl + municipality.eventPath,
        region: municipality.region,
        category: SourceCategory.FESTIVALS
      });
      
      // 特別イベントのキーワードを追加
      specialSource.searchStrategy.keywords = [
        ...specialSource.searchStrategy.keywords,
        ...municipality.specialEvents
      ];
      
      SourceDefinition.registerSource(specialSource);
    }
  }

  console.log(`Initialized ${IWATE_MUNICIPALITIES.length * 2} municipality sources`);
}

// 地域別の市町村取得
export function getMunicipalitiesByRegion(region: IwateRegion): MunicipalityInfo[] {
  if (region === IwateRegion.ALL) {
    return IWATE_MUNICIPALITIES;
  }
  return IWATE_MUNICIPALITIES.filter(m => m.region === region);
}

// 人口規模別の市町村分類
export function getMunicipalitiesByPopulation(): {
  large: MunicipalityInfo[];    // 5万人以上
  medium: MunicipalityInfo[];   // 1万-5万人
  small: MunicipalityInfo[];    // 1万人未満
} {
  return {
    large: IWATE_MUNICIPALITIES.filter(m => m.population >= 50000),
    medium: IWATE_MUNICIPALITIES.filter(m => m.population >= 10000 && m.population < 50000),
    small: IWATE_MUNICIPALITIES.filter(m => m.population < 10000)
  };
}

// 特定の観光地を持つ市町村検索
export function findMunicipalitiesByAttraction(attractionName: string): MunicipalityInfo[] {
  return IWATE_MUNICIPALITIES.filter(m => 
    m.majorAttractions.some(attraction => 
      attraction.toLowerCase().includes(attractionName.toLowerCase())
    )
  );
}

// 特定のイベントを持つ市町村検索
export function findMunicipalitiesByEvent(eventName: string): MunicipalityInfo[] {
  return IWATE_MUNICIPALITIES.filter(m => 
    m.specialEvents.some(event => 
      event.toLowerCase().includes(eventName.toLowerCase())
    )
  );
}