# 前端HTML代码块折叠（TauriTavern 独立扩展）

> ⚠️ **本仓库所有文件（代码、清单、本文档）均由 AI 生成。**

## 起因

在 TauriTavern（安卓版）里，用户通过正则把两类**前端组件**——分支选择器（匹配
`<branches>…</branches>`）和蛾摩拉小说标题（匹配 `[CHAP]…[/novel_header]`）——以
Markdown 代码围栏块的形式替换进 AI 消息。这些替换内容本质是一整份前置 HTML 文档
（`<!DOCTYPE html>` 起步，内部含 `<script>` 与 `onclick` 交互），由
JS-Slash-Runner（JSR）扩展在渲染后接管、以 iframe 实时渲染成交互界面。

问题在于：TT 用 showdown 把外层 ``` 围栏渲染成展开的 `<pre>`，所以在 JSR 接管
iframe 之前，消息区会先甩出一大坨前端源码；流式输出时还会因逐 token 重建 `.mes_text`
而时不时“闪出”源码。

## 作用

本扩展在**渲染前**把这些前端 HTML 代码块**默认折叠（隐藏）**，从而：

- 不显示一大坨源码，也不显示“查看源码”按钮；
- 只做 `pre.style.display = 'none'`（幂等、无条件），**不包装、不移动节点**，
  因此不干扰 JSR 后续把该代码块 `div.TH-render` 接管成 iframe 的交互界面。

实现要点：

- `MutationObserver` 观察 `document.documentElement`，扫描 `.mes_text` 与
  `.streaming-display-text-content` 里的 `<pre>`；
- `isFrontend()` 命中 `<!doctype>` / `<html` / `<head` / `<body` / `<script` /
  `</html>` 即判定为前端 HTML，随即 `display:none`；
- **无防抖、无条件隐藏**：流式每 token 会全量重建 `.mes_text`（产生新的、未折叠
  的 `<pre>`），立即同步折叠才能消除“闪出源码”的竞态窗口。

## 文件

- `manifest.json` —— TT/SillyTavern 第三方扩展清单（`js` 入口）。
- `index.js` —— 折叠逻辑。

## 安装

把本目录放在 TT 的 `data_root/extensions/third-party/<name>/` 下
（与 JS-Slash-Runner 等第三方扩展同级的 `third-party/` 目录），
再到 TT「第三方扩展」面板勾选启用并刷新页面。

> 安卓上无法直接向 app 私有数据目录拷贝文件时，可用 TT 的 Git URL 安装：
> 用本仓库的 `.git` 地址在「第三方扩展」面板里安装。
