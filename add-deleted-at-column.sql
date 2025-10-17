-- 注文履歴テーブルに論理削除カラムを追加
-- 既存データには影響を与えず、deleted_atカラムを追加します

-- 1. deleted_atカラムを追加（既に存在する場合はスキップ）
ALTER TABLE order_history 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. パフォーマンス向上のためのインデックスを作成
CREATE INDEX IF NOT EXISTS idx_order_history_deleted_at 
ON order_history(deleted_at) 
WHERE deleted_at IS NULL;

-- 3. 確認用：テーブル構造を表示
-- \d order_history
