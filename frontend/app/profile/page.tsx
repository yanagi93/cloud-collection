"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AuthGuard from "@/component/AuthGuard";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");

  const [editMode, setEditMode] = useState(false);

  const [cloudCount, setCloudCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  // APIに存在しないので仮置き
  const battleWin = 5;

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
      <div className="bg-white/90 border-4 border-sky-400 shadow-2xl rounded-2xl w-[450px] p-6">

        <h1 className="text-3xl font-bold text-center mb-6">
          ⚙️ ステータス
        </h1>

        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-sky-300 rounded-full flex items-center justify-center text-3xl border-2 border-sky-500">
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

          <p className="mt-2 text-sm font-semibold text-sky-700">
            {title}
          </p>
        </div>

        <div className="border-t pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span>☁️ 図鑑登録</span>
            <span>{cloudCount} 種類</span>
          </div>

          <div className="flex justify-between">
            <span>⚔️ バトル勝利</span>
            <span>{battleWin} 回</span>
          </div>

          <div className="flex justify-between">
            <span>📷 撮影した雲</span>
            <span>{photoCount} 枚</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push("/home")}
            className="
              w-full
              bg-sky-500
              text-white
              py-3
              rounded-xl
              font-bold
              hover:bg-sky-600
              transition
            "
          >
            🏠 ホームへ戻る
          </button>

          <button
            onClick={() =>
              router.push("/collection")
            }
            className="
              w-full
              bg-yellow-500
              text-white
              py-3
              rounded-xl
              font-bold
              hover:bg-yellow-600
              transition
            "
          >
            ☁️ 図鑑を見る
          </button>

          <button
            onClick={() => router.push("/battle")}
            className="
              w-full
              bg-red-500
              text-white
              py-3
              rounded-xl
              font-bold
              hover:bg-red-600
              transition
            "
          >
            ⚔️ バトルへ
          </button>
        </div>
      </div>
    </main>
  </AuthGuard>
  );
}