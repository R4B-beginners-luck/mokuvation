import React from 'react';

// ヘルプ機能の中身
export function HelpContent() {
  return (
    <div style={{ padding: '10px 0', lineHeight: '1.6' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Q. 目標マップとは何ですか？</h3>
      <p style={{ marginBottom: '16px', color: '#fff' }}>
        あなたの短期目標や日々のタスクを一元管理し、達成度を可視化するためのシステムです。
      </p>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Q. テーマカラーの変更方法は？</h3>
      <p style={{ color: '#fff' }}>
        設定画面の「外観」からお好みのカラーを選択すると、即座にアプリ全体に反映されます。
      </p>
    </div>
  );
}

// 利用規約の中身
export function TermsContent() {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0', lineHeight: '1.6', color: '#fff' }}>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第1条（適用）</h4>
      <p>
        本規約は、本アプリ「mokuvation」（以下、「当アプリ」といいます。）の利用条件を定めるものです。利用者は、本規約に同意した上で当アプリを利用するものとします。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第2条（利用登録）</h4>
      <p>
        利用者は、当アプリの定める方法により利用登録を行うものとします。また、登録情報に変更があった場合は、速やかに変更するものとします。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第3条（アカウント管理）</h4>
      <p>利用者は、自己の責任においてアカウントおよびパスワードを管理するものとします。</p>
      <p>
        第三者による不正利用により生じた損害について、当アプリは故意または重大な過失がある場合を除き、責任を負いません。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第4条（禁止事項）</h4>
      <p>利用者は、以下の行為を行ってはなりません。</p>
      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
        <li>法令または公序良俗に反する行為</li>
        <li>他者の権利または利益を侵害する行為</li>
        <li>当アプリの運営を妨害する行為</li>
        <li>不正アクセスやその試み</li>
        <li>他人になりすまして利用する行為</li>
        <li>その他、当アプリが不適切と判断する行為</li>
      </ul>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第5条（知的財産権）</h4>
      <p>
        当アプリに関するプログラム、デザイン、画像、文章等の知的財産権は、開発者または正当な権利者に帰属します。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第6条（サービスの目的）</h4>
      <p>当アプリは、利用者の目標管理およびモチベーション維持を支援することを目的として提供されます。</p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第7条（データの保存）</h4>
      <p>
        利用者が入力したタスク、目標等のデータは、サービス提供のため保存されます。ただし、システム障害等によりデータが消失しないことを保証するものではありません。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第8条（サービスの変更・停止）</h4>
      <p>
        当アプリは、メンテナンスやシステム障害等により、事前の通知なくサービスの全部または一部を変更、停止または終了することがあります。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第9条（アカウントの削除）</h4>
      <p>
        利用者は、所定の方法によりアカウントを削除できます。アカウント削除後は、保存されているデータが削除される場合があります。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第10条（免責事項）</h4>
      <p>当アプリは、サービスの完全性、正確性、継続性を保証するものではありません。</p>
      <p>
        利用者が当アプリを利用したこと、または利用できなかったことによって生じた損害について、当アプリは故意または重大な過失がある場合を除き、責任を負いません。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第11条（利用規約の変更）</h4>
      <p>
        当アプリは、必要に応じて本規約を変更することがあります。変更後の利用規約は、本アプリ上に掲載した時点で効力を生じるものとします。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>第12条（準拠法・管轄）</h4>
      <p>
        本規約は日本法に準拠します。本アプリに関して紛争が生じた場合は、法令に基づき適切な裁判所を管轄裁判所とします。
      </p>

      <p style={{ marginTop: '16px', fontSize: '12px', color: '#fff' }}>制定日・改定日　2026年7月16日</p>
    </div>
  );
}

// プライバシーポリシーの中身
export function PrivacyContent() {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0', lineHeight: '1.6', color: '#fff' }}>
      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>1. 取得する情報</h4>
      <p>当アプリでは、サービス提供のため、以下の情報を取得します。</p>
      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
        <li>ユーザー名</li>
        <li>メールアドレス</li>
        <li>パスワード（暗号化して保存します）</li>
        <li>ユーザーが入力したタスク、目標、進捗状況等の情報</li>
        <li>アカウントの作成日時など、サービスの利用に伴い記録される情報</li>
      </ul>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>2. 利用目的</h4>
      <p>取得した情報は、以下の目的で利用します。</p>
      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
        <li>アカウントの管理</li>
        <li>タスク・目標管理機能の提供</li>
        <li>ユーザー認証</li>
        <li>サービスの品質向上および機能改善</li>
        <li>お問い合わせへの対応</li>
      </ul>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>3. 個人情報の管理</h4>
      <p>
        当アプリでは、取得した個人情報について、不正アクセス、漏えい、紛失、改ざん等を防止するため、適切な安全管理措置を講じます。また、パスワードは暗号化して保存し、個人情報の適切な管理および保護に努めます。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>4. 第三者提供</h4>
      <p>当アプリでは、法令に基づく場合を除き、本人の同意を得ることなく個人情報を第三者へ提供することはありません。</p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>5. Cookie等の利用</h4>
      <p>当アプリでは、ログイン状態の維持やサービスの利便性向上のため、Cookieを利用する場合があります。</p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>6. 外部サービス</h4>
      <p>当アプリでは、以下の外部サービスを利用する場合があります。</p>
      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
        <li>Render（アプリの公開）</li>
        <li>データベースサービス</li>
        <li>メール送信サービス（利用する場合）</li>
      </ul>
      <p style={{ fontSize: '12px', color: '#fff' }}>
        ※利用する外部サービスは、必要に応じて本ポリシーに追加・更新します。
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>7. 個人情報の削除</h4>
      <p>
        ユーザーがアカウントを削除した場合、当アプリに保存されている個人情報は、法令等により保存が必要な場合を除き、適切な方法で削除します。（アカウント削除機能がある場合）
      </p>

      <h4 style={{ fontWeight: 'bold', marginTop: '12px' }}>8. プライバシーポリシーの変更</h4>
      <p>
        本ポリシーは、法令の改正やサービス内容の変更等に応じて、予告なく変更する場合があります。変更後のプライバシーポリシーは、本アプリ上に掲載した時点から効力を生じるものとします。
      </p>
      <p style={{ marginTop: '16px', fontSize: '12px', color: '#fff' }}>制定日・改定日　2026年7月16日</p>
    </div>
  );
}