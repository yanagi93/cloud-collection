"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type CloudAnimal = {
  id: string;
  name: string;
  species?: string;
  hp?: number;
  attack?: number;
  evasion?: number;
  defense?: number;
  original_image_url?: string;
  composite_image_url?: string;
};

type AnimalListResponse = {
  items?: CloudAnimal[];
};

const IMAGE_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
    /\/$/,
    ""
  );

function toImageUrl(url?: string | null): string {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${IMAGE_BASE_URL}${url}`;
  }

  return `${IMAGE_BASE_URL}/${url}`;
}

function getStatusTotal(cloud: CloudAnimal) {
  return (
    (cloud.hp ?? 0) +
    (cloud.attack ?? 0) +
    (cloud.evasion ?? 0) +
    (cloud.defense ?? 0)
  );
}

function getRarityByStatusTotal(total: number) {
  if (total >= 250) return 5;
  if (total >= 220) return 4;
  if (total >= 180) return 3;
  if (total >= 140) return 2;
  return 1;
}

export default function CollectionPage() {
  const router = useRouter();

  const [cloudAnimals, setCloudAnimals] =
    useState<CloudAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token =
          localStorage.getItem("accessToken");

        console.log("token", token);

        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/animals?page=1&page_size=100&sort=created_at_desc", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        console.log(
          "/animals status",
          res.status
        );

        if (!res.ok) {
          throw new Error("取得失敗");
        }

        const data = (await res.json()) as AnimalListResponse;

        console.log("/animals", data);

        setCloudAnimals(data.items ?? []);
      } catch (error) {
        console.error(
          "ANIMALS ERROR",
          error
        );
        setErrorMessage("図鑑の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimals();
  }, [router]);

  const getRarity = (cloud: CloudAnimal) => {
    return getRarityByStatusTotal(getStatusTotal(cloud));
  };

  const rarityLabel = {
    1: "コモン",
    2: "アンコモン",
    3: "レア",
    4: "エピック",
    5: "レジェンダリー",
  };

  return (
  <AuthGuard>
    <main className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 p-8">
      {/* タイトル */}
      <div className="text-center mb-10">
        <h1 className="font-minecraft text-5xl mb-3 z-20">
          ☁️ 雲図鑑
        </h1>

        <p className="font-minecraft text-lg z-20">
          発見した雲モンスター
        </p>

        <p className="font-minecraft text-sm mt-2 z-20">
          発見数: {cloudAnimals.length} / 100
        </p>

      </div>

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

      {/* 図鑑一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto z-20">
        {isLoading && (
          <Card className="p-4 text-center font-bold z-20">
            読み込み中...
          </Card>
        )}

        {errorMessage && (
          <Card className="p-4 text-center font-bold text-red-600 z-20">
            {errorMessage}
          </Card>
        )}

        {cloudAnimals.map((cloud) => {
          const rarity = getRarity(cloud);
          const statusTotal = getStatusTotal(cloud);
          const imageUrl = toImageUrl(
            cloud.composite_image_url ?? cloud.original_image_url
          );

          return (
            <Link
              key={cloud.id}
              href={`/cloud-detail/${cloud.id}`}
              className="hover:scale-105 transition-all duration-300 z-20"
            >
              <Card
                bg={
                  rarity === 5
                    ? "#fde68a"
                    : rarity === 4
                    ? "#e0d9ff"
                    : rarity === 3
                    ? "#93c5fd"
                    : rarity === 2
                    ? "#86efac"
                    : "#ffffff"
                }
                className={`
                  p-4
                  h-full
                  ${
                    rarity >= 4
                      ? "border-4 border-yellow-400 shadow-xl z-20"
                      : ""
                  }
                `}
              >
                <img
                  src={imageUrl}
                  alt={cloud.name}
                  className="w-full h-48 object-cover rounded mb-4 z-20"
                />

                {/* レアリティ */}
                <div className="text-center mb-3 z-20">
                  <div className="text-yellow-500 text-xl">
                    {"★".repeat(rarity)}
                    {"☆".repeat(5 - rarity)}
                  </div>

                  <p className="text-sm font-bold">
                    {
                      rarityLabel[
                        rarity as keyof typeof rarityLabel
                      ]
                    }
                  </p>

                  {rarity === 5 && (
                    <p className="text-yellow-600 font-bold animate-pulse mt-1">
                      👑 LEGENDARY
                    </p>
                  )}
                </div>

                <h2 className="font-minecraft text-xl text-center">
                  {cloud.name}
                </h2>

                <p className="text-center text-sm mt-2">
                  {cloud.species}
                </p>

                <div className="mt-3 text-center text-xs text-gray-600">
                  雲値合計: {statusTotal}
                </div>
              </Card>
            </Link>
          );
        })}

        {/* 撮影へ誘導 */}
        <Link
          href="/camera"
          className="hover:scale-105 transition-all duration-300 z-20"
        >
          <Card
            className="
              p-4
              h-full
              border-4
              border-dashed
              border-sky-400
              bg-sky-50
              hover:bg-sky-100
              cursor-pointer
              z-20
            "
          >
            <div className="w-full h-48 flex flex-col items-center justify-center z-20">
              <div className="text-7xl mb-2">
                📷
              </div>

              <div className="text-3xl">
                ☁️
              </div>
            </div>

            <h2 className="font-minecraft text-xl text-center font-bold z-20">
              雲の写真を撮ろう！
            </h2>

            <p className="text-center text-sm mt-2 text-gray-600 z-20">
              新しい雲モンスターを発見しよう
            </p>
          </Card>
        </Link>
      </div>

      {/* 戻るボタン */}
      <div className="flex justify-center mt-12">
        <Button
          onClick={() => router.push("/home")}
          className="font-minecraft z-20"
        >
          🏠 ホームへ戻る
        </Button>
      </div>
    </main>
  </AuthGuard>
  );
}
