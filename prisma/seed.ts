// prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const questions = [
  {
    word: "一期一会",
    meaning: "一生に一度だけの機会。生涯に一度限りであること。",
    blank: 3,
    answer: "会",
    hint: "人と人が出会うこと",
    difficulty: "easy",
  },
  {
    word: "温故知新",
    meaning: "古いことを研究して、そこから新しい知識や見解を得ること。",
    blank: 1,
    answer: "故",
    hint: "古い、昔という意味",
    difficulty: "normal",
  },
  {
    word: "十人十色",
    meaning: "人それぞれ好みや考え方が異なること。",
    blank: 3,
    answer: "色",
    hint: "様々な種類を表す漢字",
    difficulty: "easy",
  },
  {
    word: "七転八起",
    meaning: "何度失敗してもくじけずに立ち上がること。",
    blank: 2,
    answer: "八",
    hint: "七より一つ多い数字",
    difficulty: "normal",
  },
  {
    word: "四面楚歌",
    meaning: "周囲が敵や反対者ばかりで、孤立して援助が全くない状態。",
    blank: 2,
    answer: "楚",
    hint: "中国の古代国名",
    difficulty: "hard",
  },
  {
    word: "百花繚乱",
    meaning: "多くの優れた人物や物事が一度に現れて、華やかな様子。",
    blank: 2,
    answer: "繚",
    hint: "もつれるという意味の漢字",
    difficulty: "hard",
  },
  {
    word: "一石二鳥",
    meaning: "一つの行為で二つの利益を得ること。",
    blank: 3,
    answer: "鳥",
    hint: "空を飛ぶ生き物",
    difficulty: "easy",
  },
  {
    word: "三寒四温",
    meaning: "冬季に寒い日が三日ほど続くと、その後四日ほど温暖な日が続く現象。",
    blank: 2,
    answer: "四",
    hint: "三より一つ多い数字",
    difficulty: "normal",
  },
  {
    word: "以心伝心",
    meaning: "言葉を使わなくても、心から心へ気持ちが通じ合うこと。",
    blank: 3,
    answer: "心",
    hint: "気持ちを表す漢字",
    difficulty: "easy",
  },
  {
    word: "因果応報",
    meaning: "良い行いには良い報い、悪い行いには悪い報いがあるということ。",
    blank: 2,
    answer: "応",
    hint: "こたえる、反応するという意味",
    difficulty: "normal",
  },
  {
    word: "臥薪嘗胆",
    meaning: "目的を達成するために苦労に耐え忍ぶこと。",
    blank: 3,
    answer: "胆",
    hint: "勇気や度胸を意味する体の部位",
    difficulty: "hard",
  },
  {
    word: "画竜点睛",
    meaning: "物事を完成させる最後の大切な仕上げ。",
    blank: 3,
    answer: "睛",
    hint: "目の中の黒い部分（ひとみ）",
    difficulty: "hard",
  },
  {
    word: "千載一遇",
    meaning: "千年に一度しか巡り会えないほどの絶好の機会。",
    blank: 1,
    answer: "載",
    hint: "年数を数える単位",
    difficulty: "hard",
  },
  {
    word: "起死回生",
    meaning: "絶望的な状況から一気に立ち直ること。",
    blank: 3,
    answer: "生",
    hint: "生きる、命という意味",
    difficulty: "normal",
  },
  {
    word: "五里霧中",
    meaning: "状況がわからず、どうしたらよいか見当がつかないこと。",
    blank: 2,
    answer: "霧",
    hint: "視界を遮る気象現象",
    difficulty: "normal",
  },
  {
    word: "大器晩成",
    meaning: "大人物は遅れて才能を発揮し、大成すること。",
    blank: 3,
    answer: "成",
    hint: "完成する、できあがるという意味",
    difficulty: "easy",
  },
  {
    word: "切磋琢磨",
    meaning: "仲間同士が励まし合い、競い合って向上すること。",
    blank: 2,
    answer: "琢",
    hint: "玉や石を磨くという意味",
    difficulty: "hard",
  },
  {
    word: "試行錯誤",
    meaning: "何度も試みて、失敗を重ねながら解決策を見つけること。",
    blank: 2,
    answer: "錯",
    hint: "誤り、間違いという意味",
    difficulty: "easy",
  },
  {
    word: "不言実行",
    meaning: "あれこれ言わず、黙って実行すること。",
    blank: 1,
    answer: "言",
    hint: "話す、述べるという意味",
    difficulty: "easy",
  },
  {
    word: "言行一致",
    meaning: "言っていることと実際の行動が一致していること。",
    blank: 3,
    answer: "一",
    hint: "一つになる、合うという意味を表す漢数字",
    difficulty: "easy",
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
