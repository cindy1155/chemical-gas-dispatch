import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";

type LoginFormState = {
  account: string;
  password: string;
};

const initialFormState: LoginFormState = {
  account: "",
  password: "",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>(initialFormState);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.account.trim() || !form.password.trim()) {
      setError("請輸入帳號與密碼。");
      return;
    }

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
            化學氣體派車排班系統
          </h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-2xl font-semibold">登入管理平台</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              請使用公司帳號登入，後續可依角色顯示排班、車隊與庫存模組。
            </p>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              帳號
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
                placeholder="例如 dispatcher01"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              密碼
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
                placeholder="輸入密碼"
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
              登入
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            尚未有帳號？
            <Link
              className="ml-2 font-semibold text-cyan-700 transition hover:text-cyan-800"
              to="/register"
            >
              註冊帳號
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
