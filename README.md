## 環境変数

.env.sample ファイルを .env としてコピーします:

```bash
cp .env.sample .env
```

## 依存関係

インストール:

```bash
npm ci
```

## データベース

起動:

```bash
docker compose up -d
```

停止:

```bash
docker compose stop
```

削除:

```bash
docker compose down -v
```

## 開発コマンド

### Web サーバー

開発用 Web サーバーの起動:

```bash
npm run dev
```

### データベース操作

マイグレーション実行:

```bash
# 開発環境
npx prisma migrate dev

# 検証環境
npx prisma migrate deploy
```

シードデータ作成

```bash
npx prisma db seed
```

Prisma Client 生成

```bash
npx prisma generate
```

Prisma Studio の起動:

```bash
npx prisma studio
```
