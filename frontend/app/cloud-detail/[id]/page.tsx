"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, ProgressBar } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

export default function CloudDetailPage() {
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  const [name, setName] = useState("もくもくライオン");

  const cloudData = {
    hp: 100,
    attack: 80,
    defense: 70,
    attackUp: 15,

    rarity: 4, // ★1〜★5

    specialSkill: "かみなりの咆哮",

    createdAt: "2026-06-17 13:20",

    originalImage:
      "https://via.placeholder.com/300x200?text=Original",

    aiImage:
      "https://via.placeholder.com/300x200?text=AI",
  };

  const rarityConfig = {
  1: {
    bg: "#e5e7eb",
    label: "コモン",
  },
  2: {
    bg: "#86efac",
    label: "アンコモン",
  },
  3: {
    bg: "#93c5fd",
    label: "レア",
  },
  4: {
    bg: "#e0d9ff",
    label: "エピック",
  },
  5: {
    bg: "#fde68a",
    label: "レジェンダリー",
  },
} as const;

const rarityInfo =
  rarityConfig[cloudData.rarity as keyof typeof rarityConfig];

  const isRare = cloudData.rarity >= 4;

  return (
  <AuthGuard>
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white p-6 overflow-hidden">

      {/* 高レア演出 */}
      {isRare && (
        <>
          <div className="absolute top-10 left-10 text-4xl animate-bounce">
            ✨
          </div>

          <div className="absolute top-20 right-20 text-5xl animate-pulse">
            ⭐
          </div>

          <div className="absolute bottom-20 left-1/4 text-4xl animate-bounce">
            ✨
          </div>

          <div className="absolute bottom-32 right-1/4 text-5xl animate-pulse">
            ⭐
          </div>
        </>
      )}

      {/* ★5専用演出 */}
    {cloudData.rarity === 5 && (
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-1/4 left-1/4 text-6xl animate-pulse">
          🌈
        </div>

        <div className="absolute top-1/3 right-1/4 text-5xl animate-bounce">
          ✨
        </div>

        <div className="absolute bottom-1/4 left-1/3 text-5xl animate-pulse">
          ⭐
        </div>

        <div className="absolute bottom-1/3 right-1/3 text-6xl animate-bounce">
          🌈
        </div>

      </div>
    )}

      <Card
        bg={rarityInfo.bg}
        className={`
            w-full
            max-w-5xl
            p-6
            transition-all
            duration-500
            ${
            isRare
                ? "border-4 border-yellow-400 shadow-yellow-300 shadow-2xl"
                : ""
            }
        `}
        >
        {/* タイトル */}
        <h1
        className={`
            text-2xl
            font-bold
            text-center
            mb-6
            ${
            cloudData.rarity === 5
                ? "text-yellow-600 animate-pulse"
                : ""
            }
        `}
        >
        ☁ 図鑑詳細
        </h1>

        {/* 名前編集 */}
        {editMode ? (
          <div className="text-center mb-6">

            <div className="flex justify-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  border-2
                  border-sky-400
                  px-3
                  py-1
                  rounded
                  text-center
                  text-xl
                  font-bold
                  bg-white
                "
              />

              <button
                onClick={() => setEditMode(false)}
                className="
                  bg-green-500
                  text-white
                  px-3
                  py-1
                  rounded
                  font-bold
                "
              >
                決定
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              名前を変更しています
            </p>

          </div>
        ) : (
          <div className="text-center mb-6">

            <h2
              className={`
                text-3xl
                font-bold
                cursor-pointer
                ${
                  isRare
                    ? "text-yellow-500 drop-shadow-lg"
                    : ""
                }
              `}
              onClick={() => setEditMode(true)}
            >
              {name} ✏️
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              クリックして名前を変更
            </p>

          </div>
        )}

        {/* レア度 */}
        <div className="text-center mb-8">

        <p className="font-bold mb-2">
            レア度
        </p>

        <div className="text-3xl text-yellow-500">
            {"★".repeat(cloudData.rarity)}
            {"☆".repeat(5 - cloudData.rarity)}
        </div>

        <p className="font-bold mt-2 text-lg">
            {rarityInfo.label}
        </p>

        {cloudData.rarity === 5 && (
            <p className="mt-2 text-yellow-600 font-bold animate-pulse text-xl">
            👑 LEGENDARY CLOUD 👑
            </p>
        )}

        </div>

        {/* 画像 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          <div className="border p-3 rounded-xl bg-white">
            <h2 className="text-center font-bold mb-2">
              📷 元の雲
            </h2>

            <img
              src={cloudData.originalImage}
              alt="元画像"
              className="w-full rounded-md"
            />
          </div>

          <div className="border p-3 rounded-xl bg-white">
            <h2 className="text-center font-bold mb-2">
              ✨ 変化後の姿
            </h2>

            <img
              src={cloudData.aiImage}
              alt="AI画像"
              className="w-full rounded-md"
            />
          </div>

        </div>

        {/* 雲値 */}
        <Card className="p-4 mb-6">

          <h2 className="text-xl font-bold text-center mb-4">
            ☁ 雲値
          </h2>

          <div className="space-y-4">

            <div>
              <div className="flex justify-between mb-1">
                <span>❤️ HP</span>
                <span>{cloudData.hp}</span>
              </div>

              <ProgressBar
                size="md"
                color="red"
                borderColor="black"
                progress={cloudData.hp}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>⚔ 攻撃力</span>
                <span>{cloudData.attack}</span>
              </div>

              <ProgressBar
                size="md"
                color="orange"
                borderColor="black"
                progress={cloudData.attack}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>🛡 防御力</span>
                <span>{cloudData.defense}</span>
              </div>

              <ProgressBar
                size="md"
                color="skyblue"
                borderColor="black"
                progress={cloudData.defense}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>🔥 攻撃強化</span>
                <span>+{cloudData.attackUp}</span>
              </div>

              <ProgressBar
                size="md"
                color="pink"
                borderColor="black"
                progress={cloudData.attackUp * 5}
                className="w-full"
              />
            </div>

          </div>

        </Card>

        {/* 特殊能力 */}
        <Card className="p-4 mb-6">

          <h2 className="text-lg font-bold text-center mb-3">
            ✨ 特殊能力
          </h2>

          <p className="text-center text-xl font-bold">
            {cloudData.specialSkill}
          </p>

        </Card>

        {/* 作成日時 */}
        <div className="text-center text-sm text-gray-500 mb-6">
          作成日時：{cloudData.createdAt}
        </div>

        {/* 戻る */}
        <div className="flex justify-center">
          <Button onClick={() => router.push("/collection")}>
            図鑑へ戻る
          </Button>
        </div>

      </Card>

    </main>
  </AuthGuard>
  );
}