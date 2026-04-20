import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.email?.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "";

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#2C2017] tracking-tight">管理員後台</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.3em] mt-1">ADMIN · DASHBOARD</p>
        </div>
        <div className="flex items-center gap-4 pt-2">
          {displayName && (
            <span className="text-sm text-[#9A8878] font-medium">{displayName}</span>
          )}
          <a href="/" className="btn-outline">家長端</a>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-[#9A8878] hover:text-red-400 transition-colors">
              登出
            </button>
          </form>
        </div>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6 max-w-7xl" style={{maxWidth:"100%"}} />

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
