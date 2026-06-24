import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type DispatchStatus = "待派車" | "配送中" | "已完成";
type GasType = "氮氣 N2" | "氧氣 O2" | "氬氣 Ar" | "二氧化碳 CO2";
type FixedFrequency = "日" | "每二日" | "週";
type ScheduleType = "一般排班" | "固定派車";

type DispatchFormState = {
  scheduleType: ScheduleType;
  orderNumber: string;
  dispatchTime: string;
  departureTime: string;
  arrivalTime: string;
  customer: string;
  gasType: GasType;
  vehicle: string;
  driver: string;
  frequency: FixedFrequency;
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

const vehicleLocations: Record<string, VehicleLocation> = {
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
    orderNumber: "SO-20260624-001",
    dispatchTime: "08:30",
    departureTime: "09:00",
    arrivalTime: "10:15",
    customer: "新竹科學園區 A 廠",
    gasType: "氮氣 N2",
    vehicle: "車輛 A-102",
    driver: "王司機",
    frequency: "日",
    status: "配送中",
  },
  {
    id: "FIX-001",
    scheduleType: "固定派車",
    orderNumber: "SO-FIX-N2-001",
    dispatchTime: "08:00",
    departureTime: "08:30",
    arrivalTime: "09:45",
    customer: "固定路線：新竹園區每日補氣",
    gasType: "氮氣 N2",
    vehicle: "車輛 A-102",
    driver: "王司機",
    frequency: "日",
    status: "待派車",
  },
  {
    id: "DSP-002",
    scheduleType: "一般排班",
    orderNumber: "SO-20260624-002",
    dispatchTime: "11:00",
    departureTime: "11:30",
    arrivalTime: "13:00",
    customer: "台中精密製造 B 廠",
    gasType: "氧氣 O2",
    vehicle: "車輛 B-216",
    driver: "陳司機",
    frequency: "日",
    status: "待派車",
  },
  {
    id: "DSP-003",
    scheduleType: "一般排班",
    orderNumber: "SO-20260624-003",
    dispatchTime: "13:30",
    departureTime: "14:00",
    arrivalTime: "15:10",
    customer: "桃園電子材料 C 廠",
    gasType: "氬氣 Ar",
    vehicle: "車輛 C-031",
    driver: "林司機",
    frequency: "日",
    status: "已完成",
  },
];

const initialFormState: DispatchFormState = {
  scheduleType: "一般排班",
  orderNumber: "",
  dispatchTime: "",
  departureTime: "",
  arrivalTime: "",
  customer: "",
  gasType: "氮氣 N2",
  vehicle: "",
  driver: "",
  frequency: "日",
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
  const [tasks, setTasks] = useState<DispatchTask[]>(initialTasks);
  const [form, setForm] = useState<DispatchFormState>(initialFormState);
  const [error, setError] = useState("");
  const [trackedVehicle, setTrackedVehicle] = useState("車輛 A-102");

  const summary = useMemo(
    () => ({
      total: tasks.length,
      fixed: tasks.filter((task) => task.scheduleType === "固定派車").length,
      pending: tasks.filter((task) => task.status === "待派車").length,
      active: tasks.filter((task) => task.status === "配送中").length,
    }),
    [tasks],
  );

  const gasUsage = useMemo(
    () =>
      gasOptions.map((gasType) => ({
        gasType,
        limit: gasTripLimits[gasType],
        used: tasks.filter((task) => task.gasType === gasType).length,
      })),
    [tasks],
  );

  const trackedLocation = vehicleLocations[trackedVehicle];

  const getGasLimitError = (gasType: GasType) => {
    const usedTrips = tasks.filter((task) => task.gasType === gasType).length;
    const maxTrips = gasTripLimits[gasType];

    if (usedTrips >= maxTrips) {
      return `${gasType} 今日已達 ${maxTrips} 趟上限，請調整氣體種類或改到其他日期。`;
    }

    return "";
  };

  const isDispatchFormIncomplete = (data: DispatchFormState) =>
    !data.dispatchTime.trim() ||
    !data.departureTime.trim() ||
    !data.arrivalTime.trim() ||
    !data.customer.trim() ||
    !data.vehicle.trim() ||
    !data.driver.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isDispatchFormIncomplete(form)) {
      setError("請完整填寫派車時間、出廠時間、指定到達時間、客戶、車輛與司機。");
      return;
    }

    const limitError = getGasLimitError(form.gasType);
    if (limitError) {
      setError(limitError);
      return;
    }

    const idPrefix = form.scheduleType === "固定派車" ? "FIX" : "DSP";
    const nextTask: DispatchTask = {
      id: `${idPrefix}-${String(tasks.length + 1).padStart(3, "0")}`,
      ...form,
      status: "待派車",
    };

    setTasks((current) => [nextTask, ...current]);
    setForm(initialFormState);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-cyan-700">
              Chemical Gas Dispatch System
            </p>
            <h1 className="text-xl font-semibold">管理員儀表板</h1>
          </div>
          <Link
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            to="/login"
          >
            登出
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="今日派車" value={summary.total} />
        <SummaryCard label="固定派車" value={summary.fixed} />
        <SummaryCard label="待派車" value={summary.pending} />
        <SummaryCard label="配送中" value={summary.active} />
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
            description="一般排班與每日固定派車會顯示在同一份每日派車列表中。"
            title="每日派車列表"
          />
          {trackedLocation ? <VehicleLocationPanel location={trackedLocation} /> : null}
          <DispatchList items={tasks} onTrack={setTrackedVehicle} />
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">新增派車</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            可登錄一般排班或每日固定派車，固定派車需設定客戶固定頻率。
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

type DispatchListProps = {
  items: DispatchTask[];
  onTrack: (vehicle: string) => void;
};

function DispatchList({ items, onTrack }: DispatchListProps) {
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
              {task.scheduleType}
            </span>
            {task.scheduleType === "固定派車" ? (
              <span className="w-fit rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {task.frequency}
              </span>
            ) : null}
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${statusStyles[task.status]}`}
            >
              {task.status}
            </span>
            <button
              className="h-8 rounded-md border border-cyan-700 bg-white px-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
              onClick={() => onTrack(task.vehicle)}
              type="button"
            >
              追蹤定位
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
        <p className="text-sm font-medium text-cyan-700">車輛即時定位</p>
        <h3 className="mt-1 text-lg font-semibold">{location.vehicle}</h3>
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
          在 Google Maps 開啟
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
  item: Pick<DispatchFormState, "dispatchTime" | "departureTime" | "arrivalTime"> & {
    id: string;
  };
};

function TimeBlock({ item }: TimeBlockProps) {
  return (
    <div>
      <p className="text-sm text-slate-500">{item.id}</p>
      <p className="mt-1 text-2xl font-semibold">{item.dispatchTime}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        出廠 {item.departureTime}
        <br />
        到達 {item.arrivalTime}
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
  return (
    <div>
      <h3 className="font-semibold">{item.customer}</h3>
      <p className="mt-2 text-sm text-slate-500">
        訂單編號：{item.orderNumber || "未填"}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {item.gasType} / {item.vehicle} / {item.driver}
      </p>
    </div>
  );
}

type PanelHeaderProps = {
  title: string;
  description: string;
};

function PanelHeader({ title, description }: PanelHeaderProps) {
  return (
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
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
  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        登錄類型
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
            <option key={scheduleType}>{scheduleType}</option>
          ))}
        </select>
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
        訂單編號
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.orderNumber}
          onChange={(event) =>
            onChange({ ...form, orderNumber: event.target.value })
          }
          placeholder="例如 SO-20260624-001"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        客戶 / 路線
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
        氣體種類
        <select
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.gasType}
          onChange={(event) =>
            onChange({ ...form, gasType: event.target.value as GasType })
          }
        >
          {gasOptions.map((gasType) => (
            <option key={gasType}>{gasType}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        車輛
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.vehicle}
          onChange={(event) => onChange({ ...form, vehicle: event.target.value })}
          placeholder="例如 車輛 D-088"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        司機
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.driver}
          onChange={(event) => onChange({ ...form, driver: event.target.value })}
          placeholder="例如 張司機"
        />
      </label>

      {form.scheduleType === "固定派車" ? (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          固定頻率
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
              <option key={frequency}>{frequency}</option>
            ))}
          </select>
        </label>
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
        新增派車
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
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
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
  const isFull = used >= limit;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{gasType}</p>
      <p className="mt-2 text-2xl font-semibold">
        {used} / {limit} 趟
      </p>
      <p className={`mt-2 text-sm ${isFull ? "text-red-600" : "text-slate-500"}`}>
        {isFull ? "已達今日上限" : "今日可新增"}
      </p>
    </article>
  );
}
