"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();

  const [username, setUsername] = useState("クラウドトレーナー");
  const [editMode, setEditMode] = useState(false);

  const cloudCount = 12;
  const battleWin = 5;
  const title = cloudCount >= 10 ? "☁️ 雲コレクター" : "見習いトレーナー";

  const handleSave = () => {
    setEditMode(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-white flex items-center justify-center">

      {/* メインウィンドウ */}
      <div className="bg-white/90 border-4 border-sky-400 shadow-2xl rounded-2xl w-[450px] p-6">

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-center mb-6">
          ⚙️ ステータス
        </h1>

        {/* アバター */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-sky-300 rounded-full flex items-center justify-center text-3xl border-2 border-sky-500">
            ☁️
          </div>

          {/* 名前編集 */}
          {editMode ? (
            <div className="flex gap-2 mt-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {username} ✏️
            </h2>
          )}

          <p className="text-gray-500 text-sm">
            user@example.com
          </p>
        </div>

        {/* ステータス情報 */}
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
            <span>{cloudCount + 3} 枚</span>
          </div>

        </div>

        {/* ボタン */}
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
            onClick={() => router.push("/collection")}
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
  );
}