/**
 * スケジュール実行に関する設定
 */

// セッション維持に関するアラーム設定
// 勤之助自体は20分でセッションが切れる
export const KeepAliveAlarm = {
  name: 'keep-alive',
  periodInMinutes: 15,
};
