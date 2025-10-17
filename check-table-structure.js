#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://txbrrqdebofybvmgrwcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YnJycWRlYm9meWJ2bWdyd2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzY4NjgsImV4cCI6MjA3NjAxMjg2OH0.tn8Zi6-0XlmvlIIy5yjA-RQFLGcXcKguPmjYCYX2XUw';

console.log('=== テーブル構造チェック ===\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('1️⃣ order_historyテーブルの構造を確認...');
    
    // テストデータを挿入して構造を確認
    const testData = {
      table_number: 'TEST-001',
      items: [{ name: 'テスト', quantity: 1, price: 100 }],
      total_amount: 100
    };
    
    const { data, error } = await supabase
      .from('order_history')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ エラー:', error);
      console.log('\n💡 エラー分析:');
      if (error.message.includes('deleted_at')) {
        console.log('   → deleted_atカラムが存在しません');
        console.log('   → マイグレーションSQL（add-deleted-at-column.sql）を実行してください');
      } else {
        console.log('   → その他のエラー:', error.message);
      }
      return;
    }

    console.log('✅ テストデータ挿入成功');
    console.log('\nテーブルカラム:');
    console.log(JSON.stringify(data, null, 2));
    
    // テストデータを削除
    console.log('\n2️⃣ テストデータをクリーンアップ...');
    const { error: deleteError } = await supabase
      .from('order_history')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('❌ クリーンアップエラー:', deleteError);
    } else {
      console.log('✅ テストデータ削除完了');
    }
    
    console.log('\n📋 確認結果:');
    if (data.deleted_at !== undefined) {
      console.log('   ✅ deleted_atカラムが存在します');
      console.log('   ✅ 論理削除機能が利用可能です');
    } else {
      console.log('   ❌ deleted_atカラムが存在しません');
      console.log('   ⚠️  add-deleted-at-column.sqlを実行してください');
    }

  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

checkTableStructure();
