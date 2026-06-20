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
        <main className="relative min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 p-6 overflow-hidden">
            {rarity >= 4 && (
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

            <div className="mx-auto max-w-6xl">
                <div className="text-center mb-8">
                    <h1 className="font-minecraft text-4xl mb-3">
                        ☁️ 図鑑に登録
                    </h1>

                    <p className="font-minecraft text-sm">
                        キャラの姿と雲値を見ながら、名前を決めよう
                    </p>
                </div>

                <Card
                    bg={rarityBg}
                    className="p-6 border-4 border-black shadow-[8px_8px_0px_#000]"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section>
                            <Card className="p-4 mb-5 bg-white">
                                <h2 className="font-minecraft text-xl text-center mb-4">
                                    ✨ 変化後の姿
                                </h2>

                                <div className="border-4 border-black bg-sky-100 rounded overflow-hidden">
                                    <img
                                        src={pendingAnimal.compositeImageUrl}
                                        alt="変化後の雲モンスター"
                                        className="w-full h-80 object-cover"
                                    />
                                </div>
                            </Card>

                            <Card className="p-4 bg-white">
                                <h2 className="font-minecraft text-lg text-center mb-3">
                                    📷 元の雲
                                </h2>

                                <div className="border-2 border-black bg-sky-100 rounded overflow-hidden">
                                    <img
                                        src={pendingAnimal.originalImageUrl}
                                        alt="元の雲"
                                        className="w-full h-44 object-cover"
                                    />
                                </div>
                            </Card>
                        </section>

                        <section>
                            <Card className="p-5 mb-5 bg-white">
                                <h2 className="font-minecraft text-xl text-center mb-4">
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
                    px-4
                    py-3
                    text-center
                    text-2xl
                    font-bold
                    rounded
                    outline-none
                    focus:bg-sky-50
                  "
                                />

                                <p className="text-center text-xs text-gray-500 mt-2">
                                    30文字まで入力できます
                                </p>
                            </Card>

                            <Card className="p-5 mb-5 bg-white">
                                <h2 className="font-minecraft text-xl text-center mb-3">
                                    判定結果
                                </h2>

                                <p className="text-center text-lg font-bold">
                                    種族：{pendingAnimal.suggestedAnimal}
                                </p>

                                <p className="text-center text-sm mt-2">
                                    確信度：{Math.round(confidence * 100)}%
                                </p>

                                {pendingAnimal.description && (
                                    <p className="mt-4 text-sm leading-relaxed">
                                        {pendingAnimal.description}
                                    </p>
                                )}
                            </Card>

                            <Card className="p-5 mb-5 bg-white">
                                <h2 className="font-minecraft text-xl text-center mb-3">
                                    レア度
                                </h2>

                                <div className="text-center">
                                    <div className="text-4xl text-yellow-500 mb-2">
                                        {"★".repeat(rarity)}
                                        {"☆".repeat(5 - rarity)}
                                    </div>

                                    <p className="font-bold text-xl">{rarityLabel}</p>

                                    <p className="text-sm mt-2">合計雲値：{totalStatus}</p>

                                    {rarity === 5 && (
                                        <p className="mt-3 text-yellow-600 font-bold animate-pulse">
                                            👑 LEGENDARY CLOUD 👑
                                        </p>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-5 mb-5 bg-white">
                                <h2 className="font-minecraft text-xl text-center mb-4">
                                    ☁ 雲値
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1 font-bold">
                                            <span>❤️ HP</span>
                                            <span>{status.hp}</span>
                                        </div>

                                        <ProgressBar
                                            size="md"
                                            color="red"
                                            borderColor="black"
                                            progress={status.hp}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1 font-bold">
                                            <span>⚔ 攻撃力</span>
                                            <span>{status.attack}</span>
                                        </div>

                                        <ProgressBar
                                            size="md"
                                            color="orange"
                                            borderColor="black"
                                            progress={status.attack}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1 font-bold">
                                            <span>🛡 防御力</span>
                                            <span>{status.defense}</span>
                                        </div>

                                        <ProgressBar
                                            size="md"
                                            color="skyblue"
                                            borderColor="black"
                                            progress={status.defense}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1 font-bold">
                                            <span>🔥 攻撃強化</span>
                                            <span>+{status.attackUp}</span>
                                        </div>

                                        <ProgressBar
                                            size="md"
                                            color="pink"
                                            borderColor="black"
                                            progress={status.attackUp * 5}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                                    {isRegistering ? "登録中..." : "図鑑に登録する"}
                                </Button>
                            </div>
                        </section>
                    </div>
                </Card>
            </div>
        </main>
    );
}