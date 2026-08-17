// 前端HTML代码块折叠 —— 独立扩展（不动 TauriTavern 源码）
// 目标：在聊天 .mes_text 里，把含 <!DOCTYPE html>/<html>/<head>/<body>/<script> 的
//       “前端 HTML 代码块”默认折叠（隐藏），避免在 JS-Slash-Runner 等接管前甩一大坨源码。
// 特点：
//   - 只隐藏 <pre>（display:none），不包装、不移动任何节点，尽量不干扰 JSR/LWB 的 iframe 接管。
//   - 无防抖、无条件隐藏：流式输出每 token 都会重建 .mes_text（含新的<pre>），
//     立即同步折叠才能消除“闪出源码”的竞态窗口。
//   - 用 MutationObserver 观察整棵文档，不依赖渲染事件时序，虚拟化重建也覆盖。

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
        const code = pre.querySelector('code');
        const text = (code && code.textContent) || pre.textContent || '';
        if (isFrontend(text)) {
            // 每次都强制隐藏（幂等）。不缓存“已折叠”状态做短路，因为流式
            // 每 token 都会 replaceChildren 重建 <pre>，且 fadeIn 路径用 morphdom
            // 可能重置 style；无条件 display:none 才能覆盖这些重建，消除“闪出”。
            markFolded(pre);
        }
    });
}

function processMesTexts() {
    // 不做防抖：流式输出每 token 都会整体重建 .mes_text（含新的、未折叠的 <pre>），
    // 防抖只会让折叠滞后一帧，造成源码闪现。改为每次 mutation 立即折叠。
    document.querySelectorAll('.mes_text, .streaming-display-text-content').forEach(foldMesText);
}

function hookChat() {
    // 观察整棵文档：既覆盖 #chat 内消息，也覆盖挂载在 body/dialog 下的流式显示
    const root = document.documentElement;
    if (!root) return false;
    const mo = new MutationObserver(() => processMesTexts());
    mo.observe(root, { childList: true, subtree: true });
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
