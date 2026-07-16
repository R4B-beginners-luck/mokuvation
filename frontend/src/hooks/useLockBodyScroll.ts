import { useEffect } from 'react';

/**
 * モーダル表示中、背景（<body>）のスクロールをロックする。
 *
 * モーダルのオーバーレイは position: fixed で画面を覆っているだけなので、
 * <body> 自体は普通にスクロール可能なまま残ってしまう。
 * PC ではマウスホイールがオーバーレイに吸収されて気付きにくいが、
 * モバイルはオーバーレイの外側（余白部分）を指でドラッグすると
 * 背景の <body> がそのままスクロールしてしまう。
 *
 * body に position: fixed を当てて現在のスクロール位置を固定し、
 * アンマウント時に元の位置へ戻す（iOS Safari 対策込み）。
 *
 * 使い方: モーダルコンポーネントの中で `useLockBodyScroll();` を呼ぶだけ。
 */
export function useLockBodyScroll(): void {
  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;

    const originalStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = originalStyle.position;
      body.style.top = originalStyle.top;
      body.style.left = originalStyle.left;
      body.style.right = originalStyle.right;
      body.style.width = originalStyle.width;
      body.style.overflow = originalStyle.overflow;
      // position: fixed で固定していた分のスクロール位置を復元
      window.scrollTo(0, scrollY);
    };
  }, []);
}
