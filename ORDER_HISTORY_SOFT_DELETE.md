# 注文履歴の論理削除機能

## 概要
注文履歴に論理削除（ソフトデリート）機能を実装しました。削除された注文履歴は物理的に削除されず、`deleted_at`フィールドにタイムスタンプが記録されます。

## データベース構造

### order_historyテーブル
```sql
CREATE TABLE order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL,
  items jsonb NOT NULL,
  total_amount integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL  -- 論理削除用カラム
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_order_history_deleted_at 
ON order_history(deleted_at) 
WHERE deleted_at IS NULL;
```

## 実装詳細

### 1. データベース層（`lib/database.ts`）

#### 注文履歴取得
```typescript
async getOrderHistory(): Promise<OrderHistory[]> {
  const { data, error } = await this.supabase
    .from('order_history')
    .select('*')
    .is('deleted_at', null)  // 論理削除されていないもののみ取得
    .order('completed_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
```

#### 論理削除
```typescript
async softDeleteOrderHistory(id: string): Promise<void> {
  const { error } = await this.supabase
    .from('order_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}
```

### 2. UI層（`app/order-history.tsx`）

#### 削除処理
- 注文カードを長押し（500ms）すると削除確認ダイアログが表示されます
- 削除を実行すると`softDeleteOrderHistory()`が呼び出されます
- 削除後、注文履歴リストが自動的に更新されます

```typescript
const handleDeleteOrder = (orderId: string, tableNumber: string) => {
  Alert.alert(
    '注文履歴を削除',
    `テーブル ${tableNumber} の注文履歴を削除しますか？\n\nこの操作は取り消せません。`,
    [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await database.softDeleteOrderHistory(orderId);
          await loadOrderHistory();
        },
      },
    ]
  );
};
```

## 使用方法

### アプリケーション側
1. 注文履歴画面を開く
2. 削除したい注文カードを長押し（500ms）
3. 確認ダイアログで「削除」をタップ
4. 注文履歴リストから自動的に削除されます

### データベース側

#### 有効な注文履歴のみ取得
```sql
SELECT * FROM order_history 
WHERE deleted_at IS NULL 
ORDER BY completed_at DESC;
```

#### 削除済み注文履歴のみ取得
```sql
SELECT * FROM order_history 
WHERE deleted_at IS NOT NULL 
ORDER BY deleted_at DESC;
```

#### すべての注文履歴を取得
```sql
SELECT * FROM order_history 
ORDER BY completed_at DESC;
```

#### 論理削除を実行
```sql
UPDATE order_history 
SET deleted_at = now() 
WHERE id = '注文履歴ID';
```

#### 論理削除を復元（アンデリート）
```sql
UPDATE order_history 
SET deleted_at = NULL 
WHERE id = '注文履歴ID';
```

#### 物理削除（本当に削除が必要な場合のみ）
```sql
DELETE FROM order_history 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < now() - interval '90 days';  -- 90日以上前に削除されたもの
```

## テストスクリプト

### テーブル構造確認
```bash
node check-table-structure.js
```

### 注文履歴の確認
```bash
node test-order-history.js
```

## マイグレーション（必要な場合）

既存のデータベースに`deleted_at`カラムを追加する場合：
```bash
# Supabase SQL Editorで以下のファイルを実行
# add-deleted-at-column.sql
```

## 注意事項

1. **論理削除の利点**
   - データの復元が可能
   - 削除履歴の監査が可能
   - データの整合性を保ちやすい

2. **論理削除の欠点**
   - データベースのサイズが増加
   - クエリに必ず`WHERE deleted_at IS NULL`を含める必要がある
   - 定期的なクリーンアップが必要な場合がある

3. **ベストプラクティス**
   - 定期的に古い削除済みデータをアーカイブ
   - パフォーマンス監視
   - インデックスの適切な使用

## トラブルシューティング

### エラー: 注文履歴が読み込めない
1. データベース接続を確認：`node check-table-structure.js`
2. `deleted_at`カラムが存在するか確認
3. RLSポリシーが正しく設定されているか確認

### エラー: deleted_atカラムが存在しない
```bash
# Supabase SQL Editorで実行
ALTER TABLE order_history 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
```

### エラー: 削除後も注文履歴が表示される
- アプリケーションを再起動
- 注文履歴画面で更新ボタンをタップ
- データベースで直接確認：
  ```sql
  SELECT id, table_number, deleted_at 
  FROM order_history 
  WHERE id = '対象のID';
  ```

## 現在の状態

✅ データベースに`deleted_at`カラムが存在  
✅ 論理削除機能が実装済み  
✅ アプリケーション側の実装完了  
✅ テストスクリプト準備完了  

アプリケーションは正常に動作する準備が整っています。
