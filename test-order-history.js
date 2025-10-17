#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://txbrrqdebofybvmgrwcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YnJycWRlYm9meWJ2bWdyd2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzY4NjgsImV4cCI6MjA3NjAxMjg2OH0.tn8Zi6-0XlmvlIIy5yjA-RQFLGcXcKguPmjYCYX2XUw';

console.log('=== 注文履歴デバッグテスト ===\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderHistory() {
  try {
    console.log('1️⃣ すべての注文履歴を取得（deleted_atを含む）...');
    const { data: allOrders, error: allError } = await supabase
      .from('order_history')
      .select('*')
      .order('completed_at', { ascending: false });

    if (allError) {
      console.error('❌ エラー:', allError);
      return;
    }

    console.log(`✅ 全体: ${allOrders.length}件の注文履歴`);
    if (allOrders.length > 0) {
      console.log('\n全データ:');
      allOrders.forEach((order, index) => {
        console.log(`\n[${index + 1}] ID: ${order.id}`);
        console.log(`    テーブル: ${order.table_number}`);
        console.log(`    合計金額: ¥${order.total_amount}`);
        console.log(`    完了日時: ${order.completed_at}`);
        console.log(`    削除日時: ${order.deleted_at || 'なし（有効）'}`);
        console.log(`    アイテム数: ${order.items ? order.items.length : 0}`);
      });
    }

    console.log('\n\n2️⃣ 有効な注文履歴のみを取得（deleted_at IS NULL）...');
    const { data: activeOrders, error: activeError } = await supabase
      .from('order_history')
      .select('*')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (activeError) {
      console.error('❌ エラー:', activeError);
      return;
    }

    console.log(`✅ 有効: ${activeOrders.length}件の注文履歴`);
    if (activeOrders.length > 0) {
      console.log('\n有効データ:');
      activeOrders.forEach((order, index) => {
        console.log(`\n[${index + 1}] ID: ${order.id}`);
        console.log(`    テーブル: ${order.table_number}`);
        console.log(`    合計金額: ¥${order.total_amount}`);
        console.log(`    完了日時: ${order.completed_at}`);
        console.log(`    アイテム:`, order.items);
      });
    }

    console.log('\n\n3️⃣ 削除された注文履歴のみを取得（deleted_at IS NOT NULL）...');
    const { data: deletedOrders, error: deletedError } = await supabase
      .from('order_history')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (deletedError) {
      console.error('❌ エラー:', deletedError);
      return;
    }

    console.log(`✅ 削除済み: ${deletedOrders.length}件の注文履歴`);
    if (deletedOrders.length > 0) {
      console.log('\n削除済みデータ:');
      deletedOrders.forEach((order, index) => {
        console.log(`\n[${index + 1}] ID: ${order.id}`);
        console.log(`    テーブル: ${order.table_number}`);
        console.log(`    削除日時: ${order.deleted_at}`);
      });
    }

    console.log('\n\n📊 集計:');
    console.log(`   全注文: ${allOrders.length}件`);
    console.log(`   有効な注文: ${activeOrders.length}件`);
    console.log(`   削除済み注文: ${deletedOrders.length}件`);

  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testOrderHistory();
