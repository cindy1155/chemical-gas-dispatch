import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useLanguage } from "../i18n/LanguageContext";

type LoginFormState = {
  account: string;
  password: string;
};

type AuthRole = "管理員" | "調度員" | "司機";

const initialFormState: LoginFormState = {
  account: "",
  password: "",
};

const authStorageKey = "chemical-gas-dispatch-auth";
const authRoleStorageKey = "chemical-gas-dispatch-role";
const failedLoginCountStorageKey = "chemical-gas-dispatch-failed-login-count";
const loginLockUntilStorageKey = "chemical-gas-dispatch-login-lock-until";
const maxFailedLoginAttempts = 5;
const loginLockDurationMs = 5 * 60 * 1000;

const getLoginLockRemainingMinutes = () => {
  const lockUntil = Number(window.localStorage.getItem(loginLockUntilStorageKey) || "0");
  const remainingMs = lockUntil - Date.now();

  return remainingMs > 0 ? Math.ceil(remainingMs / 60000) : 0;
};

const recordBlockedLoginAttempt = () => {
  const currentCount = Number(window.localStorage.getItem(failedLoginCountStorageKey) || "0");
  const nextCount = currentCount + 1;

  if (nextCount >= maxFailedLoginAttempts) {
    window.localStorage.setItem(loginLockUntilStorageKey, String(Date.now() + loginLockDurationMs));
    window.localStorage.removeItem(failedLoginCountStorageKey);
    return true;
  }

  window.localStorage.setItem(failedLoginCountStorageKey, String(nextCount));
  return false;
};

const clearLoginProtectionState = () => {
  window.localStorage.removeItem(failedLoginCountStorageKey);
  window.localStorage.removeItem(loginLockUntilStorageKey);
};

const getRoleFromAccount = (account: string): AuthRole => {
  const normalizedAccount = account.trim().toLowerCase();

  if (normalizedAccount.includes("driver") || normalizedAccount.includes("司機")) {
    return "司機";
  }

  if (
    normalizedAccount.includes("admin") ||
    normalizedAccount.includes("manager") ||
    normalizedAccount.includes("cindy") ||
    normalizedAccount.includes("管理")
  ) {
    return "管理員";
  }

  return "調度員";
};

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState<LoginFormState>(initialFormState);
  const [error, setError] = useState("");
  const [lockRemainingMinutes, setLockRemainingMinutes] = useState(
    getLoginLockRemainingMinutes,
  );

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setLockRemainingMinutes(getLoginLockRemainingMinutes());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const currentLockRemainingMinutes = getLoginLockRemainingMinutes();

    if (currentLockRemainingMinutes > 0) {
      setLockRemainingMinutes(currentLockRemainingMinutes);
      setError(`${t("登入嘗試過多，請稍後再試。")} ${t("剩餘")} ${currentLockRemainingMinutes} ${t("分鐘")}`);
      return;
    }

    if (!form.account.trim() || !form.password.trim()) {
      const isLocked = recordBlockedLoginAttempt();
      setLockRemainingMinutes(getLoginLockRemainingMinutes());
      setError(t(isLocked ? "已達登入嘗試上限，請 5 分鐘後再試。" : "請輸入帳號與密碼。"));
      return;
    }

    const role = getRoleFromAccount(form.account);

    if (role === "司機") {
      const isLocked = recordBlockedLoginAttempt();
      setLockRemainingMinutes(getLoginLockRemainingMinutes());
      setError(
        t(
          isLocked
            ? "已達登入嘗試上限，請 5 分鐘後再試。"
            : "司機帳號目前不可進入管理後台，請使用管理員或調度員帳號。",
        ),
      );
      return;
    }

    clearLoginProtectionState();
    setLockRemainingMinutes(0);
    window.localStorage.setItem(authStorageKey, "authenticated");
    window.localStorage.setItem(authRoleStorageKey, role);
    navigate("/dashboard");
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <p className="text-sm font-semibold text-cyan-700">
            Chemical Gas Dispatch System
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {t("化學氣體派車排班系統")}
          </h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold">{t("登入管理平台")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("請使用公司帳號登入，後續可依角色顯示排班、車隊與庫存模組。")}
            </p>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            {lockRemainingMinutes > 0 ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {t("登入已暫時鎖定")}：{lockRemainingMinutes} {t("分鐘")}
              </p>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("帳號")}
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                autoComplete="username"
                value={form.account}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    account: event.target.value,
                  }))
                }
                placeholder={t("例如 dispatcher01")}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("密碼")}
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                autoComplete="current-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder={t("輸入密碼")}
              />
            </label>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={lockRemainingMinutes > 0}
              type="submit"
            >
              {t("登入")}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            {t("尚未有帳號？")}
            <Link
              className="ml-2 font-semibold text-cyan-700 transition hover:text-cyan-800"
              to="/register"
            >
              {t("註冊帳號")}
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
