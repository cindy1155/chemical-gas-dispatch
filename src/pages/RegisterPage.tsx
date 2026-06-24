import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useLanguage } from "../i18n/LanguageContext";

type RegisterFormState = {
  name: string;
  account: string;
  role: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: RegisterFormState = {
  name: "",
  account: "",
  role: "dispatcher",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.account.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim()
    ) {
      setError(t("請完整填寫註冊資料。"));
      return;
    }

    if (form.password.length < 8) {
      setError(t("密碼至少需要 8 個字元。"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("兩次輸入的密碼不一致。"));
      return;
    }

    navigate("/login");
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
            <h2 className="text-2xl font-semibold">{t("註冊帳號")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("建立管理平台帳號。實際審核與權限分配將於後端 RBAC 完成後串接。")}
            </p>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("姓名")}
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                autoComplete="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder={t("例如 王小明")}
              />
            </label>

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
                placeholder={t("例如 driver01")}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("角色")}
              <select
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
              >
                <option value="dispatcher">{t("調度員")}</option>
                <option value="driver">{t("司機")}</option>
                <option value="admin">{t("管理員")}</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("密碼")}
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                autoComplete="new-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder={t("至少 8 個字元")}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              {t("確認密碼")}
              <input
                className="h-11 rounded-md border border-slate-300 px-3 text-base outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                autoComplete="new-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder={t("再次輸入密碼")}
              />
            </label>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              className="h-11 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-200"
              type="submit"
            >
              {t("建立帳號")}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            {t("已經有帳號？")}
            <Link
              className="ml-2 font-semibold text-cyan-700 transition hover:text-cyan-800"
              to="/login"
            >
              {t("回到登入")}
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
