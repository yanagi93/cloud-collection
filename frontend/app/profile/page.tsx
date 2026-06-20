"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AuthGuard from "@/component/AuthGuard";
import { Button, Card } from "pixel-retroui";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");

  const [editMode, setEditMode] = useState(false);

  const [cloudCount, setCloudCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("accessToken");

        console.log("token", token);

        if (!token) {
          router.push("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // ユーザー情報取得
        const meRes = await fetch(
          "http://localhost:8080/me",
          {
            headers,
          }
        );

        console.log("=== /me ===");
        console.log("status", meRes.status);

        const me = await meRes.json();

        console.log("response", me);

        if (meRes.ok) {
          setUser(me);
          setUsername(me.display_name);
        }

        // 図鑑登録数取得
        const animalsRes = await fetch(
          "http://localhost:8080/animals",
          {
            headers,
          }
        );

        if (animalsRes.ok) {
          const animals = await animalsRes.json();

          setCloudCount(
            animals.pagination?.total_items ??
              animals.items?.length ??
              0
          );
        }

        // 撮影した雲の枚数取得
        const photosRes = await fetch(
          "http://localhost:8080/cloud-photos",
          {
            headers,
          }
        );

        if (photosRes.ok) {
          const photos = await photosRes.json();

          setPhotoCount(
            photos.pagination?.total_items ??
              photos.items?.length ??
              0
          );
        }
      } catch (error) {
        console.error(
          "PROFILE ERROR",
          error
        );
      }
    };

    fetchProfile();
  }, [router]);

  const title =
    cloudCount >= 10
      ? "☁️ 雲コレクター"
      : "見習いトレーナー";

  const handleSave = () => {
    // OpenAPIには名前変更APIがないため画面だけ更新
    setEditMode(false);
  };

  return (
  <AuthGuard>
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-white flex items-center justify-center">
      <Card
        bg="#fefcd0"
        className="w-[500px] p-8"
      >

      <h1 className="font-minecraft text-4xl text-center mb-6">
        ☁️ マイページ
      </h1>
        <div className="flex flex-col items-center mb-6">
        <div
          className="
            w-28
            h-28
            bg-sky-300
            border-4
            border-black
            flex
            items-center
            justify-center
            text-6xl
            mx-auto
          "
        >
          ☁️
        </div>
          {editMode ? (
            <div className="flex gap-2 mt-3">
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="border px-2 py-1 rounded"
              />

              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-2 rounded"
              >
                OK
              </button>
            </div>
          ) : (
            <h2
              className="text-xl font-bold mt-3 cursor-pointer"
              onClick={() => setEditMode(true)}
            >
              {username || "読み込み中..."} ✏️
            </h2>
          )}

          <p className="text-gray-500 text-sm">
            {user?.email ?? ""}
          </p>

          <div
            className="
              mt-3
              px-4
              py-1
              bg-yellow-300
              border-2
              border-black
              font-bold
            "
          >
            🏅 {title}
          </div>
        </div>

        <Card className="p-4 mt-4">
          <h2 className="font-bold text-center mb-3">
            📊 プレイヤーデータ
          </h2>

          <div className="flex justify-between">
            <span>☁️ 図鑑登録</span>
            <span>{cloudCount} 種類</span>
          </div>

          <div className="flex justify-between">
            <span>📷 撮影した雲</span>
            <span>{photoCount} 枚</span>
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Button
            onClick={() => router.push("/home")}
            className="font-minecraft text-lg"
          >
            🏠 ホームへ戻る
          </Button>

          <Button
            onClick={() =>
              router.push("/collection")
            }
            className="font-minecraft text-lg"
          >
            ☁️ 図鑑を見る
          </Button>

          <Button
            onClick={() => router.push("/globe")}
            className="font-minecraft text-lg"
          >
            🌎 タイムラインを見る
          </Button>
        </div>
      </Card>
    </main>
  </AuthGuard>
  );
}