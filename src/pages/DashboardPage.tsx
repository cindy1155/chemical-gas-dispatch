import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageToggle, useLanguage } from "../i18n/LanguageContext";

type DispatchStatus = "待派車" | "配送中" | "已完成";
type GasType = "氮氣 N2" | "氧氣 O2" | "氬氣 Ar" | "二氧化碳 CO2";
type FixedFrequency = "日" | "每二日" | "週";
type ScheduleType = "一般排班" | "固定派車";

type DispatchFormState = {
  scheduleType: ScheduleType;
  serviceDate: string;
  orderNumber: string;
  dispatchTime: string;
  departureTime: string;
  arrivalTime: string;
  customer: string;
  gasType: GasType;
  vehicle: string;
  driver: string;
  frequency: FixedFrequency;
  generateCount: number;
};

type DispatchTask = DispatchFormState & {
  id: string;
  status: DispatchStatus;
};

type VehicleLocation = {
  vehicle: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

const gasTripLimits: Record<GasType, number> = {
  "氮氣 N2": 15,
  "氧氣 O2": 5,
  "氬氣 Ar": 2,
  "二氧化碳 CO2": 3,
};

const gasOptions: GasType[] = ["氮氣 N2", "氧氣 O2", "氬氣 Ar", "二氧化碳 CO2"];
const frequencyOptions: FixedFrequency[] = ["日", "每二日", "週"];
const scheduleTypeOptions: ScheduleType[] = ["一般排班", "固定派車"];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const addDays = (date: string, days: number) => {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
};

const getFrequencyStepDays = (frequency: FixedFrequency) => {
  if (frequency === "每二日") {
    return 2;
  }

  if (frequency === "週") {
    return 7;
  }

  return 1;
};

const initialVehicleLocations: Record<string, VehicleLocation> = {
  "車輛 A-102": {
    vehicle: "車輛 A-102",
    area: "新竹市東區",
    address: "新竹科學園區力行路附近",
    latitude: 24.7819,
    longitude: 121.0086,
    updatedAt: "2 分鐘前",
  },
  "車輛 B-216": {
    vehicle: "車輛 B-216",
    area: "台中市西屯區",
    address: "台灣大道四段附近",
    latitude: 24.1811,
    longitude: 120.6037,
    updatedAt: "5 分鐘前",
  },
  "車輛 C-031": {
    vehicle: "車輛 C-031",
    area: "桃園市龜山區",
    address: "文化一路附近",
    latitude: 25.0532,
    longitude: 121.3669,
    updatedAt: "8 分鐘前",
  },
};

const initialTasks: DispatchTask[] = [
  {
    id: "DSP-001",
    scheduleType: "一般排班",
    serviceDate: getTodayDate(),
    orderNumber: "SO-20260624-001",
    dispatchTime: "08:30",
    departureTime: "09:00",
    arrivalTime: "10:15",
    customer: "新竹科學園區 A 廠",
    gasType: "氮氣 N2",
    vehicle: "車輛 A-102",
    driver: "王司機",
    frequency: "日",
    generateCount: 1,
    status: "配送中",
  },
  {
    id: "FIX-001",
    scheduleType: "固定派車",
    serviceDate: getTodayDate(),
    orderNumber: "SO-FIX-N2-001",
    dispatchTime: "08:00",
    departureTime: "08:30",
    arrivalTime: "09:45",
    customer: "固定路線：新竹園區每日補氣",
    gasType: "氮氣 N2",
    vehicle: "車輛 A-102",
    driver: "王司機",
    frequency: "日",
    generateCount: 1,
    status: "待派車",
  },
  {
    id: "DSP-002",
    scheduleType: "一般排班",
    serviceDate: getTodayDate(),
    orderNumber: "SO-20260624-002",
    dispatchTime: "11:00",
    departureTime: "11:30",
    arrivalTime: "13:00",
    customer: "台中精密製造 B 廠",
    gasType: "氧氣 O2",
    vehicle: "車輛 B-216",
    driver: "陳司機",
    frequency: "日",
    generateCount: 1,
    status: "待派車",
  },
  {
    id: "DSP-003",
    scheduleType: "一般排班",
    serviceDate: getTodayDate(),
    orderNumber: "SO-20260624-003",
    dispatchTime: "13:30",
    departureTime: "14:00",
    arrivalTime: "15:10",
    customer: "桃園電子材料 C 廠",
    gasType: "氬氣 Ar",
    vehicle: "車輛 C-031",
    driver: "林司機",
    frequency: "日",
    generateCount: 1,
    status: "已完成",
  },
];

const initialFormState: DispatchFormState = {
  scheduleType: "一般排班",
  serviceDate: getTodayDate(),
  orderNumber: "",
  dispatchTime: "",
  departureTime: "",
  arrivalTime: "",
  customer: "",
  gasType: "氮氣 N2",
  vehicle: "",
  driver: "",
  frequency: "日",
  generateCount: 7,
};

const statusStyles: Record<DispatchStatus, string> = {
  待派車: "bg-amber-50 text-amber-700 ring-amber-200",
  配送中: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  已完成: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const typeStyles: Record<ScheduleType, string> = {
  一般排班: "bg-slate-100 text-slate-700 ring-slate-200",
  固定派車: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function DashboardPage() {
  const { language, t } = useLanguage();
  const [tasks, setTasks] = useState<DispatchTask[]>(initialTasks);
  const [form, setForm] = useState<DispatchFormState>(initialFormState);
  const [error, setError] = useState("");
  const [trackedVehicle, setTrackedVehicle] = useState("車輛 A-102");
  const [vehicleLocations, setVehicleLocations] =
    useState<Record<string, VehicleLocation>>(initialVehicleLocations);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      fixed: tasks.filter((task) => task.scheduleType === "固定派車").length,
      pending: tasks.filter(
        (task) => task.status === "待派車" && task.serviceDate === getTodayDate(),
      ).length,
      active: tasks.filter((task) => task.status === "配送中").length,
    }),
    [tasks],
  );

  const gasUsage = useMemo(
    () =>
      gasOptions.map((gasType) => ({
        gasType,
        limit: gasTripLimits[gasType],
        used: tasks.filter(
          (task) => task.gasType === gasType && task.serviceDate === getTodayDate(),
        ).length,
      })),
    [tasks],
  );

  const trackedLocation = vehicleLocations[trackedVehicle];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVehicleLocations((current) => {
        const currentLocation = current[trackedVehicle];

        if (!currentLocation) {
          return current;
        }

        return {
          ...current,
          [trackedVehicle]: {
            ...currentLocation,
            latitude: Number((currentLocation.latitude + 0.00012).toFixed(6)),
            longitude: Number((currentLocation.longitude + 0.00009).toFixed(6)),
            updatedAt: new Date().toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        };
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [trackedVehicle]);

  const getGasLimitError = (
    gasType: GasType,
    serviceDate: string,
    additionalTrips = 1,
  ) => {
    const usedTrips = tasks.filter(
      (task) => task.gasType === gasType && task.serviceDate === serviceDate,
    ).length;
    const maxTrips = gasTripLimits[gasType];

    if (usedTrips + additionalTrips > maxTrips) {
      return language === "en"
        ? `${serviceDate} ${t(gasType)} exceeds the ${maxTrips}-trip limit. Please adjust gas type, date, or detail count.`
        : `${serviceDate} ${gasType} 已超過 ${maxTrips} 趟上限，請調整氣體種類、日期或產生筆數。`;
    }

    return "";
  };

  const isDispatchFormIncomplete = (data: DispatchFormState) =>
    !data.dispatchTime.trim() ||
    !data.serviceDate.trim() ||
    !data.departureTime.trim() ||
    !data.arrivalTime.trim() ||
    !data.customer.trim() ||
    !data.vehicle.trim() ||
    !data.driver.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isDispatchFormIncomplete(form)) {
      setError(t("請完整填寫日期、派車時間、出廠時間、指定到達時間、客戶、車輛與司機。"));
      return;
    }

    const generatedTasks = buildDispatchTasks(form, tasks.length);
    const tripsByDate = generatedTasks.reduce<Record<string, number>>((counts, task) => {
      counts[task.serviceDate] = (counts[task.serviceDate] || 0) + 1;
      return counts;
    }, {});

    const limitError = Object.entries(tripsByDate)
      .map(([serviceDate, count]) =>
        getGasLimitError(form.gasType, serviceDate, count),
      )
      .find(Boolean);

    if (limitError) {
      setError(limitError);
      return;
    }

    setTasks((current) => [...generatedTasks, ...current]);
    setForm(initialFormState);
  };

  const handleTrackVehicle = (vehicle: string) => {
    setTrackedVehicle(vehicle);
    setVehicleLocations((current) => {
      if (current[vehicle]) {
        return current;
      }

      return {
        ...current,
        [vehicle]: {
          vehicle,
          area: "尚無即時區域資料",
          address: "此車輛尚未串接 GPS 回傳位置",
          latitude: 24.1477,
          longitude: 120.6736,
          updatedAt: "尚未更新",
        },
      };
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-cyan-700">
              Chemical Gas Dispatch System
            </p>
            <h1 className="text-xl font-semibold">{t("管理員儀表板")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              to="/login"
            >
              {t("登出")}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("今日派車")} value={summary.total} />
        <SummaryCard label={t("固定派車")} value={summary.fixed} />
        <SummaryCard label={t("待派車")} value={summary.pending} />
        <SummaryCard label={t("配送中")} value={summary.active} />
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        {gasUsage.map((item) => (
          <GasLimitCard
            gasType={item.gasType}
            key={item.gasType}
            limit={item.limit}
            used={item.used}
          />
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            description="一般排班與固定頻率派車明細會顯示在同一份每日派車列表中。"
            title="每日派車列表"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">
              {t("可追蹤車輛即時位置，並將目前派車表匯出為 Excel。")}
            </p>
            <button
              className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800"
              onClick={() => exportDispatchExcel(tasks)}
              type="button"
            >
              {t("匯出 Excel")}
            </button>
          </div>
          {trackedLocation ? <VehicleLocationPanel location={trackedLocation} /> : null}
          <DispatchList items={tasks} onTrack={handleTrackVehicle} />
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{t("新增派車")}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {t("可登錄一般排班或固定頻率派車，固定派車會一次產生多筆明細。")}
          </p>
          <DispatchForm
            error={error}
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
          />
        </aside>
      </section>
    </main>
  );
}

function exportDispatchExcel(tasks: DispatchTask[]) {
  const headers = [
    "任務編號",
    "登錄類型",
    "派車日期",
    "訂單編號",
    "派車時間",
    "出廠時間",
    "指定到達時間",
    "客戶/路線",
    "氣體種類",
    "車輛",
    "司機",
    "固定頻率",
    "狀態",
  ];
  const rows = tasks.map((task) => [
    task.id,
    task.scheduleType,
    task.serviceDate,
    task.orderNumber || "未填",
    task.dispatchTime,
    task.departureTime,
    task.arrivalTime,
    task.customer,
    task.gasType,
    task.vehicle,
    task.driver,
    task.scheduleType === "固定派車" ? task.frequency : "",
    task.status,
  ]);
  const tableRows = [headers, ...rows]
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`,
    )
    .join("");
  const workbook = `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table>${tableRows}</table>
      </body>
    </html>
  `;
  const blob = new Blob([workbook], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dispatch-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildDispatchTasks(form: DispatchFormState, currentTaskCount: number) {
  const amount = form.scheduleType === "固定派車" ? form.generateCount : 1;
  const safeAmount = Math.max(1, Math.min(amount, 31));
  const stepDays = getFrequencyStepDays(form.frequency);

  return Array.from({ length: safeAmount }, (_, index): DispatchTask => {
    const idPrefix = form.scheduleType === "固定派車" ? "FIX" : "DSP";
    const serviceDate =
      form.scheduleType === "固定派車"
        ? addDays(form.serviceDate, index * stepDays)
        : form.serviceDate;

    return {
      ...form,
      id: `${idPrefix}-${String(currentTaskCount + index + 1).padStart(3, "0")}`,
      serviceDate,
      orderNumber:
        form.scheduleType === "固定派車" && form.orderNumber
          ? `${form.orderNumber}-${String(index + 1).padStart(2, "0")}`
          : form.orderNumber,
      generateCount: 1,
      status: "待派車",
    };
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type DispatchListProps = {
  items: DispatchTask[];
  onTrack: (vehicle: string) => void;
};

function DispatchList({ items, onTrack }: DispatchListProps) {
  const { t } = useLanguage();

  return (
    <div className="divide-y divide-slate-200">
      {items.map((task) => (
        <article
          className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto] md:items-center"
          key={task.id}
        >
          <TimeBlock item={task} />
          <DispatchDetails item={task} />
          <div className="flex flex-wrap gap-2 md:justify-end">
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${typeStyles[task.scheduleType]}`}
            >
              {t(task.scheduleType)}
            </span>
            {task.scheduleType === "固定派車" ? (
              <span className="w-fit rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {t(task.frequency)}
              </span>
            ) : null}
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusStyles[task.status]}`}
            >
              {t(task.status)}
            </span>
            <button
              className="h-8 rounded-md border border-cyan-700 bg-white px-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
              onClick={() => onTrack(task.vehicle)}
              type="button"
            >
              {t("追蹤定位")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

type VehicleLocationPanelProps = {
  location: VehicleLocation;
};

function VehicleLocationPanel({ location }: VehicleLocationPanelProps) {
  const { t } = useLanguage();
  const mapQuery = `${location.latitude},${location.longitude}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery,
  )}&z=15&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapQuery,
  )}`;

  return (
    <section className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_320px]">
      <div>
        <p className="text-sm font-medium text-cyan-700">{t("車輛即時定位")}</p>
        <h3 className="mt-1 text-lg font-semibold">{t(location.vehicle)}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {location.area} / {location.address}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          座標：{location.latitude}, {location.longitude} / 更新：{location.updatedAt}
        </p>
        <a
          className="mt-4 inline-flex h-9 items-center rounded-md border border-cyan-700 px-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
          href={mapsUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t("在 Google Maps 開啟")}
        </a>
      </div>
      <iframe
        className="h-56 w-full rounded-lg border border-slate-200 bg-white"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        title={`${location.vehicle} Google Maps 位置`}
      />
    </section>
  );
}

type TimeBlockProps = {
  item: Pick<
    DispatchFormState,
    "serviceDate" | "dispatchTime" | "departureTime" | "arrivalTime"
  > & {
    id: string;
  };
};

function TimeBlock({ item }: TimeBlockProps) {
  const { t } = useLanguage();

  return (
    <div>
      <p className="text-sm text-slate-500">{item.id}</p>
      <p className="mt-1 text-sm font-medium text-cyan-700">{item.serviceDate}</p>
      <p className="mt-1 text-2xl font-semibold">{item.dispatchTime}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {t("出廠")} {item.departureTime}
        <br />
        {t("到達")} {item.arrivalTime}
      </p>
    </div>
  );
}

type DispatchDetailsProps = {
  item: Pick<
    DispatchFormState,
    "orderNumber" | "customer" | "gasType" | "vehicle" | "driver"
  >;
};

function DispatchDetails({ item }: DispatchDetailsProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className="font-semibold">{t(item.customer)}</h3>
      <p className="mt-2 text-sm text-slate-500">
        {t("訂單編號")}：{item.orderNumber || t("未填")}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t(item.gasType)} / {t(item.vehicle)} / {t(item.driver)}
      </p>
    </div>
  );
}

type PanelHeaderProps = {
  title: string;
  description: string;
};

function PanelHeader({ title, description }: PanelHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-lg font-semibold">{t(title)}</h2>
      <p className="mt-1 text-sm text-slate-600">{t(description)}</p>
    </div>
  );
}

type DispatchFormProps = {
  error: string;
  form: DispatchFormState;
  onChange: (nextForm: DispatchFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function DispatchForm({ error, form, onChange, onSubmit }: DispatchFormProps) {
  const { t } = useLanguage();

  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("登錄類型")}
        <select
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.scheduleType}
          onChange={(event) =>
            onChange({
              ...form,
              scheduleType: event.target.value as ScheduleType,
            })
          }
        >
          {scheduleTypeOptions.map((scheduleType) => (
            <option key={scheduleType} value={scheduleType}>
              {t(scheduleType)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("派車日期")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          type="date"
          value={form.serviceDate}
          onChange={(event) =>
            onChange({ ...form, serviceDate: event.target.value })
          }
        />
      </label>

      <TimeInput
        label="派車時間"
        onChange={(value) => onChange({ ...form, dispatchTime: value })}
        value={form.dispatchTime}
      />
      <TimeInput
        label="出廠時間"
        onChange={(value) => onChange({ ...form, departureTime: value })}
        value={form.departureTime}
      />
      <TimeInput
        label="指定到達時間"
        onChange={(value) => onChange({ ...form, arrivalTime: value })}
        value={form.arrivalTime}
      />

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("訂單編號")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.orderNumber}
          onChange={(event) =>
            onChange({ ...form, orderNumber: event.target.value })
          }
          placeholder="SO-20260624-001"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("客戶 / 路線")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.customer}
          onChange={(event) =>
            onChange({ ...form, customer: event.target.value })
          }
          placeholder="例如 台南半導體 D 廠"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("氣體種類")}
        <select
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.gasType}
          onChange={(event) =>
            onChange({ ...form, gasType: event.target.value as GasType })
          }
        >
          {gasOptions.map((gasType) => (
            <option key={gasType} value={gasType}>
              {t(gasType)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("車輛")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.vehicle}
          onChange={(event) => onChange({ ...form, vehicle: event.target.value })}
          placeholder="例如 車輛 D-088"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("司機")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.driver}
          onChange={(event) => onChange({ ...form, driver: event.target.value })}
          placeholder="例如 張司機"
        />
      </label>

      {form.scheduleType === "固定派車" ? (
        <>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("固定頻率")}
            <select
              className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              value={form.frequency}
              onChange={(event) =>
                onChange({
                  ...form,
                  frequency: event.target.value as FixedFrequency,
                })
              }
            >
              {frequencyOptions.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {t(frequency)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {t("產生明細筆數")}
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
              max={31}
              min={1}
              type="number"
              value={form.generateCount}
              onChange={(event) =>
                onChange({
                  ...form,
                  generateCount: Number(event.target.value),
                })
              }
            />
          </label>
        </>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200"
        type="submit"
      >
        {form.scheduleType === "固定派車" ? t("產生固定派車明細") : t("新增派車")}
      </button>
    </form>
  );
}

type TimeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimeInput({ label, value, onChange }: TimeInputProps) {
  const { t } = useLanguage();

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {t(label)}
      <input
        className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}

type GasLimitCardProps = {
  gasType: GasType;
  used: number;
  limit: number;
};

function GasLimitCard({ gasType, used, limit }: GasLimitCardProps) {
  const { t } = useLanguage();
  const isFull = used >= limit;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{t(gasType)}</p>
      <p className="mt-2 text-2xl font-semibold">
        {used} / {limit} {t("趟")}
      </p>
      <p className={`mt-2 text-sm ${isFull ? "text-red-600" : "text-slate-500"}`}>
        {isFull ? t("已達今日上限") : t("今日可新增")}
      </p>
    </article>
  );
}
