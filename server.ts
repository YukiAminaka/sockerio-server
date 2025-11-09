import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const prisma = new PrismaClient();

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
  questionOrder: number[];
  timer?: NodeJS.Timeout;
}

interface Question {
  word: string; // 四字熟語
  yomi: string; // 読み仮名
  meaning: string; // 意味
  blank: number; // 空欄の位置（0-3）
  answer: string; // 正解の文字
  hint?: string; // ヒント
  difficulty: string; // 難易度
}

// ゲームの状態管理
const rooms = new Map<string, Room>();

// データベースから問題を取得してキャッシュ
let questionsCache: Question[] = [];

// 問題をデータベースから読み込み
async function loadQuestions() {
  try {
    questionsCache = await prisma.question.findMany({
      orderBy: {
        id: "asc",
      },
    });
    console.log(`${questionsCache.length}件の問題を読み込みました`);
  } catch (error) {
    console.error("問題の読み込みに失敗:", error);
    questionsCache = [];
  }
}

// 難易度別に問題を取得
async function getQuestionsByDifficulty(difficulty: string) {
  try {
    return await prisma.question.findMany({
      where: {
        difficulty: difficulty,
      },
    });
  } catch (error) {
    console.error("問題の取得に失敗:", error);
    return [];
  }
}

// ランダムな問題順序を生成
function generateRandomQuestionOrder(count: number): number[] {
  const order = Array.from({ length: questionsCache.length }, (_, i) => i);
  // Fisher-Yates シャッフル
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, Math.min(count, questionsCache.length));
}

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
      questionOrder: [],
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

    // ランダムな問題順序を生成（8問）
    room.questionOrder = generateRandomQuestionOrder(8);

    // 全プレイヤーのスコアをリセット
    room.players.forEach((p) => (p.score = 0));

    const firstQuestion = questionsCache[room.questionOrder[0]];
    io.to(roomCode).emit("game-started", {
      question: firstQuestion,
      questionNumber: 1,
      totalQuestions: room.questionOrder.length,
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

      const question = questionsCache[room.questionOrder[room.currentQuestion]];
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

  if (room.currentQuestion >= room.questionOrder.length) {
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

      const nextQuestion =
        questionsCache[room.questionOrder[room.currentQuestion]];
      io.to(roomCode).emit("next-question", {
        question: nextQuestion,
        questionNumber: room.currentQuestion + 1,
        totalQuestions: room.questionOrder.length,
      });

      console.log(
        `次の問題: ${room.currentQuestion + 1}/${room.questionOrder.length}`
      );

      startQuestionTimer(roomCode);
    }, 2000);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
  console.log(`問題数: ${questionsCache.length}`);
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
