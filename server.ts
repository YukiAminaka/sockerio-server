import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 型定義
interface Player {
  id: string;
  name: string;
  score: number;
}

interface Room {
  code: string;
  host: string;
  players: Player[];
  gameState: "lobby" | "playing" | "finished";
  currentQuestion: number;
  timer?: NodeJS.Timeout;
}

interface Question {
  word: string; // 四字熟語
  yomi: string; // 読み仮名
  meaning: string; // 意味
  blank: number; // 空欄の位置（0-3）
  answer: string; // 正解の文字
}

// ゲームの状態管理
const rooms = new Map<string, Room>();

// 四字熟語の問題データ（意味付き）
const questions: Question[] = [
  {
    word: "猫耳万歳",
    yomi: "ねこみみばんざい",
    meaning:
      "小さな喜びや可愛らしさを全力で称える様子。日常の些細な幸せを大事にする精神を表す。",
    blank: 2,
    answer: "万",
  },
  {
    word: "空想電流",
    yomi: "くうそうでんりゅう",
    meaning:
      "想像力が活発に流れ、アイデアが次々に生まれる状態。クリエイティブな活動の比喩。",
    blank: 3,
    answer: "流",
  },
  // {
  //   word: "一期一会",
  //   meaning: "一生に一度だけの機会。生涯に一度限りであること。",
  //   blank: 3,
  //   answer: "会",
  // },
  // {
  //   word: "温故知新",
  //   meaning: "古いことを研究して、そこから新しい知識や見解を得ること。",
  //   blank: 1,
  //   answer: "故",
  // },
  // {
  //   word: "十人十色",
  //   meaning: "人それぞれ好みや考え方が異なること。",
  //   blank: 3,
  //   answer: "色",
  // },
  // {
  //   word: "七転八起",
  //   meaning: "何度失敗してもくじけずに立ち上がること。",
  //   blank: 2,
  //   answer: "八",
  // },
  // {
  //   word: "四面楚歌",
  //   meaning: "周囲が敵や反対者ばかりで、孤立して援助が全くない状態。",
  //   blank: 2,
  //   answer: "楚",
  // },
  // {
  //   word: "百花繚乱",
  //   meaning: "多くの優れた人物や物事が一度に現れて、華やかな様子。",
  //   blank: 2,
  //   answer: "繚",
  // },
  // {
  //   word: "一石二鳥",
  //   meaning: "一つの行為で二つの利益を得ること。",
  //   blank: 3,
  //   answer: "鳥",
  // },
  // {
  //   word: "三寒四温",
  //   meaning: "冬季に寒い日が三日ほど続くと、その後四日ほど温暖な日が続く現象。",
  //   blank: 2,
  //   answer: "四",
  // },
  // {
  //   word: "以心伝心",
  //   meaning: "言葉を使わなくても、心から心へ気持ちが通じ合うこと。",
  //   blank: 3,
  //   answer: "心",
  // },
  // {
  //   word: "因果応報",
  //   meaning: "良い行いには良い報い、悪い行いには悪い報いがあるということ。",
  //   blank: 2,
  //   answer: "応",
  // },
  // {
  //   word: "臥薪嘗胆",
  //   meaning: "目的を達成するために苦労に耐え忍ぶこと。",
  //   blank: 3,
  //   answer: "胆",
  // },
  // {
  //   word: "画竜点睛",
  //   meaning: "物事を完成させる最後の大切な仕上げ。",
  //   blank: 3,
  //   answer: "睛",
  // },
];

// 接続ハンドラ
io.on("connection", (socket) => {
  console.log("プレイヤー接続:", socket.id);

  // ルーム作成
  socket.on("create-room", (playerName: string) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const room: Room = {
      code: roomCode,
      host: socket.id,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      gameState: "lobby",
      currentQuestion: 0,
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit("room-created", { roomCode, room });

    console.log(`ルーム作成: ${roomCode} by ${playerName}`);
  });

  // ルーム参加
  socket.on(
    "join-room",
    ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit("error", { message: "ルームが見つかりません" });
        return;
      }

      if (room.players.length >= 4) {
        socket.emit("error", { message: "ルームが満員です" });
        return;
      }

      const alreadyJoined = room.players.some((p) => p.id === socket.id);
      if (alreadyJoined) {
        socket.emit("error", { message: "既に参加しています" });
        return;
      }

      room.players.push({ id: socket.id, name: playerName, score: 0 });
      socket.join(roomCode);

      io.to(roomCode).emit("player-joined", room);

      console.log(`${playerName} がルーム ${roomCode} に参加`);
    }
  );

  // ルームから退出
  socket.on("leave-room", (roomCode: string) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    if (playerIndex === -1) return;

    const playerName = room.players[playerIndex].name;
    room.players.splice(playerIndex, 1);
    socket.leave(roomCode);

    console.log(`${playerName} がルーム ${roomCode} から退出`);

    if (room.players.length === 0) {
      // 全員退出したらルームを削除
      if (room.timer) {
        clearInterval(room.timer);
      }
      rooms.delete(roomCode);
      console.log(`ルーム ${roomCode} を削除`);
    } else {
      // ホストが退出した場合、次のプレイヤーをホストに
      if (room.host === socket.id && room.players.length > 0) {
        room.host = room.players[0].id;
        console.log(`新しいホスト: ${room.players[0].name}`);
      }
      io.to(roomCode).emit("player-left", room);
    }

    socket.emit("left-room");
  });

  // ゲーム開始
  socket.on("start-game", (roomCode: string) => {
    const room = rooms.get(roomCode);

    if (!room || room.host !== socket.id) {
      socket.emit("error", { message: "ゲームを開始する権限がありません" });
      return;
    }

    if (room.players.length < 1) {
      socket.emit("error", { message: "プレイヤーが不足しています" });
      return;
    }

    room.gameState = "playing";
    room.currentQuestion = 0;

    // 全プレイヤーのスコアをリセット
    room.players.forEach((p) => (p.score = 0));

    io.to(roomCode).emit("game-started", {
      question: questions[0],
      questionNumber: 1,
      totalQuestions: questions.length,
    });

    console.log(`ゲーム開始: ルーム ${roomCode}`);

    // タイマー開始
    startQuestionTimer(roomCode);
  });

  // 回答送信（1文字のみ）
  socket.on(
    "submit-answer",
    ({ roomCode, answer }: { roomCode: string; answer: string }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const question = questions[room.currentQuestion];
      const player = room.players.find((p) => p.id === socket.id);

      if (!player) return;

      // 正誤判定
      const correct = answer === question.answer;

      let points = 0;
      if (correct) {
        points = 30; // 正解
      }

      player.score += points;

      socket.emit("answer-result", {
        correct,
        points,
        totalScore: player.score,
        correctAnswer: question.answer, // 不正解の場合に正解を表示
      });

      console.log(
        `${player.name} の回答: ${answer} → ${
          correct ? "正解" : "不正解"
        } (${points}点)`
      );
    }
  );

  // 切断処理
  socket.on("disconnect", () => {
    console.log("プレイヤー切断:", socket.id);

    rooms.forEach((room, code) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);

      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);

        console.log(`${playerName} がルーム ${code} から退出`);

        if (room.players.length === 0) {
          if (room.timer) {
            clearInterval(room.timer);
          }
          rooms.delete(code);
          console.log(`ルーム ${code} を削除`);
        } else {
          if (room.host === socket.id && room.players.length > 0) {
            room.host = room.players[0].id;
            console.log(`新しいホスト: ${room.players[0].name}`);
          }
          io.to(code).emit("player-left", room);
        }
      }
    });
  });
});

// タイマー管理
function startQuestionTimer(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.timer) {
    clearInterval(room.timer);
  }

  let timeLeft = 20;

  room.timer = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit("timer-update", timeLeft);

    if (timeLeft <= 0) {
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = undefined;
      }
      nextQuestion(roomCode);
    }
  }, 1000);
}

function nextQuestion(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.currentQuestion++;

  if (room.currentQuestion >= questions.length) {
    // ゲーム終了
    room.gameState = "finished";

    const finalScores = room.players
      .map((p) => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("game-finished", {
      scores: finalScores,
    });

    console.log(`ゲーム終了: ルーム ${roomCode}`);
  } else {
    // 次の問題
    setTimeout(() => {
      const room = rooms.get(roomCode);
      if (!room) return;

      io.to(roomCode).emit("next-question", {
        question: questions[room.currentQuestion],
        questionNumber: room.currentQuestion + 1,
        totalQuestions: questions.length,
      });

      console.log(`次の問題: ${room.currentQuestion + 1}/${questions.length}`);

      startQuestionTimer(roomCode);
    }, 2000);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
  console.log(`問題数: ${questions.length}`);
});

// グレースフルシャットダウン
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
