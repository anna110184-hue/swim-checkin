"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("帳號或密碼錯誤，請再試一次");
    } else {
      router.push("/admin");
      router.refresh();
    }
    setLoading(false);
  }

  const inp = "w-full border border-[#EDE5D8] rounded-xl px-4 py-3 text-sm bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 text-[#2C2017] placeholder:text-[#C4B8A8]";

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-4xl font-black text-[#2C2017] tracking-tight">管理員登入</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.3em] mt-1">ADMIN · LOGIN</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl border border-[#EDE5D8] p-7 space-y-5 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9A8878] tracking-wide uppercase">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inp} placeholder="admin@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9A8878] tracking-wide uppercase">密碼</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inp} placeholder="••••••••" />
          </div>
          {error && (
            <div className="bg-[#FFF0F0] text-[#E57373] text-sm px-4 py-2.5 rounded-xl border border-[#FFCDD2]">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 text-base mt-2">
            {loading ? "登入中…" : "登入"}
          </button>
        </form>

        <p className="text-center">
          <a href="/" className="text-sm text-[#9A8878] hover:text-[#A67C52] transition-colors">← 返回打卡頁面</a>
        </p>
      </div>
    </div>
  );
}
