// 前端HTML代码块折叠 —— 独立扩展（不动 TauriTavern 源码）
// 目标：在聊天 .mes_text 里，把含 <!DOCTYPE html>/<html>/<head>/<body>/<script> 的
//       “前端 HTML 代码块”默认折叠成一行，避免在 JS-Slash-Runner 等接管前甩一大坨源码。
// 特点：
//   - 只隐藏/显示 <pre>，不包装、不移动任何节点，尽量不干扰 JSR/LWB 的 iframe 接管。
//   - 幂等：已标记的 <pre> 不重复处理；消息被虚拟化重建后会自动重新折叠。
//   - 用 MutationObserver 观察 #chat，不依赖渲染事件时序，虚拟化重建也覆盖。

// 判定：与 JSR / TT 内部 isFrontendCode 思路一致
function isFrontend(text) {
    if (!text) return false;
    const t = String(text).toLowerCase();
    return t.indexOf('<html') >= 0
        || t.indexOf('<head') >= 0
        || t.indexOf('<body') >= 0
        || t.indexOf('<!doctype') >= 0
        || t.indexOf('<script') >= 0
        || t.indexOf('</html>') >= 0;
}

function isAlreadyFolded(pre) {
    return pre.getAttribute('data-tt-fold') === '1';
}

function markFolded(pre) {
    pre.setAttribute('data-tt-fold', '1');
    pre.style.display = 'none';
}

// 只折叠（隐藏）前端 HTML 代码块源码，不显示任何“查看源码”按钮，
// 源码完全交给 JS-Slash-Runner 等在之后渲染成 iframe 界面。
function foldMesText(txtElement) {
    const pres = txtElement.querySelectorAll('pre');
    pres.forEach((pre) => {
        if (pre.closest('.tt-fold-control')) return;         // 别碰我们自己加的控件
        if (isAlreadyFolded(pre)) return;
        const code = pre.querySelector('code');
        const text = (code && code.textContent) || pre.textContent || '';
        if (isFrontend(text)) {
            markFolded(pre);
        }
    });
}

let lastFold = 0;
function processMesTexts() {
    // 防抖，合并同一批渲染事件
    const now = Date.now();
    if (now - lastFold < 80) return;
    lastFold = now;
    document.querySelectorAll('#chat .mes .mes_text').forEach(foldMesText);
}

function hookChat() {
    const chat = document.querySelector('#chat');
    if (!chat) return false;
    const mo = new MutationObserver(() => processMesTexts());
    mo.observe(chat, { childList: true, subtree: true });
    processMesTexts();
    return true;
}

(function init() {
    if (hookChat()) return;
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        if (hookChat()) { clearInterval(timer); return; }
        if (tries > 100) clearInterval(timer);
    }, 150);

    if (window.eventSource && window.eventSource.on) {
        const E = window.eventSource;
        const ev = window.event_types || {};
        const names = [ev.CHARACTER_MESSAGE_RENDERED, ev.USER_MESSAGE_RENDERED, ev.MESSAGE_UPDATED, ev.MESSAGE_SWIPED, 'chatLoaded']
            .filter((x, i, a) => x && a.indexOf(x) === i);
        names.forEach((n) => { try { E.on(n, () => processMesTexts()); } catch (e) { /* ignore */ } });
    }
})();
