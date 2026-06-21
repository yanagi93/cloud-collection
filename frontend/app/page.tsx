"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white">

      <Card className="relative w-[900px] p-6 text-center">

        {/* タイトル画像 */}
        <div className="relative mb-6">
          <Image
            src="/images/new-title.png"
            alt="Cloud Collection"
            width={900}
            height={600}
            priority
          />
        </div>

        {/* サブタイトル */}
        <h1 className="text-3xl font-bold mb-2">
          ☁ CLOUD COLLECTION
        </h1>

        <p className="text-gray-600 mb-8">
          雲を集めて戦うターンバトル
        </p>

        {/* ボタンエリア */}
        <div className="flex flex-col gap-4 items-center">

          <Button
            onClick={() => router.push("/login")}
            className="w-[250px] text-lg"
          >
            ▶ ゲームスタート
          </Button>

          <Button
            onClick={() => router.push("/register")}
            className="w-[250px] text-lg"
          >
            ▶ 新規登録
          </Button>

        </div>

      </Card>

    </main>
  );
}