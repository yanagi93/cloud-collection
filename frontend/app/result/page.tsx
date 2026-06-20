"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ProgressBar } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type ProcessingResult = {
    suggested_animal?: string;
    confidence?: number;
    description?: string;
    composite_image_url?: string;
};

type ProcessingJob = {
    id?: string;
    photo_id?: string;
    status?: "pending" | "processing" | "completed" | "failed" | string;
    result?: ProcessingResult | null;
    error?: {
        code?: string;
        message?: string;
    } | null;
};

type CloudPhoto = {
    id?: string;
    original_image_url?: string;
    status?: string;
    processing?: ProcessingJob | null;
    [key: string]: unknown;
};

function toBackendImageUrl(url?: string): string | null {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `http://localhost:8080${url}`;
    }

    return `http://localhost:8080/${url}`;
}

function getProgress(status?: string, currentProgress = 15): number {
    if (status === "completed") return 100;
    if (status === "failed") return 100;
    if (status === "processing") return Math.min(currentProgress + 8, 90);
    if (status === "pending") return Math.min(currentProgress + 4, 45);

    return Math.min(currentProgress + 3, 70);
}

export default function ResultPage() {
    const router = useRouter();

    const [originalImgSrc, setOriginalImgSrc] = useState<string | null>(null);
    const [photo, setPhoto] = useState<CloudPhoto | null>(null);
    const [processing, setProcessing] = useState<ProcessingJob | null>(null);
    const [message, setMessage] = useState("AIイラストを生成しています...");
    const [progress, setProgress] = useState(15);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        const savedOriginalImage = sessionStorage.getItem("selectedCloudImage");
        const savedPhoto = sessionStorage.getItem("uploadedCloudPhoto");

        if (!savedOriginalImage) {
            router.replace("/camera");
            return;
        }

        setOriginalImgSrc(savedOriginalImage);

        if (!savedPhoto) {
            setMessage("アップロード情報が見つかりません。もう一度撮影してください。");
            return;
        }

        try {
            const parsedPhoto = JSON.parse(savedPhoto) as CloudPhoto;
            setPhoto(parsedPhoto);

            if (parsedPhoto.processing) {
                setProcessing(parsedPhoto.processing);
            }
        } catch (error) {
            console.error(error);
            setMessage("アップロード情報の読み込みに失敗しました。");
        }
    }, [router]);

    useEffect(() => {
        if (!photo?.id) return;

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setMessage("ログイン情報がありません。もう一度ログインしてください。");
            router.push("/login");
            return;
        }

        let timer: NodeJS.Timeout | null = null;

        const fetchProcessingStatus = async () => {
            try {
                setIsPolling(true);

                const response = await fetch(`/api/cloud-photos/${photo.id}/process`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const responseText = await response.text();

                let data: any = {};

                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch {
                    data = {
                        message: responseText || "JSONではないレスポンスが返ってきました",
                    };
                }
                if (!response.ok) {
                    console.error("process status failed:", data);

                    if (response.status === 401) {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("isLoggedIn");
                        setMessage("ログイン期限が切れています。もう一度ログインしてください。");
                        router.push("/login");
                        return;
                    }

                    setMessage(data.message ?? "生成状態の取得に失敗しました。");
                    return;
                }

                const job = data as ProcessingJob;
                const status = job.status ?? "unknown";

                setProcessing(job);
                setProgress((prev) => getProgress(status, prev));

                if (status === "completed") {
                    setMessage("AIイラストが完成しました！");
                    setProgress(100);

                    if (timer) clearInterval(timer);
                    return;
                }

                if (status === "failed") {
                    setMessage(job.error?.message ?? "AIイラスト生成に失敗しました。");
                    setProgress(100);

                    if (timer) clearInterval(timer);
                    return;
                }

                if (status === "processing") {
                    setMessage("AIイラストを生成中です...");
                    return;
                }

                if (status === "pending") {
                    setMessage("生成の順番待ちです...");
                    return;
                }

                setMessage("生成状態を確認しています...");
            } catch (error) {
                console.error(error);
                setMessage("通信エラーです。バックエンドが起動しているか確認してください。");
            } finally {
                setIsPolling(false);
            }
        };

        fetchProcessingStatus();

        timer = setInterval(() => {
            fetchProcessingStatus();
        }, 3000);

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [photo?.id, router]);

    const status = processing?.status ?? photo?.status ?? "unknown";
    const result = processing?.result;
    const resultImageUrl = toBackendImageUrl(result?.composite_image_url);
    const suggestedAnimal = result?.suggested_animal;
    const description = result?.description;

    return (
      <AuthGuard>
        <main className="min-h-screen bg-sky-300 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
            <div className="absolute top-10 left-[-50px] text-white opacity-40 text-4xl animate-pulse">
                ☁️
            </div>

            <div className="absolute bottom-20 right-[-50px] text-white opacity-40 text-5xl">
                ☁️
            </div>

            <div className="w-full max-w-md z-10">
                <Card className="p-6 text-center bg-white" borderColor="#000000" shadowColor="#222222">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        ✨ 生成結果
                    </h1>

                    <p className="text-xs text-gray-500 mb-4">
                        雲の写真からAIイラストを生成しています
                    </p>

                    <div className="mb-5 border-2 border-black bg-sky-50 px-3 py-3 text-xs text-gray-800 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <p className="font-bold mb-2">{message}</p>

                        <ProgressBar
                            size="md"
                            color="pink"
                            borderColor="black"
                            className="w-full"
                            progress={progress}
                        />

                        <div className="flex justify-between mt-2">
                            <span>status: {status}</span>
                            <span>{progress}%</span>
                        </div>

                        {isPolling && (
                            <p className="mt-1 text-gray-500">
                                生成状況を確認中...
                            </p>
                        )}
                    </div>

                    <div className="border-4 border-black bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {resultImageUrl ? (
                            <img
                                src={resultImageUrl}
                                alt="生成されたAIイラスト"
                                className="w-full h-full object-cover"
                            />
                        ) : originalImgSrc ? (
                            <div className="relative w-full h-full">
                                <img
                                    src={originalImgSrc}
                                    alt="元の雲写真"
                                    className="w-full h-full object-cover opacity-60"
                                />

                                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                                    <div className="border-2 border-black bg-yellow-50 px-4 py-3 text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        生成中...
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 py-10">
                                <p>画像が見つかりません</p>
                            </div>
                        )}
                    </div>

                    {(suggestedAnimal || description) && (
                        <div className="mb-4 border-2 border-black bg-yellow-50 px-3 py-2 text-xs text-gray-800 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            {suggestedAnimal && (
                                <p className="font-bold">
                                    見えた動物: {suggestedAnimal}
                                </p>
                            )}

                            {description && (
                                <p className="mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={() => router.push("/camera")}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            📸 もう一度撮る
                        </Button>

                        <Button
                            onClick={() => router.push("/cloud-register")}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            🏠 登録画面へ
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
      </AuthGuard>
    );
}