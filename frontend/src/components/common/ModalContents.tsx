import React from 'react';

// ヘルプ機能の中身
export function HelpContent() {
  return (
    <div style={{ padding: '10px 0', lineHeight: '1.6' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Q. 目標マップとは何ですか？</h3>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        あなたの短期目標や日々のタスクを一元管理し、達成度を可視化するためのシステムです。
      </p>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Q. テーマカラーの変更方法は？</h3>
      <p style={{ color: '#666' }}>
        設定画面の「外観」からお好みのカラーを選択すると、即座にアプリ全体に反映されます。
      </p>
    </div>
  );
}

// 利用規約の中身
export function TermsContent() {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0', lineHeight: '1.6', color: '#555' }}>
      <p style={{ marginBottom: '12px' }}>
        この利用規約（以下，「本規約」といいます。）は，ユーザーの皆様に本サービスを快適にご利用いただくためのルールを定めています。
      </p>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第1条（適用）</h4>
      <p>本規約は，ユーザーと本サービスの利用に関わる一切の関係に適用されるものとします。</p>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第2条（禁止事項）</h4>
      <p>ユーザーは，本サービスの利用にあたり，法令または公序良俗に反する行為をしてはなりません。</p>
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>※ 正式な規約文章が用意でき次第、ここを差し替えます。</p>
    </div>
  );
}

// プライバシーポリシーの中身
export function PrivacyContent() {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0', lineHeight: '1.6', color: '#555' }}>
      <p style={{ marginBottom: '12px' }}>
        当組織は，本サービスにおけるユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシーを定めます。
      </p>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>1. 個人情報の管理</h4>
      <p>ユーザーからお預かりした個人情報は、不正アクセスや紛失、漏洩を防止するための措置を講じます。</p>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>2. 利用目的</h4>
      <p>取得したデータは、本サービスの機能提供およびサポート対応にのみ利用いたします。</p>
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>※ 正式なポリシー文章が用意でき次第、ここを差し替えます。</p>
    </div>
  );
}