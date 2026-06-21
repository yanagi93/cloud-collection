"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, ProgressBar } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type Animal = {
    id: string;
    name: string;
    species?: string;
    original_image_url?: string | null;
    composite_image_url?: string | null;
    hp: number;
    attack: number;
    evasion: number;
    defense: number;
};

type AnimalListResponse = {
    items?: Animal[];
};

type BattleStatus = {
    hp: number;
    attack: number;
    evasion: number;
    defense: number;
};

type BattleAction = {
    type: "attack" | "attack_buff";
    hit?: boolean;
    damage?: number;
    increment?: number;
};

type BattleTurnLog = {
    actor: "challenger" | "defender";
    actions: BattleAction[];
};

type BattleResult = {
    initial_status: {
        challenger: BattleStatus;
        defender: BattleStatus;
    };
    winner: "challenger" | "defender";
    battle_log: BattleTurnLog[];
};

const IMAGE_BASE_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
        /\/$/,
        ""
    );

function toImageUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${IMAGE_BASE_URL}${url}`;
    return `${IMAGE_BASE_URL}/${url}`;
}

function animalImageUrl(animal?: Animal | null): string | null {
    return toImageUrl(animal?.composite_image_url ?? animal?.original_image_url);
}

function progress(current: number, max: number) {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (current / max) * 100));
}

function remainingHp(result: BattleResult) {
    let challenger = result.initial_status.challenger.hp;
    let defender = result.initial_status.defender.hp;

    for (const log of result.battle_log) {
        for (const action of log.actions) {
            if (action.type !== "attack" || action.hit === false) continue;

            const damage = action.damage ?? 0;
            if (log.actor === "challenger") {
                defender -= damage;
            } else {
                challenger -= damage;
            }
        }
    }

    return {
        challenger: Math.max(0, challenger),
        defender: Math.max(0, defender),
    };
}

function formatAction(log: BattleTurnLog, action: BattleAction) {
    const actor = log.actor === "challenger" ? "自分" : "相手";

    if (action.type === "attack_buff") {
        return `${actor}の攻撃力が ${action.increment ?? 0} 上がった`;
    }

    if (action.hit === false) {
        return `${actor}の攻撃は外れた`;
    }

    return `${actor}の攻撃: ${action.damage ?? 0} ダメージ`;
}

function StatusRows({ animal }: { animal: Animal }) {
    const rows = [
        ["HP", animal.hp],
        ["ATK", animal.attack],
        ["EVA", animal.evasion],
        ["DEF", animal.defense],
    ] as const;

    return (
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {rows.map(([label, value]) => (
                <div key={label} className="border-2 border-black bg-white px-2 py-1">
                    <p>{label}</p>
                    <p>{value}</p>
                </div>
            ))}
        </div>
    );
}

function AnimalCard({
    title,
    animal,
    imageUrl,
}: {
    title: string;
    animal: Animal;
    imageUrl: string | null;
}) {
    return (
        <Card className="p-4">
            <p className="mb-3 text-center text-sm font-bold">{title}</p>
            <div className="mx-auto mb-3 aspect-square w-full max-w-72 overflow-hidden border-2 border-black bg-white">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={animal.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold">
                        No Image
                    </div>
                )}
            </div>
            <p className="text-center text-xl font-bold">{animal.name}</p>
            <p className="mb-3 text-center text-sm">{animal.species ?? ""}</p>
            <StatusRows animal={animal} />
        </Card>
    );
}

export default function BattleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defenderId =
        searchParams.get("defenderId") ??
        searchParams.get("enemyPhotoId") ??
        searchParams.get("enemyAnimalId");

    const [enemy, setEnemy] = useState<Animal | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

    const selectedAnimal = animals[selectedIndex] ?? null;
    const enemyImageUrl = useMemo(() => animalImageUrl(enemy), [enemy]);
    const selectedImageUrl = useMemo(
        () => animalImageUrl(selectedAnimal),
        [selectedAnimal]
    );

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            const load = async () => {
                if (!defenderId) {
                    setErrorMessage("対戦相手が指定されていません");
                    setIsLoading(false);
                    return;
                }

                const token = localStorage.getItem("accessToken");
                if (!token) {
                    setErrorMessage("認証情報が見つかりません");
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                setErrorMessage(null);
                setBattleResult(null);

                try {
                    const headers = { Authorization: `Bearer ${token}` };
                    const [enemyResponse, animalsResponse] = await Promise.all([
                        fetch(`/api/animals/${defenderId}`, {
                            headers,
                            cache: "no-store",
                            signal: controller.signal,
                        }),
                        fetch(
                            "/api/animals?page=1&page_size=100&sort=created_at_desc",
                            {
                                headers,
                                cache: "no-store",
                                signal: controller.signal,
                            }
                        ),
                    ]);

                    const enemyData = (await enemyResponse.json()) as Animal & {
                        message?: string;
                    };
                    const animalsData =
                        (await animalsResponse.json()) as AnimalListResponse & {
                            message?: string;
                        };

                    if (!enemyResponse.ok) {
                        throw new Error(
                            enemyData.message ?? "対戦相手の取得に失敗しました"
                        );
                    }
                    if (!animalsResponse.ok) {
                        throw new Error(
                            animalsData.message ??
                                "自分の動物一覧の取得に失敗しました"
                        );
                    }

                    setEnemy(enemyData);
                    setAnimals(dataWithoutDefender(animalsData.items ?? [], defenderId));
                    setSelectedIndex(0);
                } catch (error) {
                    if (error instanceof Error && error.name === "AbortError") {
                        return;
                    }

                    console.error("battle setup error:", error);
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "バトル準備中にエラーが発生しました"
                    );
                } finally {
                    setIsLoading(false);
                }
            };

            load();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [defenderId]);

    const moveSelection = (direction: number) => {
        if (animals.length === 0) return;

        setSelectedIndex((current) => {
            return (current + direction + animals.length) % animals.length;
        });
        setBattleResult(null);
        setErrorMessage(null);
    };

    const createBattle = async () => {
        if (!defenderId || !selectedAnimal) return;

        const token = localStorage.getItem("accessToken");
        if (!token) {
            setErrorMessage("認証情報が見つかりません");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        setBattleResult(null);

        try {
            const response = await fetch("/api/battles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    challenger_id: selectedAnimal.id,
                    defender_id: defenderId,
                }),
            });

            const data = (await response.json()) as BattleResult & {
                message?: string;
            };

            if (!response.ok) {
                throw new Error(data.message ?? "バトルの実行に失敗しました");
            }

            setBattleResult(data);
        } catch (error) {
            console.error("battle request error:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "バトルの実行に失敗しました"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const finalHp = battleResult ? remainingHp(battleResult) : null;

    return (
        <AuthGuard>
            <main className="min-h-screen bg-sky-100 px-4 py-6">
                <h1 className="mb-6 text-center text-3xl font-bold">
                    クラウドバトル
                </h1>

                {errorMessage ? (
                    <div className="mx-auto mb-5 max-w-3xl rounded border-2 border-black bg-red-100 px-4 py-3 text-sm font-bold text-red-700 shadow-[4px_4px_0px_#000]">
                        {errorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <p className="text-center text-sm font-bold">
                        バトル準備中...
                    </p>
                ) : !enemy ? (
                    <Card className="mx-auto max-w-md p-5 text-center">
                        <p className="mb-4 font-bold">
                            対戦相手の情報がありません
                        </p>
                        <Button onClick={() => router.push("/globe")}>
                            地球儀に戻る
                        </Button>
                    </Card>
                ) : animals.length === 0 || !selectedAnimal ? (
                    <Card className="mx-auto max-w-md p-5 text-center">
                        <p className="mb-4 font-bold">
                            バトルに出せる動物がまだ登録されていません
                        </p>
                        <Button onClick={() => router.push("/camera")}>
                            Animalを登録する
                        </Button>
                    </Card>
                ) : (
                    <div className="mx-auto max-w-5xl">
                        <section className="grid gap-5 md:grid-cols-2">
                            <AnimalCard
                                title="対戦相手"
                                animal={enemy}
                                imageUrl={enemyImageUrl}
                            />
                            <div>
                                <AnimalCard
                                    title="自分のAnimalを選択"
                                    animal={selectedAnimal}
                                    imageUrl={selectedImageUrl}
                                />
                                <div className="mt-4 flex items-center justify-center gap-3">
                                    <Button
                                        onClick={() => moveSelection(-1)}
                                        disabled={animals.length <= 1}
                                    >
                                        ←
                                    </Button>
                                    <span className="min-w-20 text-center text-sm font-bold">
                                        {selectedIndex + 1} / {animals.length}
                                    </span>
                                    <Button
                                        onClick={() => moveSelection(1)}
                                        disabled={animals.length <= 1}
                                    >
                                        →
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <div className="mt-6 text-center">
                            <Button
                                bg="#f59e0b"
                                onClick={createBattle}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "バトル中..." : "このAnimalで戦う"}
                            </Button>
                        </div>

                        {battleResult && finalHp ? (
                            <section className="mt-8">
                                <Card className="p-5">
                                    <p
                                        className={`mb-5 text-center text-2xl font-bold ${
                                            battleResult.winner === "challenger"
                                                ? "text-green-700"
                                                : "text-red-700"
                                        }`}
                                    >
                                        {battleResult.winner === "challenger"
                                            ? "勝利"
                                            : "敗北"}
                                    </p>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <p className="mb-2 text-center font-bold">
                                                自分
                                            </p>
                                            <ProgressBar
                                                progress={progress(
                                                    finalHp.challenger,
                                                    battleResult.initial_status
                                                        .challenger.hp
                                                )}
                                                color="#60a5fa"
                                                borderColor="black"
                                            />
                                            <p className="mt-1 text-center text-sm font-bold">
                                                HP {finalHp.challenger} /{" "}
                                                {
                                                    battleResult.initial_status
                                                        .challenger.hp
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="mb-2 text-center font-bold">
                                                相手
                                            </p>
                                            <ProgressBar
                                                progress={progress(
                                                    finalHp.defender,
                                                    battleResult.initial_status
                                                        .defender.hp
                                                )}
                                                color="#f87171"
                                                borderColor="black"
                                            />
                                            <p className="mt-1 text-center text-sm font-bold">
                                                HP {finalHp.defender} /{" "}
                                                {
                                                    battleResult.initial_status
                                                        .defender.hp
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="mt-5 max-h-80 overflow-y-auto p-4">
                                    <h2 className="mb-3 font-bold">
                                        バトルログ
                                    </h2>
                                    <div className="space-y-2 text-sm">
                                        {battleResult.battle_log.map(
                                            (log, logIndex) =>
                                                log.actions.map(
                                                    (action, actionIndex) => (
                                                        <p
                                                            key={`${logIndex}-${actionIndex}`}
                                                            className="border-b border-black/20 pb-2"
                                                        >
                                                            {logIndex + 1}.{" "}
                                                            {formatAction(
                                                                log,
                                                                action
                                                            )}
                                                        </p>
                                                    )
                                                )
                                        )}
                                    </div>
                                </Card>
                            </section>
                        ) : null}
                    </div>
                )}
            </main>
        </AuthGuard>
    );
}

function dataWithoutDefender(items: Animal[], defenderId: string) {
    return items.filter((animal) => animal.id !== defenderId);
}
