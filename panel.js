// URL Rewrite Panel - UI Logic

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM要素
const globalEnabledCheckbox = document.getElementById('globalEnabled');
const addRuleForm = document.getElementById('addRuleForm');
const patternInput = document.getElementById('pattern');
const replacementInput = document.getElementById('replacement');
const rulesList = document.getElementById('rulesList');
const noRulesMessage = document.getElementById('noRulesMessage');
const editModal = document.getElementById('editModal');
const editRuleForm = document.getElementById('editRuleForm');
const editRuleIdInput = document.getElementById('editRuleId');
const editPatternInput = document.getElementById('editPattern');
const editReplacementInput = document.getElementById('editReplacement');
const cancelEditButton = document.getElementById('cancelEdit');

// 現在の状態
let currentState = null;

// 初期化
async function init() {
    await loadState();
    setupEventListeners();
}

// 状態を読み込んでUIを更新
async function loadState() {
    currentState = await browserAPI.runtime.sendMessage({ type: 'GET_STATE' });
    updateUI();
}

// UIを更新
function updateUI() {
    // グローバル有効スイッチ
    globalEnabledCheckbox.checked = currentState.globalEnabled;

    // ルール一覧
    renderRules();
}

// ルール一覧を描画
function renderRules() {
    rulesList.innerHTML = '';

    if (currentState.rules.length === 0) {
        noRulesMessage.classList.remove('hidden');
        return;
    }

    noRulesMessage.classList.add('hidden');

    currentState.rules.forEach(rule => {
        const ruleElement = createRuleElement(rule);
        rulesList.appendChild(ruleElement);
    });
}

// ルール要素を作成
function createRuleElement(rule) {
    const div = document.createElement('div');
    div.className = `rule-item${rule.enabled ? '' : ' disabled'}`;
    div.dataset.ruleId = rule.id;

    div.innerHTML = `
    <div class="rule-header">
      <div class="rule-toggle">
        <label class="switch">
          <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle" data-rule-id="${rule.id}">
          <span class="slider"></span>
        </label>
      </div>
      <div class="rule-actions">
        <button class="btn-icon" data-action="edit" data-rule-id="${rule.id}" title="編集">✏️</button>
        <button class="btn-icon btn-danger" data-action="delete" data-rule-id="${rule.id}" title="削除">🗑️</button>
      </div>
    </div>
    <div class="rule-content">
      <div class="rule-pattern">
        <span class="rule-label">パターン:</span>
        <span class="rule-value">${escapeHtml(rule.pattern)}</span>
      </div>
      <div class="rule-replacement">
        <span class="rule-label">置換先:</span>
        <span class="rule-value">${escapeHtml(rule.replacement)}</span>
      </div>
    </div>
  `;

    return div;
}

// HTML エスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// イベントリスナーを設定
function setupEventListeners() {
    // グローバル有効スイッチ
    globalEnabledCheckbox.addEventListener('change', async () => {
        currentState = await browserAPI.runtime.sendMessage({
            type: 'SET_GLOBAL_ENABLED',
            enabled: globalEnabledCheckbox.checked
        });
        updateUI();
    });

    // ルール追加フォーム
    addRuleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pattern = patternInput.value.trim();
        const replacement = replacementInput.value.trim();

        if (!pattern || !replacement) return;

        // 正規表現の妥当性チェック
        try {
            new RegExp(pattern);
        } catch (err) {
            alert('無効な正規表現です: ' + err.message);
            return;
        }

        currentState = await browserAPI.runtime.sendMessage({
            type: 'ADD_RULE',
            pattern,
            replacement
        });

        patternInput.value = '';
        replacementInput.value = '';
        updateUI();
    });

    // ルール一覧のクリックイベント（イベント委譲）
    rulesList.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const ruleId = parseInt(e.target.dataset.ruleId);

        if (!action || !ruleId) return;

        switch (action) {
            case 'toggle':
                currentState = await browserAPI.runtime.sendMessage({
                    type: 'TOGGLE_RULE',
                    ruleId
                });
                updateUI();
                break;

            case 'edit':
                openEditModal(ruleId);
                break;

            case 'delete':
                if (confirm('このルールを削除しますか？')) {
                    currentState = await browserAPI.runtime.sendMessage({
                        type: 'DELETE_RULE',
                        ruleId
                    });
                    updateUI();
                }
                break;
        }
    });

    // 編集モーダル
    editRuleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ruleId = parseInt(editRuleIdInput.value);
        const pattern = editPatternInput.value.trim();
        const replacement = editReplacementInput.value.trim();

        if (!pattern || !replacement) return;

        // 正規表現の妥当性チェック
        try {
            new RegExp(pattern);
        } catch (err) {
            alert('無効な正規表現です: ' + err.message);
            return;
        }

        currentState = await browserAPI.runtime.sendMessage({
            type: 'UPDATE_RULE',
            ruleId,
            updates: { pattern, replacement }
        });

        closeEditModal();
        updateUI();
    });

    cancelEditButton.addEventListener('click', closeEditModal);

    // モーダル外クリックで閉じる
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// 編集モーダルを開く
function openEditModal(ruleId) {
    const rule = currentState.rules.find(r => r.id === ruleId);
    if (!rule) return;

    editRuleIdInput.value = ruleId;
    editPatternInput.value = rule.pattern;
    editReplacementInput.value = rule.replacement;
    editModal.classList.add('show');
}

// 編集モーダルを閉じる
function closeEditModal() {
    editModal.classList.remove('show');
    editRuleIdInput.value = '';
    editPatternInput.value = '';
    editReplacementInput.value = '';
}

// 初期化実行
init();
