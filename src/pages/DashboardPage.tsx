import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageToggle, useLanguage } from "../i18n/LanguageContext";
import {
  importedDispatchTasks,
  importedDrivers,
  importedMaterialPrices,
  importedTankers,
} from "../data/importedData";

type DispatchStatus = "待派車" | "配送中" | "已完成";
type GasType = "氮氣 N2" | "氧氣 O2" | "氬氣 Ar" | "二氧化碳 CO2";
type FixedFrequency = "日" | "每二日" | "週";
type ScheduleType = "一般排班" | "固定派車";
type WorkTab = "派車表" | "客戶訂單總表" | "氣體明細表" | "gas物料價格表";
type TableFilterState = {
  field: string;
  keyword: string;
};
type SearchFieldOption<T> = {
  value: string;
  label: string;
  getValue: (item: T) => string | number | null | undefined;
};
type MaterialPriceWithOrder = (typeof importedMaterialPrices)[number] & {
  matchedOrder?: DispatchTask;
};

type DispatchFormState = {
  scheduleType: ScheduleType;
  serviceDate: string;
  orderNumber: string;
  dispatchTime: string;
  departureTime: string;
  arrivalTime: string;
  customer: string;
  gasType: GasType;
  tankerNo: string;
  vehicle: string;
  driver: string;
  remark: string;
  frequency: FixedFrequency;
  generateCount: number;
};

type DispatchTask = DispatchFormState & {
  id: string;
  status: DispatchStatus;
  sourceMaterial?: string;
  customerCode?: string;
  shipTo?: string;
  destination?: string;
  quantity?: number | null;
  deliveryWindow?: string;
  assignedTankerType?: string;
  tankerNo?: string;
  tankerPressureType?: string;
  remark?: string;
  contractPrice?: number | null;
  shipmentQty?: number | null;
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
const workTabs: WorkTab[] = ["派車表", "客戶訂單總表", "氣體明細表", "gas物料價格表"];
const authStorageKey = "chemical-gas-dispatch-auth";
const authRoleStorageKey = "chemical-gas-dispatch-role";
const authExpiresAtStorageKey = "chemical-gas-dispatch-auth-expires-at";
const loginSessionMinutes = 30;

const clearAuthSession = () => {
  window.localStorage.removeItem(authStorageKey);
  window.localStorage.removeItem(authRoleStorageKey);
  window.localStorage.removeItem(authExpiresAtStorageKey);
};

const defaultTableFilters: Record<WorkTab, TableFilterState> = {
  派車表: { field: "orderNumber", keyword: "" },
  客戶訂單總表: { field: "orderNumber", keyword: "" },
  氣體明細表: { field: "tankNo", keyword: "" },
  gas物料價格表: { field: "customerName", keyword: "" },
};

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

const getPressureLabel = (pressureType: string) => {
  if (pressureType.includes("低壓")) {
    return "低壓車";
  }

  if (pressureType.includes("高壓")) {
    return "高壓車";
  }

  return pressureType || "未標示壓力";
};

const getTankerByNo = (tankNo: string) =>
  importedTankers.find((tanker) => tanker.tankNo === tankNo);

const getTankerVehicleLabel = (tankNo: string) => {
  const tanker = getTankerByNo(tankNo);

  if (!tanker) {
    return "";
  }

  return `${tanker.tankNo}（${getPressureLabel(tanker.pressureType)}） / ${tanker.plateNumber}`;
};

const normalizeGasType = (value: string): GasType => {
  const upperValue = value.toUpperCase();

  if (upperValue.includes("O2") || upperValue.includes("氧")) {
    return "氧氣 O2";
  }

  if (upperValue.includes("AR") || upperValue.includes("氬")) {
    return "氬氣 Ar";
  }

  if (upperValue.includes("CO2") || upperValue.includes("二氧化碳")) {
    return "二氧化碳 CO2";
  }

  return "氮氣 N2";
};

const formatOrderNumber = (orderNumber: string) => {
  const digits = orderNumber.replace(/\D/g, "");
  return digits ? digits.slice(-5) : orderNumber.replace(/^SO-/i, "").slice(-5);
};

const includesKeyword = (value: string | number | null | undefined, keyword: string) =>
  String(value ?? "").toLowerCase().includes(keyword.trim().toLowerCase());

const filterItems = <T,>(
  items: T[],
  options: SearchFieldOption<T>[],
  filter: TableFilterState,
) => {
  const keyword = filter.keyword.trim();

  if (!keyword) {
    return items;
  }

  const option = options.find((item) => item.value === filter.field) || options[0];
  return items.filter((item) => includesKeyword(option.getValue(item), keyword));
};

const hydrateImportedTask = (task: (typeof importedDispatchTasks)[number]): DispatchTask => {
  const matchedTanker =
    importedTankers.find((tanker) => (task.assignedTankerType || "").includes(tanker.tankNo)) ||
    importedTankers.find((tanker) => task.vehicle.includes(tanker.tankNo));

  return {
    ...task,
    tankerNo: matchedTanker?.tankNo || "",
    tankerPressureType: matchedTanker ? getPressureLabel(matchedTanker.pressureType) : "",
    vehicle: matchedTanker ? getTankerVehicleLabel(matchedTanker.tankNo) : task.vehicle,
    remark: "",
  };
};

const initialTasks: DispatchTask[] = importedDispatchTasks.map(hydrateImportedTask);

const initialVehicleLocations: Record<string, VehicleLocation> =
  importedTankers.slice(0, 12).reduce<Record<string, VehicleLocation>>((locations, tanker, index) => {
    const vehicle = getTankerVehicleLabel(tanker.tankNo);
    locations[vehicle] = {
      vehicle,
      area: tanker.material || "槽車資料",
      address: `${tanker.pressureType || "未標示壓力"} / ${tanker.capacityTon ?? "未填"} 噸`,
      latitude: Number((24.1477 + index * 0.018).toFixed(6)),
      longitude: Number((120.6736 + index * 0.014).toFixed(6)),
      updatedAt: "匯入資料",
    };
    return locations;
  }, {});

const initialFormState: DispatchFormState = {
  scheduleType: "一般排班",
  serviceDate: getTodayDate(),
  orderNumber: "",
  dispatchTime: "",
  departureTime: "",
  arrivalTime: "",
  customer: "",
  gasType: "氮氣 N2",
  tankerNo: "",
  vehicle: "",
  driver: "",
  remark: "",
  frequency: "日",
  generateCount: 7,
};

const dispatchSearchOptions: SearchFieldOption<DispatchTask>[] = [
  { value: "orderNumber", label: "訂單編號", getValue: (item) => formatOrderNumber(item.orderNumber) },
  { value: "serviceDate", label: "派車日期", getValue: (item) => item.serviceDate },
  { value: "customer", label: "客戶/路線", getValue: (item) => item.customer },
  { value: "gasType", label: "氣體種類", getValue: (item) => item.gasType },
  { value: "tankerNo", label: "槽車編號", getValue: (item) => item.tankerNo },
  { value: "vehicle", label: "車輛", getValue: (item) => item.vehicle },
  { value: "driver", label: "司機", getValue: (item) => item.driver },
  { value: "remark", label: "備註", getValue: (item) => item.remark },
];

const customerOrderSearchOptions: SearchFieldOption<DispatchTask>[] = [
  { value: "orderNumber", label: "訂單編號", getValue: (item) => formatOrderNumber(item.orderNumber) },
  { value: "serviceDate", label: "派車日期", getValue: (item) => item.serviceDate },
  { value: "customer", label: "客戶/路線", getValue: (item) => item.customer },
  { value: "customerCode", label: "客戶代碼", getValue: (item) => item.customerCode },
  { value: "sourceMaterial", label: "物料", getValue: (item) => item.sourceMaterial },
  { value: "destination", label: "目的地", getValue: (item) => item.destination },
  { value: "assignedTankerType", label: "指定槽車", getValue: (item) => item.assignedTankerType },
];

const tankerSearchOptions: SearchFieldOption<(typeof importedTankers)[number]>[] = [
  { value: "tankNo", label: "槽車編號", getValue: (item) => item.tankNo },
  { value: "plateNumber", label: "車牌", getValue: (item) => item.plateNumber },
  { value: "material", label: "氣體種類", getValue: (item) => item.material },
  { value: "pressureType", label: "槽車壓力", getValue: (item) => getPressureLabel(item.pressureType) },
  { value: "manufacturer", label: "製造商", getValue: (item) => item.manufacturer },
  { value: "remark", label: "備註", getValue: (item) => item.remark },
];

const materialSearchOptions: SearchFieldOption<MaterialPriceWithOrder>[] = [
  { value: "customerCode", label: "客戶代碼", getValue: (item) => item.customerCode },
  { value: "customerName", label: "客戶", getValue: (item) => item.customerName },
  { value: "material", label: "物料", getValue: (item) => item.material },
  { value: "gasType", label: "氣體種類", getValue: (item) => item.gasType },
  { value: "deliveryLocation", label: "目的地", getValue: (item) => item.deliveryLocation },
  { value: "orderNumber", label: "訂單編號", getValue: (item) => formatOrderNumber(item.orderNumber) },
  { value: "orderServiceDate", label: "訂單派車日期", getValue: (item) => item.matchedOrder?.serviceDate },
  { value: "orderCustomer", label: "訂單客戶", getValue: (item) => item.matchedOrder?.customer },
  { value: "orderTanker", label: "訂單指定槽車", getValue: (item) => item.matchedOrder?.assignedTankerType || item.matchedOrder?.tankerNo },
  { value: "matchStatus", label: "比對狀態", getValue: (item) => (item.matchedOrder ? "已對應" : "未對應") },
];

const getSearchOptionsForTab = (tab: WorkTab) => {
  if (tab === "客戶訂單總表") {
    return customerOrderSearchOptions;
  }

  if (tab === "氣體明細表") {
    return tankerSearchOptions;
  }

  if (tab === "gas物料價格表") {
    return materialSearchOptions;
  }

  return dispatchSearchOptions;
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
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [currentRole] = useState(() => window.localStorage.getItem(authRoleStorageKey) || "調度員");
  const [tasks, setTasks] = useState<DispatchTask[]>(initialTasks);
  const [form, setForm] = useState<DispatchFormState>(initialFormState);
  const [error, setError] = useState("");
  const [trackedVehicle, setTrackedVehicle] = useState(
    importedTankers[0] ? getTankerVehicleLabel(importedTankers[0].tankNo) : "",
  );
  const [vehicleLocations, setVehicleLocations] =
    useState<Record<string, VehicleLocation>>(initialVehicleLocations);
  const [activeTab, setActiveTab] = useState<WorkTab>("派車表");
  const [isDataLinked, setIsDataLinked] = useState(true);
  const [tableFilters, setTableFilters] =
    useState<Record<WorkTab, TableFilterState>>(defaultTableFilters);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const expiresAt = Number(window.localStorage.getItem(authExpiresAtStorageKey) || "0");

      if (!expiresAt || expiresAt <= Date.now()) {
        clearAuthSession();
        navigate("/login", { replace: true });
      }
    }, 30000);

    return () => window.clearInterval(timerId);
  }, [navigate]);

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
  const mergedMaterialPrices = useMemo<MaterialPriceWithOrder[]>(
    () =>
      importedMaterialPrices.map((material) => ({
        ...material,
        matchedOrder: initialTasks.find(
          (task) =>
            task.orderNumber &&
            formatOrderNumber(task.orderNumber) === formatOrderNumber(material.orderNumber),
        ),
      })),
    [],
  );

  const filteredTasks = useMemo(
    () => filterItems(tasks, dispatchSearchOptions, tableFilters["派車表"]),
    [tableFilters, tasks],
  );

  const filteredCustomerOrders = useMemo(
    () => filterItems(initialTasks, customerOrderSearchOptions, tableFilters["客戶訂單總表"]),
    [tableFilters],
  );

  const filteredTankers = useMemo(
    () => filterItems(importedTankers, tankerSearchOptions, tableFilters["氣體明細表"]),
    [tableFilters],
  );

  const filteredMaterialPrices = useMemo(
    () => filterItems(mergedMaterialPrices, materialSearchOptions, tableFilters["gas物料價格表"]),
    [mergedMaterialPrices, tableFilters],
  );

  const updateTableFilter = (tab: WorkTab, nextFilter: TableFilterState) => {
    setTableFilters((current) => ({
      ...current,
      [tab]: nextFilter,
    }));
  };

  const activeSearchOptions = getSearchOptionsForTab(activeTab);

  const updateTankerSelection = (tankNo: string) => {
    const vehicle = getTankerVehicleLabel(tankNo);
    setForm((current) => ({
      ...current,
      tankerNo: tankNo,
      vehicle,
    }));
  };

  const handleSelectOrder = (task: DispatchTask) => {
    if (!isDataLinked) {
      return;
    }

    setForm((current) => ({
      ...current,
      orderNumber: formatOrderNumber(task.orderNumber),
      customer: task.customer,
      gasType: task.gasType,
      dispatchTime: task.dispatchTime,
      departureTime: task.departureTime,
      arrivalTime: task.arrivalTime,
      tankerNo: task.tankerNo || current.tankerNo,
      vehicle: task.tankerNo ? getTankerVehicleLabel(task.tankerNo) : current.vehicle,
    }));
    setActiveTab("派車表");
  };

  const handleSelectTanker = (tankNo: string) => {
    if (!isDataLinked) {
      return;
    }

    updateTankerSelection(tankNo);
    setActiveTab("派車表");
  };

  const handleSelectMaterial = (material: (typeof importedMaterialPrices)[number]) => {
    if (!isDataLinked) {
      return;
    }

    setForm((current) => ({
      ...current,
      orderNumber: material.orderNumber ? formatOrderNumber(material.orderNumber) : current.orderNumber,
      customer: material.customerName || current.customer,
      gasType: normalizeGasType(material.gasType || material.material),
    }));
    setActiveTab("派車表");
  };

  const handleRemarkChange = (taskId: string, remark: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, remark } : task)),
    );
  };

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
            updatedAt: new Date().toLocaleTimeString(language === "en" ? "en-US" : "zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        };
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [language, trackedVehicle]);

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
    !data.tankerNo.trim() ||
    !data.vehicle.trim() ||
    !data.driver.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isDispatchFormIncomplete(form)) {
      setError(t("請完整填寫日期、派車時間、出廠時間、指定到達時間、客戶、槽車編號與司機。"));
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

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
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
            <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 sm:inline-flex">
              {t("目前角色")}：{t(currentRole)}
            </span>
            <span className="hidden rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 lg:inline-flex">
              {t("登入有效期限")}：{loginSessionMinutes} {t("分鐘")}
            </span>
            <LanguageToggle />
            <button
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={handleLogout}
              type="button"
            >
              {t("登出")}
            </button>
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

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("匯入客戶訂單")} value={importedDispatchTasks.length} />
        <SummaryCard label={t("匯入司機")} value={importedDrivers.length} />
        <SummaryCard label={t("匯入槽車")} value={importedTankers.length} />
        <SummaryCard label={t("匯入物料價格")} value={importedMaterialPrices.length} />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex flex-wrap gap-2">
              {workTabs.map((tab) => (
                <button
                  className={`h-10 rounded-md px-3 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "bg-cyan-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {t(tab)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={isDataLinked}
                className="h-4 w-4 accent-cyan-700"
                onChange={(event) => setIsDataLinked(event.target.checked)}
                type="checkbox"
              />
              {t("資料連動")}
            </label>
          </div>
          <SearchToolbar
            filter={tableFilters[activeTab]}
            onChange={(nextFilter) => updateTableFilter(activeTab, nextFilter)}
            options={activeSearchOptions}
          />

          {activeTab === "派車表" ? (
            <section className="grid gap-5 p-5 lg:grid-cols-[1fr_360px]">
              <div className="rounded-lg border border-slate-200 bg-white">
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
                    onClick={() => exportDispatchExcel(tasks, t)}
                    type="button"
                  >
                    {t("匯出 Excel")}
                  </button>
                </div>
                {trackedLocation ? <VehicleLocationPanel location={trackedLocation} /> : null}
                <DispatchList
                  items={filteredTasks}
                  onRemarkChange={handleRemarkChange}
                  onTrack={handleTrackVehicle}
                />
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
                  onTankerChange={updateTankerSelection}
                />
              </aside>
            </section>
          ) : null}

          {activeTab === "客戶訂單總表" ? (
            <CustomerOrderTable
              isDataLinked={isDataLinked}
              items={filteredCustomerOrders}
              onSelect={handleSelectOrder}
            />
          ) : null}

          {activeTab === "氣體明細表" ? (
            <TankerTable
              isDataLinked={isDataLinked}
              items={filteredTankers}
              onSelect={handleSelectTanker}
            />
          ) : null}

          {activeTab === "gas物料價格表" ? (
            <MaterialPriceTable
              isDataLinked={isDataLinked}
              items={filteredMaterialPrices}
              onSelect={handleSelectMaterial}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function exportDispatchExcel(tasks: DispatchTask[], t: (text: string) => string) {
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
    "槽車編號",
    "槽車壓力",
    "車輛",
    "司機",
    "客戶代碼",
    "物料",
    "數量",
    "目的地",
    "合約價格",
    "每次出貨量",
    "備註",
    "固定頻率",
    "狀態",
  ];
  const rows = tasks.map((task) => [
    task.id,
    t(task.scheduleType),
    task.serviceDate,
    task.orderNumber || t("未填"),
    task.dispatchTime,
    task.departureTime,
    task.arrivalTime,
    t(task.customer),
    t(task.gasType),
    task.tankerNo || "",
    task.tankerPressureType || "",
    t(task.vehicle),
    t(task.driver),
    task.customerCode || "",
    task.sourceMaterial || "",
    task.quantity ?? "",
    task.destination || "",
    task.contractPrice ?? "",
    task.shipmentQty ?? "",
    task.remark || "",
    task.scheduleType === "固定派車" ? t(task.frequency) : "",
    t(task.status),
  ]);
  const tableRows = [headers.map(t), ...rows]
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
      tankerPressureType: getPressureLabel(getTankerByNo(form.tankerNo)?.pressureType || ""),
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
  onRemarkChange: (taskId: string, remark: string) => void;
};

function DispatchList({ items, onRemarkChange, onTrack }: DispatchListProps) {
  const { t } = useLanguage();

  return (
    <div className="divide-y divide-slate-200">
      {items.map((task) => (
        <article
          className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto] md:items-center"
          key={task.id}
        >
          <TimeBlock item={task} />
          <DispatchDetails item={task} onRemarkChange={(remark) => onRemarkChange(task.id, remark)} />
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

type CustomerOrderTableProps = {
  items: DispatchTask[];
  isDataLinked: boolean;
  onSelect: (task: DispatchTask) => void;
};

function CustomerOrderTable({
  isDataLinked,
  items,
  onSelect,
}: CustomerOrderTableProps) {
  const { t } = useLanguage();

  return (
    <DataTableShell
      description="顯示匯入的客戶訂單資料，開啟資料連動後可帶入派車表。"
      title="客戶訂單總表"
    >
      <table className="min-w-[980px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {["訂單編號", "派車日期", "客戶/路線", "氣體種類", "數量", "目的地", "收貨時間", "指定槽車", "操作"].map(
              (header) => (
                <th className="px-3 py-3 font-semibold" key={header}>
                  {t(header)}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item) => (
            <tr className="align-top" key={item.id}>
              <td className="px-3 py-3">
                {item.orderNumber ? formatOrderNumber(item.orderNumber) : t("未填")}
              </td>
              <td className="px-3 py-3">{item.serviceDate}</td>
              <td className="px-3 py-3">{item.customer}</td>
              <td className="px-3 py-3">{t(item.gasType)}</td>
              <td className="px-3 py-3">{item.quantity ?? ""}</td>
              <td className="px-3 py-3">{item.destination}</td>
              <td className="px-3 py-3">{item.deliveryWindow}</td>
              <td className="px-3 py-3">{item.assignedTankerType || item.tankerNo}</td>
              <td className="px-3 py-3">
                <button
                  className="h-8 rounded-md border border-cyan-700 px-3 text-sm font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  disabled={!isDataLinked}
                  onClick={() => onSelect(item)}
                  type="button"
                >
                  {t("帶入派車")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}

type TankerTableProps = {
  items: typeof importedTankers;
  isDataLinked: boolean;
  onSelect: (tankNo: string) => void;
};

function TankerTable({ isDataLinked, items, onSelect }: TankerTableProps) {
  const { t } = useLanguage();

  return (
    <DataTableShell
      description="槽車編號可與派車表串聯，選取後會同步高壓車或低壓車標示。"
      title="氣體明細表"
    >
      <table className="min-w-[860px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {["槽車編號", "車牌", "氣體種類", "槽車壓力", "容量噸", "容積", "製造商", "備註", "操作"].map(
              (header) => (
                <th className="px-3 py-3 font-semibold" key={header}>
                  {t(header)}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item) => (
            <tr className="align-top" key={item.tankNo}>
              <td className="px-3 py-3 font-semibold">{item.tankNo}</td>
              <td className="px-3 py-3">{item.plateNumber}</td>
              <td className="px-3 py-3">{item.material}</td>
              <td className="px-3 py-3">{t(getPressureLabel(item.pressureType))}</td>
              <td className="px-3 py-3">{item.capacityTon ?? ""}</td>
              <td className="px-3 py-3">{item.volumeM3 ?? ""}</td>
              <td className="px-3 py-3">{item.manufacturer}</td>
              <td className="px-3 py-3">{item.remark}</td>
              <td className="px-3 py-3">
                <button
                  className="h-8 rounded-md border border-cyan-700 px-3 text-sm font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  disabled={!isDataLinked}
                  onClick={() => onSelect(item.tankNo)}
                  type="button"
                >
                  {t("帶入派車")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}

type MaterialPriceTableProps = {
  items: MaterialPriceWithOrder[];
  isDataLinked: boolean;
  onSelect: (material: MaterialPriceWithOrder) => void;
};

function MaterialPriceTable({
  isDataLinked,
  items,
  onSelect,
}: MaterialPriceTableProps) {
  const { t } = useLanguage();

  return (
    <DataTableShell
      description="物料價格資料可帶入客戶、訂單與氣體種類，後續可再串接正式報價資料庫。"
      title="gas物料價格表"
    >
      <table className="min-w-[1480px] w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {[
              "客戶代碼",
              "客戶",
              "物料",
              "氣體種類",
              "目的地",
              "合約價格",
              "付款條件",
              "月用量",
              "每次出貨量",
              "訂單編號",
              "比對狀態",
              "訂單派車日期",
              "訂單派車時間",
              "訂單出廠時間",
              "訂單指定到達時間",
              "訂單客戶",
              "訂單數量",
              "訂單收貨時間",
              "訂單指定槽車",
              "訂單司機",
              "訂單狀態",
              "操作",
            ].map((header) => (
              <th className="px-3 py-3 font-semibold" key={header}>
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {items.map((item, index) => (
            <tr className="align-top" key={`${item.customerCode}-${item.material}-${index}`}>
              <td className="px-3 py-3">{item.customerCode}</td>
              <td className="px-3 py-3">{item.customerName}</td>
              <td className="px-3 py-3">{item.material}</td>
              <td className="px-3 py-3">{item.gasType}</td>
              <td className="px-3 py-3">{item.deliveryLocation}</td>
              <td className="px-3 py-3">{item.contractPrice ?? ""}</td>
              <td className="px-3 py-3">{item.paymentTerm}</td>
              <td className="px-3 py-3">{item.monthlyUsage ?? item.estimatedMonthlyUsage ?? ""}</td>
              <td className="px-3 py-3">{item.shipmentQty ?? ""}</td>
              <td className="px-3 py-3">{formatOrderNumber(item.orderNumber)}</td>
              <td className="px-3 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    item.matchedOrder
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {t(item.matchedOrder ? "已對應" : "未對應")}
                </span>
              </td>
              <td className="px-3 py-3">{item.matchedOrder?.serviceDate || ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.dispatchTime || ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.departureTime || ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.arrivalTime || ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.customer || ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.quantity ?? ""}</td>
              <td className="px-3 py-3">{item.matchedOrder?.deliveryWindow || ""}</td>
              <td className="px-3 py-3">
                {item.matchedOrder?.assignedTankerType || item.matchedOrder?.tankerNo || ""}
              </td>
              <td className="px-3 py-3">{item.matchedOrder?.driver || ""}</td>
              <td className="px-3 py-3">
                {item.matchedOrder?.status ? t(item.matchedOrder.status) : ""}
              </td>
              <td className="px-3 py-3">
                <button
                  className="h-8 rounded-md border border-cyan-700 px-3 text-sm font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  disabled={!isDataLinked}
                  onClick={() => onSelect(item)}
                  type="button"
                >
                  {t("帶入派車")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}

type DataTableShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

type SearchToolbarProps = {
  filter: TableFilterState;
  options: Array<Pick<SearchFieldOption<unknown>, "value" | "label">>;
  onChange: (nextFilter: TableFilterState) => void;
};

function SearchToolbar({ filter, onChange, options }: SearchToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
      <label className="grid gap-1 text-sm font-medium text-slate-700 sm:w-52">
        {t("搜尋欄位")}
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) => onChange({ ...filter, field: event.target.value })}
          value={filter.field}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
        {t("搜尋")}
        <input
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) => onChange({ ...filter, keyword: event.target.value })}
          placeholder={t("輸入關鍵字")}
          value={filter.keyword}
        />
      </label>

      <button
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:self-end"
        onClick={() => onChange({ ...filter, keyword: "" })}
        type="button"
      >
        {t("清除")}
      </button>
    </div>
  );
}

function DataTableShell({ children, description, title }: DataTableShellProps) {
  const { t } = useLanguage();

  return (
    <section>
      <PanelHeader description={description} title={title} />
      <div className="overflow-x-auto">{children}</div>
    </section>
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
          {t(location.area)} / {t(location.address)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {t("座標")}：{location.latitude}, {location.longitude} / {t("更新")}：
          {t(location.updatedAt)}
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
        title={`${t(location.vehicle)} ${t("Google Maps 位置")}`}
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
    DispatchTask,
    | "orderNumber"
    | "customer"
    | "gasType"
    | "vehicle"
    | "driver"
    | "tankerNo"
    | "tankerPressureType"
    | "customerCode"
    | "sourceMaterial"
    | "quantity"
    | "destination"
    | "deliveryWindow"
    | "assignedTankerType"
    | "remark"
    | "contractPrice"
    | "shipmentQty"
  >;
  onRemarkChange: (remark: string) => void;
};

function DispatchDetails({ item, onRemarkChange }: DispatchDetailsProps) {
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
      <div className="mt-3 grid gap-1 text-sm text-slate-500 sm:grid-cols-2">
        <p>
          {t("客戶代碼")}：{item.customerCode || t("未填")}
        </p>
        <p>
          {t("物料")}：{item.sourceMaterial || t("未填")}
        </p>
        <p>
          {t("數量")}：{item.quantity ?? t("未填")}
        </p>
        <p>
          {t("目的地")}：{item.destination || t("未填")}
        </p>
        <p>
          {t("收貨時間")}：{item.deliveryWindow || t("未填")}
        </p>
        <p>
          {t("指定槽車")}：{item.assignedTankerType || t("未填")}
        </p>
        <p>
          {t("槽車編號")}：{item.tankerNo ? `${item.tankerNo} ${item.tankerPressureType || ""}` : t("未填")}
        </p>
        <p>
          {t("合約價格")}：{item.contractPrice ?? t("未填")}
        </p>
        <p>
          {t("每次出貨量")}：{item.shipmentQty ?? t("未填")}
        </p>
      </div>
      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
        {t("備註")}
        <input
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          onChange={(event) => onRemarkChange(event.target.value)}
          placeholder={t("可自由輸入備註")}
          value={item.remark || ""}
        />
      </label>
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
  onTankerChange: (tankNo: string) => void;
};

function DispatchForm({ error, form, onChange, onSubmit, onTankerChange }: DispatchFormProps) {
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
          placeholder={t("例如 台南半導體 D 廠")}
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
        {t("槽車編號")}
        <select
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.tankerNo}
          onChange={(event) => onTankerChange(event.target.value)}
        >
          <option value="">{t("請選擇槽車編號")}</option>
          {importedTankers.map((tanker) => (
            <option key={tanker.tankNo} value={tanker.tankNo}>
              {tanker.tankNo}（{t(getPressureLabel(tanker.pressureType))}） / {tanker.plateNumber}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("車輛")}
        <input
          className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-base text-slate-600"
          readOnly
          value={form.vehicle}
          placeholder={t("選擇槽車後自動帶入")}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {t("司機")}
        <input
          className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          value={form.driver}
          onChange={(event) => onChange({ ...form, driver: event.target.value })}
          placeholder={t("例如 張司機")}
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
