const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ゲームの状態管理
const rooms = new Map();
const questions = [
  { word: "一期一会", blanks: [1, 3], answer: ["期", "会"] },
  { word: "七転八起", blanks: [0, 2], answer: ["七", "八"] },
  // ... 他の問題
];

io.on("connection", (socket) => {
  console.log("プレイヤー接続:", socket.id);

  // ルーム作成
  socket.on("create-room", (playerName) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const room = {
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

    room.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.join(roomCode); // プレイヤーを特定のルームに入れる

    io.to(roomCode).emit("player-joined", room); // そのルームの全員にメッセージを送信
  });

  // ゲーム開始
  socket.on("start-game", (roomCode) => {
    const room = rooms.get(roomCode);

    if (!room || room.host !== socket.id) return;

    room.gameState = "playing";
    room.currentQuestion = 0;

    io.to(roomCode).emit("game-started", {
      question: questions[0],
      questionNumber: 1,
      totalQuestions: 8,
    });

    // タイマー開始
    startQuestionTimer(roomCode);
  });

  // 回答送信
  socket.on("submit-answer", ({ roomCode, answer1, answer2 }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const question = questions[room.currentQuestion];
    const player = room.players.find((p) => p.id === socket.id);

    if (!player) return;

    const correct1 = answer1 === question.answer[0];
    const correct2 = answer2 === question.answer[1];

    let points = 0;
    if (correct1 && correct2) {
      points = 30; // 完全正解
    } else if (correct1 || correct2) {
      points = 10; // 部分正解
    }

    player.score += points;

    socket.emit("answer-result", {
      correct: correct1 && correct2,
      points,
      totalScore: player.score,
    });
  });

  // 切断処理
  socket.on("disconnect", () => {
    rooms.forEach((room, code) => {
      room.players = room.players.filter((p) => p.id !== socket.id);

      if (room.players.length === 0) {
        rooms.delete(code);
      } else {
        io.to(code).emit("player-left", room);
      }
    });
  });
});

// タイマー管理(各ルームで独立)
function startQuestionTimer(roomCode) {
  let timeLeft = 30;

  const timer = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit("timer-update", timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion(roomCode);
    }
  }, 1000);
}

function nextQuestion(roomCode) {
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
