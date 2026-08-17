# 前端HTML代码块折叠（TauriTavern 独立扩展）

聊天消息里把含 `<!DOCTYPE html>` / `<html` / `<head` / `<body` / `<script` 的
“前端 HTML 代码块”**默认隐藏（折叠）**，避免在 JS-Slash-Runner 等将其渲染成
iframe 界面之前，在 `.mes_text` 里甩一大坨源码。

- 不修改 TauriTavern / JSR 源码，独立扩展。
- 只隐藏 `<pre>`（`display:none` + `data-tt-fold` 标记），不包装、不移动节点，
  尽量不干扰 JSR/LWB 的 iframe 接管。
- 用 `MutationObserver` 观察 `#chat` 子树，虚拟化重建消息后会自动重新折叠。
- **不显示“查看源码”按钮**：源码完全交给 JSR 等渲染成交互界面。

## 文件

- `manifest.json` —— TT/SillyTavern 第三方扩展清单（`js` 入口）。
- `index.js` —— 折叠逻辑。

## 安装

把本目录放在 TT 的 `data_root/extensions/third-party/<name>/` 下
（与 JS-Slash-Runner 等第三方扩展同级的 `third-party/` 目录），
再到 TT「第三方扩展」面板勾选启用并刷新页面。

> 安卓上无法直接向 app 私有数据目录拷贝文件时，可用 TT 的 Git URL 安装：
> 用本仓库的 `.git` 地址在「第三方扩展」面板里安装。
