// URL Rewrite Extension - Background Service Worker

// ブラウザAPIの互換性対応
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// デフォルト設定
const DEFAULT_STATE = {
  globalEnabled: true,
  rules: []
};

// 状態を読み込む
async function loadState() {
  const result = await browserAPI.storage.local.get(['urlRewriteState']);
  return result.urlRewriteState || DEFAULT_STATE;
}

// 状態を保存する
async function saveState(state) {
  await browserAPI.storage.local.set({ urlRewriteState: state });
}

// declarativeNetRequestにルールを適用
async function applyRules(state) {
  // 既存の動的ルールをすべて削除
  const existingRules = await browserAPI.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);
  
  if (existingRuleIds.length > 0) {
    await browserAPI.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
  }
  
  // グローバルがOFFなら何も登録しない
  if (!state.globalEnabled) {
    return;
  }
  
  // 有効なルールのみを登録
  const rulesToAdd = state.rules
    .filter(rule => rule.enabled)
    .map((rule, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          regexSubstitution: rule.replacement
        }
      },
      condition: {
        regexFilter: rule.pattern,
        resourceTypes: [
          'main_frame', 'sub_frame', 'stylesheet', 'script', 
          'image', 'font', 'object', 'xmlhttprequest', 'ping',
          'media', 'websocket', 'other'
        ]
      }
    }));
  
  if (rulesToAdd.length > 0) {
    await browserAPI.declarativeNetRequest.updateDynamicRules({
      addRules: rulesToAdd
    });
  }
}

// メッセージハンドラー
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // 非同期レスポンスを有効に
});

async function handleMessage(message) {
  const state = await loadState();
  
  switch (message.type) {
    case 'GET_STATE':
      return state;
    
    case 'SET_GLOBAL_ENABLED':
      state.globalEnabled = message.enabled;
      await saveState(state);
      await applyRules(state);
      return state;
    
    case 'ADD_RULE':
      const newRule = {
        id: Date.now(),
        pattern: message.pattern,
        replacement: message.replacement,
        enabled: true
      };
      state.rules.push(newRule);
      await saveState(state);
      await applyRules(state);
      return state;
    
    case 'UPDATE_RULE':
      const ruleIndex = state.rules.findIndex(r => r.id === message.ruleId);
      if (ruleIndex !== -1) {
        state.rules[ruleIndex] = {
          ...state.rules[ruleIndex],
          ...message.updates
        };
        await saveState(state);
        await applyRules(state);
      }
      return state;
    
    case 'DELETE_RULE':
      state.rules = state.rules.filter(r => r.id !== message.ruleId);
      await saveState(state);
      await applyRules(state);
      return state;
    
    case 'TOGGLE_RULE':
      const toggleIndex = state.rules.findIndex(r => r.id === message.ruleId);
      if (toggleIndex !== -1) {
        state.rules[toggleIndex].enabled = !state.rules[toggleIndex].enabled;
        await saveState(state);
        await applyRules(state);
      }
      return state;
    
    default:
      return { error: 'Unknown message type' };
  }
}

// 拡張機能起動時にルールを適用
browserAPI.runtime.onInstalled.addListener(async () => {
  const state = await loadState();
  await applyRules(state);
});

// Service Worker起動時にもルールを適用
(async () => {
  const state = await loadState();
  await applyRules(state);
})();
