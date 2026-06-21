"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";
import type { PendingAnimal } from "@/types/animal";

type BattleStats = {
    hp: number;
    attack: number;
    evasion: number;
    defense: number;
};

type AnimalResponse = {
    id?: string;
    message?: string;
    error_message?: string;
};

const PENDING_KEY = "pendingAnimal";

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomStats(): BattleStats {
    return {
        hp: randomInt(80, 140),
        attack: randomInt(20, 60),
        evasion: randomInt(5, 35),
        defense: randomInt(10, 50),
    };
}

export default function CloudRegisterPage() {
    const router = useRouter();
    const [pendingAnimal, setPendingAnimal] = useState<PendingAnimal | null>(null);
    const [stats, setStats] = useState<BattleStats | null>(null);
    const [name, setName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const saved = sessionStorage.getItem(PENDING_KEY);

            if (!saved) {
                router.replace("/camera");
                return;
            }

            try {
                const parsed = JSON.parse(saved) as PendingAnimal;
                setPendingAnimal(parsed);
                setStats(createRandomStats());
            } catch (error) {
                console.error(error);
                router.replace("/camera");
            }
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [router]);

    const handleRegister = async () => {
        if (!pendingAnimal || !stats || isRegistering) return;

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
            setIsRegistering(true);
            setMessage(null);

            const response = await fetch("/api/animals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    photo_id: pendingAnimal.photoId,
                    name: trimmedName,
                    use_suggested_animal: true,
                    hp: stats.hp,
                    attack: stats.attack,
                    evasion: stats.evasion,
                    defense: stats.defense,
                }),
            });

            const data = (await response.json()) as AnimalResponse;

            if (!response.ok) {
                setMessage(data.message ?? data.error_message ?? "登録に失敗しました。");
                return;
            }

            sessionStorage.removeItem(PENDING_KEY);
            router.push("/collection");
        } catch (error) {
            console.error(error);
            setMessage("通信エラーです。バックエンドが起動しているか確認してください。");
        } finally {
            setIsRegistering(false);
        }
    };

    if (!pendingAnimal || !stats) {
        return (
            <AuthGuard>
                <main className="min-h-screen bg-sky-100 flex items-center justify-center p-4">
                    <Card className="p-6 bg-white">
                        <p className="font-bold">読み込み中...</p>
                    </Card>
                </main>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <main className="min-h-screen bg-sky-100 px-4 py-8">
                <div className="mx-auto max-w-5xl">
                    <h1 className="mb-6 text-center text-3xl font-bold">
                        雲モンスター登録
                    </h1>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                        <Card className="bg-white p-5">
                            <div className="overflow-hidden rounded border-4 border-black bg-sky-50">
                                <img
                                    src={pendingAnimal.compositeImageUrl}
                                    alt="生成された雲モンスター"
                                    className="h-[360px] w-full object-cover"
                                />
                            </div>

                            <div className="mt-4 border-2 border-black bg-yellow-50 p-3 text-sm">
                                <p className="font-bold">
                                    見えた動物: {pendingAnimal.suggestedAnimal}
                                </p>

                                <p className="mt-1">
                                    確信度: {Math.round(pendingAnimal.confidence * 100)}%
                                </p>

                                {pendingAnimal.description ? (
                                    <p className="mt-2 leading-relaxed">
                                        {pendingAnimal.description}
                                    </p>
                                ) : null}
                            </div>
                        </Card>

                        <Card className="bg-white p-5">
                            <label className="block text-sm font-bold" htmlFor="animal-name">
                                名前
                            </label>
                            <input
                                id="animal-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={30}
                                className="mt-2 w-full rounded border-4 border-black bg-white px-3 py-3 text-lg font-bold outline-none focus:bg-sky-50"
                                placeholder="例: もくもくギツネ"
                            />

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <StatusBox label="HP" value={stats.hp} />
                                <StatusBox label="攻撃" value={stats.attack} />
                                <StatusBox label="回避" value={stats.evasion} />
                                <StatusBox label="防御" value={stats.defense} />
                            </div>

                            {message ? (
                                <div className="mt-4 border-2 border-black bg-red-50 p-3 text-sm font-bold text-red-700">
                                    {message}
                                </div>
                            ) : null}

                            <div className="mt-5 flex flex-col gap-3">
                                <Button
                                    onClick={handleRegister}
                                    disabled={isRegistering}
                                    className="h-14 bg-sky-200 text-black font-bold"
                                >
                                    {isRegistering ? "登録中..." : "図鑑に登録"}
                                </Button>

                                <Button
                                    onClick={() => router.push("/result")}
                                    disabled={isRegistering}
                                    className="h-12 bg-white text-black font-bold"
                                >
                                    戻る
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </AuthGuard>
    );
}

function StatusBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="border-2 border-black bg-sky-50 p-3 text-center shadow-[3px_3px_0px_#000]">
            <p className="text-xs font-bold">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}
