"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function Home() {
  const router = useRouter();

  return (
    <main className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-b from-sky-200 to-white px-4">
      <Card className="relative w-full max-w-[800px] max-h-[92vh] p-4 text-center">
        {/* タイトル画像 */}
        <div className="relative mb-3 w-full flex justify-center">
          <Image
            src="/images/new-title.png"
            alt="Cloud Collection"
            width={900}
            height={600}
            priority
            className="w-full max-w-[680px] max-h-[45vh] object-contain"
          />
        </div>

        {/* サブタイトル */}
        <h1 className="text-2xl font-bold mb-1">
          ☁ CLOUD COLLECTION
        </h1>

        <p className="text-gray-600 mb-4">
          雲を集めて戦うRPG
        </p>

        {/* ボタンエリア */}
        <div className="flex flex-col gap-3 items-center">
          <Button
            onClick={() => router.push("/login")}
            className="w-full max-w-[240px] text-lg"
          >
            ▶ ゲームスタート
          </Button>

          <Button
            onClick={() => router.push("/register")}
            className="w-full max-w-[240px] text-lg"
          >
            ▶ 新規登録
          </Button>
        </div>
      </Card>
    </main>
  );
}