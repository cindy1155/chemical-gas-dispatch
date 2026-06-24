# CONTINUITY.md

## Project Status

- Project: 化學氣體派車排班系統
- Stage: 專案初始化
- Current focus: 前端專案架構、登入畫面與路由設定
- Roadmap status: 核心目標與開發規範已確立，基礎文件與前端初始架構正在建立中。

## Decisions

- 前端採用 React + TypeScript + Vite + Tailwind CSS。
- 路由採用 React Router。
- 登入流程目前僅做前端驗證與假導頁，後續再串接後端 API。
- 儀表板先建立模組卡片占位，保留後續拖曳與 JSON 偏好設定擴充空間。

## Next Candidates

- 建立資料庫 schema：車輛、司機、氣體庫存、排班紀錄、使用者偏好設定。
- 初始化後端專案結構。
- 實作使用者登入與 RBAC：管理員、司機。
- 開發跨平台 RWD 介面框架。
- 開發管理員可拖曳自訂的儀表板。
- 加入 ESLint 設定檔。
- 建立實際登入 API 合約。
- 規劃管理員儀表板 JSON schema。
- 實作排班資料模型與核心派車流程。

## Backlog

- 整合第三方地圖 API 顯示車輛即時位置與軌跡。
- 自動化排班演算法，基於距離、氣體種類與司機時數進行最佳化。
- 系統即時推播通知，例如 Line Notify 或 Web Push。
- 前端效能最佳化。
- 夜間模式 UI。
- 程式碼與元件重構。
