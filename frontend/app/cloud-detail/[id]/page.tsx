"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, ProgressBar } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type AnimalDetail = {
  id: string;
  photo_id: string;
  name: string;
  species: string;
  original_image_url?: string | null;
  composite_image_url: string;
  confidence?: number | null;
  description?: string | null;
  hp: number;
  attack: number;
  evasion: number;
  defense: number;
  created_at: string;
  updated_at?: string | null;
};

type ApiError = {
  message?: string;
  error_message?: string;
};

const IMAGE_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
    /\/$/,
    ""
  );

const rarityConfig = {
  1: { bg: "#e5e7eb", label: "コモン" },
  2: { bg: "#86efac", label: "アンコモン" },
  3: { bg: "#93c5fd", label: "レア" },
  4: { bg: "#e0d9ff", label: "エピック" },
  5: { bg: "#fde68a", label: "レジェンダリー" },
} as const;

function toImageUrl(url?: string | null): string | null {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${IMAGE_BASE_URL}${url}`;
  }

  return `${IMAGE_BASE_URL}/${url}`;
}

function getStatusTotal(animal: Pick<AnimalDetail, "hp" | "attack" | "evasion" | "defense">) {
  return animal.hp + animal.attack + animal.evasion + animal.defense;
}

function getRarityByStatusTotal(total: number) {
  if (total >= 250) return 5;
  if (total >= 220) return 4;
  if (total >= 180) return 3;
  if (total >= 140) return 2;
  return 1;
}

function progress(value: number, max = 100) {
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CloudDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const animalID = params.id;

  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [name, setName] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const controller = new AbortController();

    const fetchAnimal = async () => {
      try {
        setIsLoading(true);
        setMessage(null);

        const response = await fetch(`/api/animals/${animalID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = (await response.json()) as AnimalDetail & ApiError;

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("isLoggedIn");
            router.push("/login");
            return;
          }

          setMessage(data.message ?? data.error_message ?? "動物の取得に失敗しました。");
          setAnimal(null);
          return;
        }

        setAnimal(data);
        setName(data.name);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(error);
        setMessage("通信エラーです。バックエンドが起動しているか確認してください。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimal();

    return () => {
      controller.abort();
    };
  }, [animalID, router]);

  const handleSaveName = async () => {
    if (!animal || isSaving) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage("名前を入力してください。");
      return;
    }

    if (trimmedName.length > 30) {
      setMessage("名前は30文字以内にしてください。");
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch(`/api/animals/${animal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = (await response.json()) as AnimalDetail & ApiError;

      if (!response.ok) {
        setMessage(data.message ?? data.error_message ?? "名前の更新に失敗しました。");
        return;
      }

      setAnimal(data);
      setName(data.name);
      setEditMode(false);
    } catch (error) {
      console.error(error);
      setMessage("通信エラーです。バックエンドが起動しているか確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white p-6">
          <Card className="bg-white p-6">
            <p className="font-bold">読み込み中...</p>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  if (!animal) {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white p-6">
          <Card className="w-full max-w-md bg-white p-6 text-center">
            <p className="font-bold">{message ?? "動物が見つかりません。"}</p>
            <Button
              onClick={() => router.push("/collection")}
              className="mt-5"
            >
              図鑑へ戻る
            </Button>
          </Card>
        </main>
      </AuthGuard>
    );
  }

  const statusTotal = getStatusTotal(animal);
  const rarity = getRarityByStatusTotal(statusTotal);
  const rarityInfo = rarityConfig[rarity as keyof typeof rarityConfig];
  const isRare = rarity >= 4;
  const originalImageURL = toImageUrl(animal.original_image_url);
  const compositeImageURL = toImageUrl(animal.composite_image_url);

  return (
    <AuthGuard>
      <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white p-6 overflow-hidden">
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

        {rarity === 5 && (
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
          className={`w-full max-w-5xl p-6 transition-all duration-500 ${
            isRare ? "border-4 border-yellow-400 shadow-yellow-300 shadow-2xl" : ""
          }`}
        >
          <h1
            className={`text-2xl font-bold text-center mb-6 ${
              rarity === 5 ? "text-yellow-600 animate-pulse" : ""
            }`}
          >
            ☁ 図鑑詳細
          </h1>

          {message ? (
            <div className="mb-5 border-2 border-black bg-red-50 p-3 text-center text-sm font-bold text-red-700">
              {message}
            </div>
          ) : null}

          {editMode ? (
            <div className="text-center mb-6">
              <div className="flex justify-center gap-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={30}
                  className="border-2 border-sky-400 px-3 py-1 rounded text-center text-xl font-bold bg-white"
                />

                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="bg-green-500 text-white px-3 py-1 rounded font-bold disabled:opacity-60"
                >
                  {isSaving ? "保存中" : "決定"}
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                名前を変更しています
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <h2
                className={`text-3xl font-bold cursor-pointer ${
                  isRare ? "text-yellow-500 drop-shadow-lg" : ""
                }`}
                onClick={() => setEditMode(true)}
              >
                {animal.name} ✏️
              </h2>

              <p className="mt-2 text-sm font-bold text-gray-700">
                {animal.species}
              </p>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="font-bold mb-2">レア度</p>

            <div className="text-3xl text-yellow-500">
              {"★".repeat(rarity)}
              {"☆".repeat(5 - rarity)}
            </div>

            <p className="font-bold mt-2 text-lg">{rarityInfo.label}</p>

            <p className="mt-1 text-sm text-gray-600">
              雲値合計: {statusTotal}
            </p>

            {rarity === 5 && (
              <p className="mt-2 text-yellow-600 font-bold animate-pulse text-xl">
                👑 LEGENDARY CLOUD 👑
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border p-3 rounded-xl bg-white">
              <h2 className="text-center font-bold mb-2">📷 元の雲</h2>

              {originalImageURL ? (
                <img
                  src={originalImageURL}
                  alt="元画像"
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                  元画像がありません
                </div>
              )}
            </div>

            <div className="border p-3 rounded-xl bg-white">
              <h2 className="text-center font-bold mb-2">✨ 変化後の姿</h2>

              {compositeImageURL ? (
                <img
                  src={compositeImageURL}
                  alt="AI画像"
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-md bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                  生成画像がありません
                </div>
              )}
            </div>
          </div>

          <Card className="p-4 mb-6 " bg="#ffffff">
            <h2 className="text-xl font-bold text-center mb-4">☁ 雲値</h2>

            <div className="space-y-4">
              <StatusBar label="❤️ HP" value={animal.hp} progress={progress(animal.hp, 150)} color="red" />
              <StatusBar label="⚔ 攻撃力" value={animal.attack} progress={progress(animal.attack)} color="orange" />
              <StatusBar label="💨 回避力" value={animal.evasion} progress={progress(animal.evasion)} color="pink" />
              <StatusBar label="🛡 防御力" value={animal.defense} progress={progress(animal.defense)} color="skyblue" />
            </div>
          </Card>

          {animal.description ? (
            <Card className="p-4 mb-6">
              <h2 className="text-lg font-bold text-center mb-3">
                AIの説明
              </h2>

              <p className="text-sm leading-relaxed">
                {animal.description}
              </p>
            </Card>
          ) : null}

          <div className="text-center text-sm text-gray-500 mb-6">
            作成日時: {formatDate(animal.created_at)}
          </div>

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

function StatusBar({
  label,
  value,
  progress: progressValue,
  color,
}: {
  label: string;
  value: number;
  progress: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <ProgressBar
        size="md"
        color={color}
        borderColor="black"
        progress={progressValue}
        className="w-full"
      />
    </div>
  );
}
