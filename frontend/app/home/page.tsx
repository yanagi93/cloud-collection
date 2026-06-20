"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  return (
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
      {/* ピクセル雲 */}
        <div className="absolute top-12 left-16 text-7xl animate-bounce">
            ☁️
        </div>

        <div className="absolute top-24 right-20 text-8xl animate-bounce">
            ☁️
        </div>

        <div className="absolute bottom-20 left-24 text-7xl animate-bounce">
            ☁️
        </div>

        {/* メインメニュー */}
        <Card className="w-[700px] p-10">
            <div className="text-center mb-8">
                <h1 className="font-minecraft text-5xl mb-4">
                ☁️ 雲コレクション
                </h1>

                <p className="font-minecraft text-lg">
                ▼ メニューを選んでください
                </p>
            </div>

            <div className="flex flex-col gap-5">
                <Button
                className="font-minecraft text-lg"
                onClick={() => router.push("/camera")}
                >
                📷 雲を撮影する
                </Button>

                <Button
                className="font-minecraft text-lg"
                onClick={() => router.push("/collection")}
                >
                📖 図鑑を見る
                </Button>

                <Button
                className="font-minecraft text-lg"
                onClick={() => router.push("/battle")}
                >
                ⚔️ バトルする
                </Button>

                <Button
                className="font-minecraft text-lg"
                onClick={() => router.push("/mypage")}
                >
                👤 マイページ
                </Button>

                <Button
                className="font-minecraft text-lg"
                onClick={handleLogout}
                >
                🚪 ログアウト
                </Button>
            </div>
        </Card>
    </main>
  );
}