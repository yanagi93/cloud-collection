"use client";

import { useEffect, useState } from "react";
import { Card, Button, ProgressBar } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type Cloud = {
  id: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  attackUp: number;
  image: string;
};

export default function BattleContent() {
  const myClouds: Cloud[] = [
    {
      id: 1,
      name: "わた雲",
      hp: 100,
      attack: 20,
      defense: 8,
      attackUp: 1.1,
      image: "https://placehold.co/300x300?text=Wata",
    },
    {
      id: 2,
      name: "ひつじ雲",
      hp: 80,
      attack: 30,
      defense: 5,
      attackUp: 1.2,
      image: "https://placehold.co/300x300?text=Hitsuji",
    },
    {
      id: 3,
      name: "入道雲",
      hp: 150,
      attack: 15,
      defense: 15,
      attackUp: 1.0,
      image: "https://placehold.co/300x300?text=Nyuudou",
    },
  ];

  const enemy: Cloud = {
    id: 999,
    name: "積乱雲",
    hp: 120,
    attack: 25,
    defense: 10,
    attackUp: 1,
    image: "https://placehold.co/300x300?text=Enemy",
  };

  // ======================
  // 選択画面（スライド）
  // ======================
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Cloud | null>(null);

  // ======================
  // バトル状態
  // ======================
  const [battle, setBattle] = useState(false);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [logs, setLogs] = useState<string[]>([]);
  const [turn, setTurn] = useState(0);
  const [lock, setLock] = useState(false);

  // ======================
  // アニメーション（大きく動く）
  // ======================
  const [playerAnim, setPlayerAnim] = useState(false);
  const [enemyAnim, setEnemyAnim] = useState(false);

  const next = () => setIndex((i) => (i + 1) % myClouds.length);
  const prev = () =>
    setIndex((i) => (i - 1 + myClouds.length) % myClouds.length);

  const startBattle = () => {
    const c = myClouds[index];
    setSelected(c);
    setPlayerHp(c.hp);
    setEnemyHp(enemy.hp);
    setBattle(true);
    setLogs([]);
    setTurn(0);
  };

  // ======================
  // 1クリック＝1ターン（完全同期）
  // ======================
  const nextTurn = () => {
    if (!selected || lock) return;

    setLock(true);

    const isPlayerTurn = turn % 2 === 0;

    setTimeout(() => {
      if (isPlayerTurn) {
        const damage = Math.max(
          1,
          Math.floor(selected.attack * selected.attackUp) - enemy.defense
        );

        setEnemyAnim(true);

        setEnemyHp((h) => Math.max(0, h - damage));

        setLogs((l) => [...l, `🟦 自分の攻撃！ ${damage}`]);

        setTimeout(() => setEnemyAnim(false), 500);
      } else {
        const damage = Math.max(1, enemy.attack - selected.defense);

        setPlayerAnim(true);

        setPlayerHp((h) => Math.max(0, h - damage));

        setLogs((l) => [...l, `🟥 敵の攻撃！ ${damage}`]);

        setTimeout(() => setPlayerAnim(false), 500);
      }

      setTurn((t) => t + 1);
      setLock(false);
    }, 200);
  };

  const playerWin = battle && enemyHp <= 0;
  const enemyWin = battle && playerHp <= 0;

  // ======================
  // UI
  // ======================
  return (
  <AuthGuard>
    <div className="min-h-screen bg-sky-100 p-6">
      <h1 className="text-4xl text-center font-bold mb-6">
        ☁ クラウドバトル
      </h1>

      {/* ======================
          選択画面（修正版：敵中央）
      ====================== */}
      {!battle && (
        <div className="flex flex-col justify-center ">

          {/* 🔥 敵（中央固定） */}
          <div className="flex justify-center items-center gap-4">
            <Card className="mb-8 p-4 w-96 text-center bg-yellow-100">
              <p className="font-bold text-2xl mb-2">{enemy.name}</p>

              <img
                src={enemy.image}
                className="w-40 h-40 mx-auto mb-3"
              />

              <div className="text-sm space-y-1">
                <p>HP: {enemy.hp}</p>
                <p>ATK: {enemy.attack}</p>
                <p>DEF: {enemy.defense}</p>
              </div>
            </Card>
          </div>

          {/* ======================
              キャラ選択スライド
          ====================== */}
          <div className="flex justify-center items-center gap-4">

            <Button onClick={prev}>←</Button>

            <div key={myClouds[index].id} className="transition-all duration-500">
              <Card className="p-6 text-center w-80">
                <img
                  src={myClouds[index].image}
                  className="w-48 h-48 mx-auto mb-3 hover:scale-110 transition-transform"
                />

                <p className="font-bold text-xl">
                  {myClouds[index].name}
                </p>

                <p>HP {myClouds[index].hp}</p>
                <p>ATK {myClouds[index].attack}</p>
                <p>DEF {myClouds[index].defense}</p>
              </Card>
            </div>

            <Button onClick={next}>→</Button>
          </div>

          {/* 開始ボタン */}
          <Button className="mt-6" onClick={startBattle}>
            このキャラで開始
          </Button>
        </div>
      
      )}

      {/* ======================
          バトル画面
      ====================== */}
      {battle && selected && (
        <>
          <div className="grid grid-cols-2 gap-10 mt-10 items-center">

            {/* 敵 */}
            <div className="text-center">
              <div
                className={`transition-transform duration-500 ${
                  enemyAnim ? "-translate-x-32 scale-125" : ""
                }`}
              >
                <img src={enemy.image} className="w-72 h-72 mx-auto" />
              </div>

              <ProgressBar
                progress={(enemyHp / enemy.hp) * 100}
                color="#f87171"
                borderColor="black"
                className="w-64 mx-auto mt-2"
              />

              <p>HP {enemyHp}</p>
            </div>

            {/* プレイヤー */}
            <div className="text-center">
              <div
                className={`transition-transform duration-500 ${
                  playerAnim ? "translate-x-32 scale-125" : ""
                }`}
              >
                <img src={selected.image} className="w-72 h-72 mx-auto" />
              </div>

              <ProgressBar
                progress={(playerHp / selected.hp) * 100}
                color="#60a5fa"
                borderColor="black"
                className="w-64 mx-auto mt-2"
              />

              <p>HP {playerHp}</p>
            </div>
          </div>

          {/* ボタン */}
          {!playerWin && !enemyWin && (
            <div className="text-center mt-8">
              <Button onClick={nextTurn} bg="#f59e0b">
                ターンを進める
              </Button>
            </div>
          )}

          {/* 勝敗 */}
          {playerWin && (
            <p className="text-center text-green-600 text-2xl mt-6">
              勝利！
            </p>
          )}

          {enemyWin && (
            <p className="text-center text-red-600 text-2xl mt-6">
              敗北…
            </p>
          )}

          {/* ログ */}
          <Card className="mt-6 p-4">
            <h2 className="font-bold mb-2">バトルログ</h2>
            {logs.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </Card>
        </>
      )}
    </div>
  </AuthGuard>
  );
}