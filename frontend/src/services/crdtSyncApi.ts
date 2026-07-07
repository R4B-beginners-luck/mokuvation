/**
 * crdtSyncApi.ts
 *
 * サーバーの /api/crdt/push, /api/crdt/pull と通信するクライアント。
 *
 * サーバー側はAutomergeの中身を一切解釈しない「配送係」に徹する設計のため、
 * ここでやり取りするのは常に base64化されたAutomergeの変更バイナリ（change）であり、
 * マージ処理は必ずクライアント側（crdtStore.ts）で行う。
 *
 * 既存の taskApi.ts / goalApi.ts と同じ fetch オプションの組み立て方に合わせている。
 */

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const getFetchOptions = (method: string, body?: any): RequestInit => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  };
};

/** サーバーの crdt_changes テーブル1行に対応 */
export interface CrdtPullItem {
  id: number;
  change_blob: string; // base64化されたAutomergeの変更バイナリ
}

export interface CrdtPullResponse {
  changes: CrdtPullItem[];
  latest_id: number;
}

export const crdtSyncApi = {
  /**
   * ローカルに溜まったAutomergeの変更（base64の配列）をサーバーへ送る。
   * サーバーは中身を見ずに append するだけなので、他エンティティのAPIと違い
   * バリデーションエラー等で個別に失敗することは想定していない
   * （失敗時はHTTPレベルのエラーとして丸ごとthrowし、呼び出し側で全件リトライする）。
   */
  push: async (deviceId: string, changes: string[]): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/crdt/push`,
      getFetchOptions('POST', { device_id: deviceId, changes })
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
  },

  /**
   * サーバー側 crdt_changes テーブルの sinceId より新しい変更を取得する。
   * 自端末が push した分も含めて返ってくる想定（Automerge.applyChanges は
   * 既に取り込み済みの change を渡しても冪等なので問題ない）。
   */
  pull: async (sinceId: number): Promise<CrdtPullResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/crdt/pull?since=${sinceId}`,
      getFetchOptions('GET')
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, data: errorData };
    }
    return response.json();
  },
};
