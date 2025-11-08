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
  word: string;
  blanks: number;
  answer: string;
}

// ゲームの状態管理
const rooms = new Map<string, Room>();
const questions: Question[] = [
  { word: "一期一会", blanks: 1, answer: "会" },
  { word: "七転八起", blanks: 0, answer: "八" },
  // ... 他の問題
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
    // ルームに参加
    socket.join(roomCode);
    // ルーム情報をクライアントに送信
    socket.emit("room-created", { roomCode, room });

    console.log(`ルーム作成: ${roomCode} by ${playerName}`);
  });

  // ルーム参加
  socket.on("join-room", ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit("error", { message: "ルームが見つかりません" });
      return;
    }

    if (room.players.length >= 4) {
      socket.emit("error", { message: "ルームが満員です" });
      return;
    }

    // 既に参加しているか確認
    const alreadyJoined = room.players.some((p) => p.id === socket.id);
    if (alreadyJoined) {
      socket.emit("error", { message: "既に参加しています" });
      return;
    }

    room.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.join(roomCode); // プレイヤーを特定のルームに入れる

    io.to(roomCode).emit("player-joined", room); // そのルームの全員にメッセージを送信
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
      totalQuestions: 8,
    });

    // タイマー開始
    startQuestionTimer(roomCode);
  });

  // 回答送信
  socket.on("submit-answer", ({ roomCode, answer1 }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const question = questions[room.currentQuestion];
    const player = room.players.find((p) => p.id === socket.id);

    if (!player) return;

    const correct1 = answer1 === question.answer;

    let points = 0;
    if (correct1) {
      points = 30; // 完全正解
    }

    player.score += points;

    socket.emit("answer-result", {
      correct: correct1,
      points,
      totalScore: player.score,
    });
  });

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
          // 全員退出したらルームを削除
          if (room.timer) {
            clearInterval(room.timer);
          }
          rooms.delete(code);
          console.log(`ルーム ${code} を削除`);
        } else {
          // ホストが退出した場合、次のプレイヤーをホストに
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

// タイマー管理(各ルームで独立)
function startQuestionTimer(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  // 既存のタイマーがあればクリア
  if (room.timer) {
    clearInterval(room.timer);
  }

  let timeLeft = 30;

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

  if (room.currentQuestion >= 8) {
    // ゲーム終了
    room.gameState = "finished";
    io.to(roomCode).emit("game-finished", {
      scores: room.players.map((p) => ({ name: p.name, score: p.score })),
    });
  } else {
    // 次の問題
    setTimeout(() => {
      io.to(roomCode).emit("next-question", {
        question: questions[room.currentQuestion],
        questionNumber: room.currentQuestion + 1,
        totalQuestions: 8,
      });
      startQuestionTimer(roomCode);
    }, 2000);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
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
