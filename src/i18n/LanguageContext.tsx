import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type Language = "zh" | "en";

type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const translations: Record<string, string> = {
  "化學氣體運輸與派車排班管理": "Chemical Gas Transport and Dispatch Scheduling",
  "支援跨平台操作、排班協作與管理員自訂儀表板，協助車隊快速掌握任務、車輛與庫存狀態。":
    "Supports cross-platform operations, dispatch collaboration, and customizable admin dashboards for quick visibility into tasks, fleet, and inventory.",
  "司機與主管可在手機、平板與桌機穩定操作。":
    "Drivers and managers can work reliably on phones, tablets, and desktops.",
  "後續可用 JSON 儲存每位管理員的介面偏好。":
    "Admin interface preferences can later be stored with JSON.",
  "化學氣體派車排班系統": "Chemical Gas Dispatch System",
  "登入管理平台": "Sign In to Admin Platform",
  "請使用公司帳號登入，後續可依角色顯示排班、車隊與庫存模組。":
    "Sign in with your company account. Scheduling, fleet, and inventory modules will later be shown by role.",
  "帳號": "Account",
  "密碼": "Password",
  "請輸入帳號與密碼。": "Please enter account and password.",
  "登入嘗試過多，請稍後再試。": "Too many sign-in attempts. Please try again later.",
  "已達登入嘗試上限，請 5 分鐘後再試。":
    "The sign-in attempt limit has been reached. Please try again in 5 minutes.",
  "登入已暫時鎖定": "Sign-in is temporarily locked",
  "剩餘": "Remaining",
  "分鐘": "minutes",
  "司機帳號目前不可進入管理後台，請使用管理員或調度員帳號。":
    "Driver accounts cannot access the admin dashboard yet. Please use an admin or dispatcher account.",
  "登入": "Sign In",
  "尚未有帳號？": "No account yet?",
  "註冊帳號": "Create Account",
  "例如 dispatcher01": "e.g. dispatcher01",
  "輸入密碼": "Enter password",
  "建立管理平台帳號。實際審核與權限分配將於後端 RBAC 完成後串接。":
    "Create an admin platform account. Review and role permissions will be connected after backend RBAC is ready.",
  "姓名": "Name",
  "角色": "Role",
  "確認密碼": "Confirm Password",
  "請完整填寫註冊資料。": "Please complete the registration form.",
  "請完整填寫日期、派車時間、出廠時間、指定到達時間、客戶、車輛與司機。":
    "Please complete date, dispatch time, departure time, required arrival time, customer, vehicle, and driver.",
  "請完整填寫日期、派車時間、出廠時間、指定到達時間、客戶、槽車編號與司機。":
    "Please complete date, dispatch time, departure time, required arrival time, customer, tanker number, and driver.",
  "密碼至少需要 8 個字元。": "Password must be at least 8 characters.",
  "兩次輸入的密碼不一致。": "The two passwords do not match.",
  "建立帳號": "Create Account",
  "已經有帳號？": "Already have an account?",
  "回到登入": "Back to Sign In",
  "例如 王小明": "e.g. Alex Wang",
  "例如 driver01": "e.g. driver01",
  "調度員": "Dispatcher",
  "司機": "Driver",
  "管理員": "Admin",
  "目前角色": "Current Role",
  "登入有效期限": "Session expires in",
  "安全事件紀錄": "Security Event Log",
  "顯示最近登入、阻擋、鎖定、過期與登出紀錄。":
    "Shows recent sign-in, block, lockout, expiration, and sign-out records.",
  "重新整理": "Refresh",
  "時間": "Time",
  "事件": "Event",
  "說明": "Description",
  "登入成功": "Sign-in Success",
  "登入被擋": "Sign-in Blocked",
  "角色阻擋": "Role Blocked",
  "登入鎖定": "Sign-in Locked",
  "登入過期": "Session Expired",
  "未授權進入": "Unauthorized Access",
  "管理後台登入成功": "Admin dashboard sign-in succeeded",
  "帳號或密碼未填完整": "Account or password was incomplete",
  "司機帳號嘗試進入管理後台": "Driver account attempted to access the admin dashboard",
  "未登入直接進入管理後台": "Attempted to open the admin dashboard without signing in",
  "登入角色遺失": "Signed-in role was missing",
  "登入角色不允許進入管理後台": "Signed-in role is not allowed to access the admin dashboard",
  "達到登入嘗試上限": "Sign-in attempt limit reached",
  "鎖定期間再次嘗試登入": "Sign-in attempted during lockout",
  "登入有效期限已過期": "Session expiration time passed",
  "使用者主動登出": "User signed out",
  "尚無安全事件紀錄": "No security events yet",
  "至少 8 個字元": "At least 8 characters",
  "再次輸入密碼": "Enter password again",
  "管理員儀表板": "Admin Dashboard",
  "登出": "Sign Out",
  "今日派車": "Today's Dispatches",
  "固定派車": "Fixed Dispatches",
  "待派車": "Pending",
  "配送中": "In Transit",
  "已完成": "Completed",
  "每日派車列表": "Daily Dispatch List",
  "派車表": "Dispatch Sheet",
  "客戶訂單總表": "Customer Orders",
  "氣體明細表": "Gas Tanker Details",
  "gas物料價格表": "Gas Material Prices",
  "資料連動": "Link Data",
  "搜尋欄位": "Search Field",
  "搜尋": "Search",
  "輸入關鍵字": "Enter keyword",
  "清除": "Clear",
  "比對狀態": "Match Status",
  "已對應": "Matched",
  "未對應": "Not Matched",
  "訂單派車日期": "Order Dispatch Date",
  "訂單派車時間": "Order Dispatch Time",
  "訂單出廠時間": "Order Departure Time",
  "訂單指定到達時間": "Order Required Arrival Time",
  "訂單客戶": "Order Customer",
  "訂單數量": "Order Quantity",
  "訂單收貨時間": "Order Receiving Time",
  "訂單指定槽車": "Order Assigned Tanker",
  "訂單司機": "Order Driver",
  "訂單狀態": "Order Status",
  "顯示匯入的客戶訂單資料，開啟資料連動後可帶入派車表。":
    "Shows imported customer orders. When data linking is enabled, rows can be applied to the dispatch sheet.",
  "槽車編號可與派車表串聯，選取後會同步高壓車或低壓車標示。":
    "Tanker numbers can link to the dispatch sheet and sync high-pressure or low-pressure labels.",
  "物料價格資料可帶入客戶、訂單與氣體種類，後續可再串接正式報價資料庫。":
    "Material price data can fill customer, order, and gas type fields. It can later connect to a pricing database.",
  "一般排班與固定頻率派車明細會顯示在同一份每日派車列表中。":
    "General schedules and generated fixed-frequency details appear in the same daily dispatch list.",
  "可追蹤車輛即時位置，並將目前派車表匯出為 Excel。":
    "Track vehicle location in real time and export the current dispatch list to Excel.",
  "匯出 Excel": "Export Excel",
  "匯入客戶訂單": "Imported Customer Orders",
  "匯入司機": "Imported Drivers",
  "匯入槽車": "Imported Tankers",
  "匯入物料價格": "Imported Material Prices",
  "車輛即時定位": "Live Vehicle Location",
  "在 Google Maps 開啟": "Open in Google Maps",
  "新增派車": "Add Dispatch",
  "可登錄一般排班或固定頻率派車，固定派車會一次產生多筆明細。":
    "Add a general schedule or fixed-frequency dispatch. Fixed dispatches generate multiple detail rows at once.",
  "登錄類型": "Schedule Type",
  "一般排班": "General Schedule",
  "派車日期": "Dispatch Date",
  "派車時間": "Dispatch Time",
  "出廠時間": "Departure Time",
  "指定到達時間": "Required Arrival Time",
  "訂單編號": "Order Number",
  "客戶 / 路線": "Customer / Route",
  "客戶/路線": "Customer / Route",
  "客戶代碼": "Customer Code",
  "物料": "Material",
  "數量": "Quantity",
  "目的地": "Destination",
  "收貨時間": "Receiving Time",
  "指定槽車": "Assigned Tanker",
  "槽車編號": "Tanker No.",
  "槽車壓力": "Tanker Pressure",
  "高壓車": "High-Pressure Tanker",
  "低壓車": "Low-Pressure Tanker",
  "請選擇槽車編號": "Select tanker number",
  "選擇槽車後自動帶入": "Auto-filled after selecting tanker",
  "車牌": "Plate Number",
  "容量噸": "Capacity Ton",
  "容積": "Volume",
  "製造商": "Manufacturer",
  "備註": "Remark",
  "可自由輸入備註": "Enter remarks freely",
  "合約價格": "Contract Price",
  "付款條件": "Payment Term",
  "月用量": "Monthly Usage",
  "每次出貨量": "Shipment Qty",
  "操作": "Action",
  "帶入派車": "Apply to Dispatch",
  "氣體種類": "Gas Type",
  "車輛": "Vehicle",
  "狀態": "Status",
  "固定頻率": "Fixed Frequency",
  "產生明細筆數": "Number of Details",
  "產生固定派車明細": "Generate Fixed Dispatch Details",
  "日": "Daily",
  "每二日": "Every 2 Days",
  "週": "Weekly",
  "追蹤定位": "Track Location",
  "未填": "Not Filled",
  "任務編號": "Task ID",
  "派車": "Dispatch",
  "出廠": "Depart",
  "到達": "Arrive",
  "固定路線：新竹園區每日補氣": "Fixed route: Hsinchu Science Park daily refill",
  "新竹科學園區 A 廠": "Hsinchu Science Park Plant A",
  "台中精密製造 B 廠": "Taichung Precision Manufacturing Plant B",
  "桃園電子材料 C 廠": "Taoyuan Electronic Materials Plant C",
  "新竹市東區": "East District, Hsinchu City",
  "新竹科學園區力行路附近": "Near Lixing Road, Hsinchu Science Park",
  "台中市西屯區": "Xitun District, Taichung City",
  "台灣大道四段附近": "Near Taiwan Boulevard Section 4",
  "桃園市龜山區": "Guishan District, Taoyuan City",
  "文化一路附近": "Near Wenhua 1st Road",
  "尚無即時區域資料": "No live area data",
  "此車輛尚未串接 GPS 回傳位置": "This vehicle has not connected GPS location data yet",
  "尚未更新": "Not updated yet",
  "匯入資料": "Imported data",
  "槽車資料": "Tanker data",
  "未標示壓力": "Pressure not specified",
  "噸": "tons",
  "2 分鐘前": "2 minutes ago",
  "5 分鐘前": "5 minutes ago",
  "8 分鐘前": "8 minutes ago",
  "座標": "Coordinates",
  "更新": "Updated",
  "Google Maps 位置": "Google Maps Location",
  "王司機": "Driver Wang",
  "陳司機": "Driver Chen",
  "林司機": "Driver Lin",
  "車輛 A-102": "Vehicle A-102",
  "車輛 B-216": "Vehicle B-216",
  "車輛 C-031": "Vehicle C-031",
  "例如 台南半導體 D 廠": "e.g. Tainan Semiconductor Plant D",
  "例如 車輛 D-088": "e.g. Vehicle D-088",
  "例如 張司機": "e.g. Driver Chang",
  "例如 SO-20260624-001": "e.g. SO-20260624-001",
  "氮氣 N2": "Nitrogen N2",
  "氧氣 O2": "Oxygen O2",
  "氬氣 Ar": "Argon Ar",
  "二氧化碳 CO2": "Carbon Dioxide CO2",
  "已達今日上限": "Daily limit reached",
  "今日可新增": "Available today",
  "趟": "trips",
  "語言": "Language",
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem("app-language");
    return savedLanguage === "en" ? "en" : "zh";
  });

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      toggleLanguage: () => {
        setLanguage((current) => {
          const nextLanguage = current === "zh" ? "en" : "zh";
          window.localStorage.setItem("app-language", nextLanguage);
          return nextLanguage;
        });
      },
      t: (text) => (language === "en" ? translations[text] || text : text),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      onClick={toggleLanguage}
      type="button"
    >
      {t("語言")}：{language === "zh" ? "中文" : "English"}
    </button>
  );
}
