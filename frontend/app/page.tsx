"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white px-4 py-4 overflow-x-hidden">
      <Card className="relative w-full max-w-[620px] p-4 text-center">
        {/* タイトル画像 */}
        <div className="relative mx-auto mb-3 w-full max-w-[520px]">
          <Image
            src="/images/new-title.png"
            alt="Cloud Collection"
            width={700}
            height={460}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* サブタイトル */}
        <h1 className="text-xl sm:text-2xl font-bold mb-1">
          ☁ CLOUD COLLECTION
        </h1>

        <p className="text-sm text-gray-600 mb-5">
          雲を集めて戦うRPG
        </p>

        {/* ボタンエリア */}
        <div className="flex flex-col gap-3 items-center">
          <Button
            onClick={() => router.push("/login")}
            className="w-full max-w-[210px] text-sm sm:text-base"
          >
            ▶ ゲームスタート
          </Button>

          <Button
            onClick={() => router.push("/register")}
            className="w-full max-w-[210px] text-sm sm:text-base"
          >
            ▶ 新規登録
          </Button>
        </div>
      </Card>
    </main>
  );
}