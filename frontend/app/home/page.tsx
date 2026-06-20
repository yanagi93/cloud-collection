"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  return (
    <AuthGuard>
      <main
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-sky-400
          bg-[linear-gradient(to_bottom,#7dd3fc_0%,#38bdf8_40%,#e0f2fe_100%)]
          overflow-hidden
          relative
        "
      >
        {/* 流れる雲 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">

        <div
          className="absolute top-92 animate-cloud-slow text-[10rem] opacity-80"
          style={{ animationDelay: "-7s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-128 animate-cloud-slow text-[11rem] opacity-80"
          style={{ animationDelay: "-15s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-12 animate-cloud-slow text-[13rem] opacity-80"
          style={{ animationDelay: "-10s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-32 animate-cloud-medium text-[9rem] opacity-80"
          style={{ animationDelay: "-20s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-64 animate-cloud-fast text-[12rem] opacity-80"
          style={{ animationDelay: "-5s" }}
        >
          ☁️
        </div>

      </div>

        <div
        onClick={() => router.push("/profile")}
        className="
          absolute top-6 right-6 z-20
          w-16 h-16
          bg-yellow-200
          border-4 border-black
          rounded-full
          flex items-center justify-center
          text-3xl
          cursor-pointer
          hover:scale-110
          transition-transform
        "
      >
        🧑‍🚀
      </div>

        {/* メインメニュー */}
        <Card className="w-[700px] p-10 z-20">
          <div className="text-center mb-8">
            <h1 className="font-minecraft text-5xl mb-4">
              ☁️ 雲コレクション
            </h1>

            <p className="font-minecraft text-lg">
              ▼ メニューを選んでください
            </p>
          </div>

          <div className="flex flex-col gap-5 z-30">
            <Button
              className="font-minecraft text-lg"
              onClick={() => router.push("/camera")}
            >
              📷 雲を撮影する
            </Button>

            <Button
              className="font-minecraft text-lg z-30"
              onClick={() => router.push("/collection")}
            >
              📖 図鑑を見る
            </Button>

            <Button
              className="font-minecraft text-lg z-30"
              onClick={() => router.push("/globe")}
            >
              🌎 タイムラインを見る
            </Button>

            <Button
              className="font-minecraft text-lg z-30"
              onClick={handleLogout}
            >
              🚪 ログアウト
            </Button>
          </div>
        </Card>
      </main>
    </AuthGuard>
  );
}