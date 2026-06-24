# 化學氣體派車排班系統

Chemical Gas Dispatch System 是一個專為化學氣體運輸與派車排班設計的響應式網站系統。系統支援電腦與手機跨平台操作，並提供高度彈性的管理員功能，讓管理人員能夠依照個人的業務需求與偏好，自行調整管理介面與功能模組。

## Features

- 跨平台響應式設計：支援桌上型電腦與行動裝置，讓司機與管理員能隨時透過手機或電腦查看排班與派車狀態。
- 自訂義管理員儀表板：管理人員可依個人需求，動態新增、隱藏或拖曳調整管理介面的功能區塊。
- 化學氣體派車與排班調度：規劃提供車輛調度、人員排班邏輯處理，以及歷史任務追蹤功能。
- 權限分級管理：區分管理員、調度員與司機等不同權限，確保資料安全與操作簡便。

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- 拖曳套件：待評估，候選為 Dnd Kit

### Backend

- 待定，候選為 Node.js Express 或 Python FastAPI

### Database

- 待定，候選為 PostgreSQL 或 MongoDB
- 預計儲存車輛排班資料、氣體庫存、使用者資料與管理員個人化介面設定 JSON

## Installation

### 1. Clone the project

```bash
git clone https://github.com/your-organization/chemical-gas-dispatch.git
cd chemical-gas-dispatch
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

## Available Scripts

- `npm run dev`: 啟動前端開發伺服器
- `npm run build`: TypeScript 檢查並建立正式版前端
- `npm run preview`: 預覽正式版輸出

## Deployment

若要讓手機、平板與其他電腦都能開啟，需部署到公開網站平台，例如 Vercel 或 Netlify。詳細步驟請看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## Current Scope

已建立基礎前端架構、登入畫面、RWD 版面與前端路由。登入目前為前端假流程，尚未串接後端驗證。
