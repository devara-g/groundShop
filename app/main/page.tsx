import { createServerSupabase } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Halo, {profile?.username || "User"}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Total Posts</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Teman</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Pesan</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: "Feed", desc: "Lihat postingan", href: "/main/feed", color: "bg-blue-500" },
          { name: "Contacts", desc: "Teman & Permintaan", href: "/main/contacts", color: "bg-green-500" },
          { name: "Chat", desc: "Pesan realtime", href: "/main/chat", color: "bg-purple-500" },
          { name: "Payment", desc: "Crypto Payment", href: "/main/payment", color: "bg-orange-500" },
        ].map((menu) => (
          <a
            key={menu.name}
            href={menu.href}
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className={`w-12 h-12 ${menu.color} rounded-xl mb-3 flex items-center justify-center text-white font-bold`}>
              {menu.name[0]}
            </div>
            <h3 className="font-semibold group-hover:text-blue-600">{menu.name}</h3>
            <p className="text-sm text-gray-500">{menu.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}