/**
 * 定数の定義
 */

// セッション維持に関するアラーム設定
// 勤之助は20分でセッションが切れる
export const KeepAliveAlarm = {
  name: 'keep-alive',
  periodInMinutes: 15,
};

// 勤之助のURL
export const SiteUrl = 'https://www.e4628.jp/';

// 出退勤ボタン
export const StampingType = {
  ON: 1,
  OFF: 2,
};

// 出退勤の状況
export const WorkingStatus = {
  UNKNOWN: 0,
  BEFORE: 1,
  ON_THE_JOB: 2,
  AFTER: 3,
};
