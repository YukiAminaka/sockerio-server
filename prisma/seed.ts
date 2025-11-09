// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  {
    word: "猫耳万歳",
    yomi: "ねこみみばんざい",
    meaning:
      "小さな喜びや可愛らしさを全力で称える様子。日常の些細な幸せを大事にする精神を表す。",
    blank: 3,
    answer: "歳",
    hint: "可愛さを全力称賛",
    difficulty: "easy",
  },
  {
    word: "空想電流",
    yomi: "くうそうでんりゅう",
    meaning:
      "想像力が活発に流れ、アイデアが次々に生まれる状態。クリエイティブな活動の比喩。",
    blank: 3,
    answer: "流",
    hint: "アイデアが流れる",
    difficulty: "normal",
  },
  {
    word: "豆腐一徹",
    yomi: "とうふいってつ",
    meaning:
      "柔らかく見えても、意志が強く揺るがない人を指す。見た目と内面のギャップを表す。",
    blank: 3,
    answer: "徹",
    hint: "見た目ふわふわ中身ガンコ",
    difficulty: "normal",
  },
  {
    word: "時計泥棒",
    yomi: "とけいどろぼう",
    meaning:
      "時間を無駄にする人や、周囲の時間を奪ってしまう行動をする人物。ユーモアを込めた警告。",
    blank: 3,
    answer: "棒",
    hint: "時間を奪う存在",
    difficulty: "easy",
  },
  {
    word: "月光砂糖",
    yomi: "げっこうさとう",
    meaning: "淡くて儚い幸福や、触れるとすぐに消えそうな夢のようなものを表す。",
    blank: 3,
    answer: "糖",
    hint: "淡い甘さの比喩",
    difficulty: "normal",
  },
  {
    word: "虹色絨毯",
    yomi: "にじいろじゅうたん",
    meaning:
      "目の前に広がる鮮やかな未来や、これから始まる素晴らしい出来事への期待感。",
    blank: 3,
    answer: "毯",
    hint: "色鮮やかな道が広がる",
    difficulty: "normal",
  },
  {
    word: "秘密惑星",
    yomi: "ひみつわくせい",
    meaning: "誰にも話せない、自分だけが知る深い内面の世界や隠された感情。",
    blank: 3,
    answer: "星",
    hint: "胸の内の小さな世界",
    difficulty: "normal",
  },
  {
    word: "週末英雄",
    yomi: "しゅうまつえいゆう",
    meaning:
      "平日は地味でも、週末になると趣味や特技で驚くべき能力を発揮する人。",
    blank: 3,
    answer: "雄",
    hint: "土日に覚醒",
    difficulty: "easy",
  },
  {
    word: "微熱海賊",
    yomi: "びねつかいぞく",
    meaning:
      "静かに、しかし常に内なる情熱を燃やし、小さなスリルや冒険を求め続ける態度。",
    blank: 3,
    answer: "賊",
    hint: "静かな情熱と冒険心",
    difficulty: "normal",
  },
  {
    word: "深海珈琲",
    yomi: "しんかいコーヒー",
    meaning: "極度に深く、苦く、複雑で、なかなか理解しがたい思考や心理状態。",
    blank: 3,
    answer: "琲",
    hint: "苦くて深い思索",
    difficulty: "hard",
  },
  {
    word: "無限充電",
    yomi: "むげんじゅうでん",
    meaning:
      "些細な、または繰り返しの行動で、心身の疲れを素早く回復させる能力。",
    blank: 3,
    answer: "電",
    hint: "散歩や深呼吸で回復",
    difficulty: "easy",
  },
  {
    word: "過去改竄",
    yomi: "かこかいざん",
    meaning:
      "現在のモチベを保つため、過去の失敗を美化したり忘れようとする行為。",
    blank: 3,
    answer: "竄",
    hint: "都合よく歴史編集",
    difficulty: "hard",
  },
  {
    word: "太陽傘下",
    yomi: "たいようさんか",
    meaning:
      "魅力的でポジティブな指導者やグループの影響下にあること。明るい庇護。",
    blank: 3,
    answer: "下",
    hint: "明るい庇護のもと",
    difficulty: "normal",
  },
  {
    word: "氷菓熱湯",
    yomi: "ひょうかねっとう",
    meaning: "冷静から一瞬で激情へと変わる心の動き。",
    blank: 3,
    answer: "湯",
    hint: "クールから一転アツアツ",
    difficulty: "normal",
  },
  {
    word: "文字宇宙",
    yomi: "もじうちゅう",
    meaning: "一つの言葉から無限の意味や解釈が広がる想像の世界。",
    blank: 3,
    answer: "宙",
    hint: "言葉の銀河",
    difficulty: "easy",
  },
  {
    word: "独学魔術",
    yomi: "どくがくまじゅつ",
    meaning: "誰にも教わらず自力で身につけたユニークな技術や知恵。",
    blank: 3,
    answer: "術",
    hint: "我流で身につける技",
    difficulty: "normal",
  },
  {
    word: "透明迷路",
    yomi: "とうめいめいろ",
    meaning: "道筋が見えているのに辿り着けないもどかしさ。",
    blank: 3,
    answer: "路",
    hint: "見えるのに抜けられない",
    difficulty: "normal",
  },
  {
    word: "紙魚読書",
    yomi: "しみどくしょ",
    meaning: "内容の良し悪しに関わらず、文字を読み進める行為に没頭すること。",
    blank: 3,
    answer: "書",
    hint: "読むこと自体が目的",
    difficulty: "hard",
  },
  {
    word: "音符飛行",
    yomi: "おんぷひこう",
    meaning: "音楽に深く感動し、魂が旋律に乗って飛ぶような感覚。",
    blank: 3,
    answer: "行",
    hint: "メロディで心が舞う",
    difficulty: "easy",
  },
  {
    word: "虚無配達",
    yomi: "きょむはいたつ",
    meaning: "最終的に意味を持たない目標に多大な労力を注ぐ虚しさ。",
    blank: 3,
    answer: "達",
    hint: "徒労感のデリバリー",
    difficulty: "normal",
  },
  {
    word: "夢現接続",
    yomi: "ゆめうつつせつぞく",
    meaning: "夢と現実の境界が曖昧になり、新しい発想が生まれる状態。",
    blank: 3,
    answer: "続",
    hint: "夢と現のハイブリッド",
    difficulty: "normal",
  },
  {
    word: "鉄骨柔軟",
    yomi: "てっこつじゅうなん",
    meaning: "強固な意志や身体を持ちながら驚くほど柔軟な対応力を持つこと。",
    blank: 3,
    answer: "軟",
    hint: "硬さとしなやかさ両立",
    difficulty: "normal",
  },
  {
    word: "秒針沈黙",
    yomi: "びょうしんちんもく",
    meaning: "集中や緊張が極限に達し、時間が止まったかのように感じる瞬間。",
    blank: 3,
    answer: "黙",
    hint: "時が止まるほどの集中",
    difficulty: "normal",
  },
  {
    word: "白昼幽霊",
    yomi: "はくちゅうゆうれい",
    meaning: "皆が気づいているのに見て見ぬふりをする公然の秘密や厄介事。",
    blank: 3,
    answer: "霊",
    hint: "昼間の見えない問題",
    difficulty: "easy",
  },
  {
    word: "記憶洗濯",
    yomi: "きおくせんたく",
    meaning: "過去を冷静に見直し、後悔や悲しみを洗い流して前に進む心の作業。",
    blank: 3,
    answer: "濯",
    hint: "心のリフレッシュ",
    difficulty: "easy",
  },
  {
    word: "哲学定食",
    yomi: "てつがくていしょく",
    meaning: "何気ない食事中に人生の根本的な問いを考える習慣。",
    blank: 3,
    answer: "食",
    hint: "ランチで形而上学",
    difficulty: "normal",
  },
  {
    word: "言語爆発",
    yomi: "げんごばくはつ",
    meaning: "長い沈黙の後に、言葉や文章が堰を切ったように溢れ出す状態。",
    blank: 3,
    answer: "発",
    hint: "沈黙の後の洪水",
    difficulty: "easy",
  },
  {
    word: "泡沫願望",
    yomi: "ほうまつがんぼう",
    meaning: "達成が難しく水泡のように消えやすい儚い夢や願い。",
    blank: 3,
    answer: "望",
    hint: "すぐ消える夢",
    difficulty: "normal",
  },
  {
    word: "惑星旅行",
    yomi: "わくせいりょこう",
    meaning: "単純で退屈な日常タスクが果てしない旅のように感じられること。",
    blank: 3,
    answer: "行",
    hint: "日常が長旅に見える",
    difficulty: "normal",
  },
  {
    word: "透明装甲",
    yomi: "とうめいそうこう",
    meaning: "他者には見えない強固な感情のバリアを内に築き自己を守る状態。",
    blank: 3,
    answer: "甲",
    hint: "見えない心の防御",
    difficulty: "normal",
  },
];

async function main() {
  console.log("シードデータを投入中...");

  // 既存のデータを削除
  await prisma.question.deleteMany();

  // 新しいデータを投入
  for (const question of questions) {
    await prisma.question.create({
      data: question,
    });
  }

  console.log(`${questions.length}件の問題を登録しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
