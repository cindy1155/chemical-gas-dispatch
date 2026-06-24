# Deployment

此專案目前是 Vite React 前端，可以部署到 Vercel 或 Netlify。部署後會取得公開網址，手機、平板與其他電腦都可以開啟。

## Option 1: Vercel

1. 到 https://vercel.com 註冊或登入。
2. 建立新專案並匯入此 GitHub repository。
3. Framework 選擇 `Vite`。
4. Build Command 使用：

```bash
npm run build
```

5. Output Directory 使用：

```bash
dist
```

6. 部署完成後，Vercel 會提供公開網址，例如：

```text
https://chemical-gas-dispatch.vercel.app
```

## Option 2: Netlify

1. 到 https://www.netlify.com 註冊或登入。
2. 建立新站台並匯入此 GitHub repository。
3. Build command 使用：

```bash
npm run build
```

4. Publish directory 使用：

```bash
dist
```

5. 部署完成後，Netlify 會提供公開網址。

## Local Build Check

部署前可先在本機確認正式版能成功建立：

```bash
npm install
npm run build
```

## Notes

- `localhost` 只能在自己的電腦開啟，不能分享給其他裝置。
- `file:///C:/...` 也是本機檔案，不能分享給其他裝置。
- 部署到 Vercel 或 Netlify 後，才會有可分享給任何裝置的 `https://...` 網址。
- 目前 Google Maps 使用免 API key 的 iframe 嵌入方式。若後續要即時車輛定位，需要接車機 GPS 或司機手機定位 API。
