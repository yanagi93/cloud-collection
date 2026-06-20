"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, ProgressBar } from "pixel-retroui";
import { createAnimal } from "@/lib/api/animals";
import type { PendingAnimal } from "@/types/animal";

const PENDING_KEY = "pendingAnimal";

function calculateRarity(confidence: number) {
    if (confidence >= 0.95) return 5;
    if (confidence >= 0.85) return 4;
    if (confidence >= 0.7) return 3;
    if (confidence >= 0.5) return 2;
    return 1;
}

function calculateStatus(confidence: number) {
    return {
        hp: Math.round(60 + confidence * 40),
        attack: Math.round(40 + confidence * 60),
        defense: Math.round(50 + confidence * 50),
        attackUp: Math.round(confidence * 20),
    };
}

function getRarityLabel(rarity: number) {
    if (rarity === 5) return "レジェンダリー";
    if (rarity === 4) return "エピック";
    if (rarity === 3) return "レア";
    if (rarity === 2) return "アンコモン";
    return "コモン";
}

function getRarityBg(rarity: number) {
    if (rarity === 5) return "#fde68a";
    if (rarity === 4) return "#e0d9ff";
    if (rarity === 3) return "#bfdbfe";
    if (rarity === 2) return "#bbf7d0";
    return "#e5e7eb";
}

export default function CloudRegisterPage() {
    const router = useRouter();

    const [pendingAnimal, setPendingAnimal] =
        useState<PendingAnimal | null>(null);

    const [name, setName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem(PENDING_KEY);

        if (!saved) {
            alert("登録する雲モンスターがありません");
            router.push("/camera");
            return;
        }

        try {
            const parsed = JSON.parse(saved) as PendingAnimal;
            setPendingAnimal(parsed);
        } catch (error) {
            console.error(error);
            alert("登録データの読み込みに失敗しました");
            router.push("/camera");
        }
    }, [router]);

    const confidence = pendingAnimal?.confidence ?? 0;

    const rarity = calculateRarity(confidence);
    const rarityLabel = getRarityLabel(rarity);
    const rarityBg = getRarityBg(rarity);

    const status = useMemo(() => {
        return calculateStatus(confidence);
    }, [confidence]);

    const totalStatus =
        status.hp + status.attack + status.defense + status.attackUp;

    const handleRegister = async () => {
        if (!pendingAnimal) return;

        const trimmedName = name.trim();

        if (!trimmedName) {
            alert("名前を入力してください");
            return;
        }

        if (trimmedName.length > 30) {
            alert("名前は30文字以内にしてください");
            return;
        }

        try {
            setIsRegistering(true);

            await createAnimal({
                photoId: pendingAnimal.photoId,
                name: trimmedName,
                useSuggestedAnimal: true,
            });

            sessionStorage.removeItem(PENDING_KEY);
            router.push("/collection");
        } catch (error) {
            console.error(error);
            alert(
                "図鑑登録に失敗しました。処理が完了していない、または既に登録済みの可能性があります。"
            );
        } finally {
            setIsRegistering(false);
        }
    };

    if (!pendingAnimal) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-sky-100">
                <p className="font-minecraft">読み込み中...</p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 px-4 py-5 overflow-hidden">
            {rarity >= 4 && (
                <>
                    <div className="absolute top-8 left-8 text-5xl animate-bounce pointer-events-none">
                        ✨
                    </div>

                    <div className="absolute top-16 right-12 text-6xl animate-pulse pointer-events-none">
                        ⭐
                    </div>

                    <div className="absolute bottom-20 left-16 text-5xl animate-bounce pointer-events-none">
                        ✨
                    </div>

                    <div className="absolute bottom-28 right-16 text-6xl animate-pulse pointer-events-none">
                        ⭐
                    </div>

                    <div className="absolute top-1/2 left-8 text-4xl animate-pulse pointer-events-none">
                        🌟
                    </div>

                    <div className="absolute top-1/3 right-8 text-4xl animate-bounce pointer-events-none">
                        ✨
                    </div>
                </>
            )}

            {rarity === 5 && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 text-7xl animate-pulse">
                        🌈
                    </div>

                    <div className="absolute top-1/3 right-1/4 text-6xl animate-bounce">
                        ✨
                    </div>

                    <div className="absolute bottom-1/4 left-1/3 text-6xl animate-pulse">
                        ⭐
                    </div>

                    <div className="absolute bottom-1/3 right-1/3 text-7xl animate-bounce">
                        🌈
                    </div>

                    <div className="absolute top-12 left-1/2 text-5xl animate-pulse">
                        👑
                    </div>

                    <div className="absolute bottom-12 left-1/2 text-5xl animate-bounce">
                        💫
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-4xl relative z-10">
                <div className="mb-4 text-center">
                    <h1 className="font-minecraft text-3xl mb-2">
                        ☁️ 図鑑に登録
                    </h1>

                    <p className="font-minecraft text-xs">
                        名前を決めて雲モンスターを仲間にしよう
                    </p>
                </div>

                <Card
                    bg={rarityBg}
                    className={`
            p-4
            border-4
            border-black
            shadow-[6px_6px_0px_#000]
            ${rarity >= 4
                            ? "shadow-yellow-300"
                            : ""
                        }
          `}
                >
                    <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-5">
                        <section>
                            <Card className="p-3 bg-white">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-minecraft text-lg">
                                        ✨ 変化後
                                    </h2>

                                    <span className="text-xs font-bold">
                                        {Math.round(confidence * 100)}%
                                    </span>
                                </div>

                                <div
                                    className={`
                    border-4
                    border-black
                    bg-sky-100
                    rounded
                    overflow-hidden
                    ${rarity >= 4
                                            ? "shadow-[0_0_18px_rgba(250,204,21,0.8)]"
                                            : ""
                                        }
                  `}
                                >
                                    <img
                                        src={pendingAnimal.compositeImageUrl}
                                        alt="変化後の雲モンスター"
                                        className="w-full h-64 object-cover"
                                    />
                                </div>

                                <div className="mt-3 flex gap-3">
                                    <div className="w-24 shrink-0">
                                        <p className="text-[10px] font-bold mb-1 text-center">
                                            元の雲
                                        </p>

                                        <div className="border-2 border-black bg-sky-100 rounded overflow-hidden">
                                            <img
                                                src={pendingAnimal.originalImageUrl}
                                                alt="元の雲"
                                                className="w-full h-16 object-cover"
                                            />
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold">
                                            種族：{pendingAnimal.suggestedAnimal}
                                        </p>

                                        {pendingAnimal.description && (
                                            <p className="mt-1 text-xs leading-relaxed text-gray-700">
                                                {pendingAnimal.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </section>

                        <section className="space-y-3">
                            <Card className="p-4 bg-white">
                                <h2 className="font-minecraft text-lg text-center mb-3">
                                    名前をつける
                                </h2>

                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="例：もくもくライオン"
                                    maxLength={30}
                                    className="
                    w-full
                    border-4
                    border-black
                    bg-white
                    px-3
                    py-2
                    text-center
                    text-xl
                    font-bold
                    rounded
                    outline-none
                    focus:bg-sky-50
                  "
                                />

                                <p className="text-center text-[11px] text-gray-500 mt-2">
                                    30文字まで
                                </p>
                            </Card>

                            <Card className="p-4 bg-white">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-minecraft text-lg">
                                            レア度
                                        </p>

                                        <p
                                            className={`text-sm font-bold ${rarity >= 4
                                                    ? "text-yellow-600 animate-pulse"
                                                    : ""
                                                }`}
                                        >
                                            {rarityLabel}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div
                                            className={`text-2xl text-yellow-500 leading-none ${rarity >= 4
                                                    ? "drop-shadow-lg animate-pulse"
                                                    : ""
                                                }`}
                                        >
                                            {"★".repeat(rarity)}
                                            {"☆".repeat(5 - rarity)}
                                        </div>

                                        <p className="mt-1 text-xs">
                                            合計雲値：{totalStatus}
                                        </p>

                                        {rarity === 5 && (
                                            <p className="mt-2 text-xs font-bold text-yellow-600 animate-pulse">
                                                👑 LEGENDARY 👑
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 bg-white">
                                <h2 className="font-minecraft text-lg text-center mb-3">
                                    ☁ 雲値
                                </h2>

                                <div className="space-y-3">
                                    <StatusBar
                                        label="❤️ HP"
                                        value={status.hp}
                                        color="red"
                                    />

                                    <StatusBar
                                        label="⚔ 攻撃"
                                        value={status.attack}
                                        color="orange"
                                    />

                                    <StatusBar
                                        label="🛡 防御"
                                        value={status.defense}
                                        color="skyblue"
                                    />

                                    <StatusBar
                                        label="🔥 強化"
                                        value={status.attackUp}
                                        displayValue={`+${status.attackUp}`}
                                        progress={status.attackUp * 5}
                                        color="pink"
                                    />
                                </div>
                            </Card>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <Button
                                    onClick={() => router.push("/result")}
                                    className="font-minecraft"
                                >
                                    戻る
                                </Button>

                                <Button
                                    onClick={handleRegister}
                                    disabled={isRegistering}
                                    className="font-minecraft"
                                >
                                    {isRegistering ? "登録中..." : "登録する"}
                                </Button>
                            </div>
                        </section>
                    </div>
                </Card>
            </div>
        </main>
    );
}

type StatusBarProps = {
    label: string;
    value: number;
    displayValue?: string;
    progress?: number;
    color: "red" | "orange" | "skyblue" | "pink";
};

function StatusBar({
    label,
    value,
    displayValue,
    progress,
    color,
}: StatusBarProps) {
    return (
        <div>
            <div className="flex justify-between mb-1 text-sm font-bold">
                <span>{label}</span>
                <span>{displayValue ?? value}</span>
            </div>

            <ProgressBar
                size="sm"
                color={color}
                borderColor="black"
                progress={progress ?? value}
                className="w-full"
            />
        </div>
    );
}