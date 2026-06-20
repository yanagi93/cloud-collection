"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "pixel-retroui";

export default function CollectionPage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    // if (!isLoggedIn) {
    //   router.push("/login");
    // }
  }, [router]);

  const cloudAnimals = [
    {
      id: 1,
      name: "もくもくライオン",
      image: "https://via.placeholder.com/300x200?text=Lion",
    },
    {
      id: 2,
      name: "サンダードラゴン",
      image: "https://via.placeholder.com/300x200?text=Dragon",
    },
    {
      id: 3,
      name: "スカイウルフ",
      image: "https://via.placeholder.com/300x200?text=Wolf",
    },
    {
      id: 4,
      name: "クラウドフェニックス",
      image: "https://via.placeholder.com/300x200?text=Phoenix",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 p-8">
      {/* タイトル */}
      <div className="text-center mb-10">
        <h1 className="font-minecraft text-5xl mb-3">
          ☁️ 雲図鑑
        </h1>

        <p className="font-minecraft text-lg">
          発見した雲モンスター
        </p>

        <p className="font-minecraft text-sm mt-2">
          発見数: {cloudAnimals.length} / 100
        </p>
      </div>

      {/* 図鑑一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cloudAnimals.map((cloud) => (
          <Link
            key={cloud.id}
            href={`/cloud-detail/${cloud.id}`}
            className="hover:scale-105 transition-all duration-300"
          >
            <Card className="p-4 h-full">
              <img
                src={cloud.image}
                alt={cloud.name}
                className="w-full h-48 object-cover rounded mb-4"
              />

              <h2 className="font-minecraft text-xl text-center">
                {cloud.name}
              </h2>
            </Card>
          </Link>
        ))}

        {/* 未発見 */}
        <Card className="p-4 opacity-60">
          <div className="w-full h-48 flex items-center justify-center text-7xl">
            ❓
          </div>

          <h2 className="font-minecraft text-xl text-center">
            未発見
          </h2>
        </Card>
      </div>

      {/* 戻るボタン */}
      <div className="flex justify-center mt-12">
        <Button
          onClick={() => router.push("/home")}
          className="font-minecraft"
        >
          🏠 ホームへ戻る
        </Button>
      </div>
    </main>
  );
}