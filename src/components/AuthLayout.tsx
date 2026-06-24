import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-slate-900 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">
              Chemical Gas Dispatch System
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight">
              化學氣體運輸與派車排班管理
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              支援跨平台操作、排班協作與管理員自訂儀表板，協助車隊快速掌握任務、車輛與庫存狀態。
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">RWD-first</p>
              <p className="mt-1">司機與主管可在手機、平板與桌機穩定操作。</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">Modular dashboard</p>
              <p className="mt-1">後續可用 JSON 儲存每位管理員的介面偏好。</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          {children}
        </section>
      </div>
    </main>
  );
}
