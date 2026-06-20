"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function ResultPage() {
    const router = useRouter();
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    useEffect(() => {
        const savedImage = sessionStorage.getItem("selectedCloudImage");

        if (!savedImage) {
            router.replace("/camera");
            return;
        }

        setImgSrc(savedImage);
    }, [router]);

    return (
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

                    <p className="text-xs text-gray-500 mb-6">
                        AIイラスト生成結果を表示する画面
                    </p>

                    <div className="border-4 border-black bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt="元の雲写真"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-sm text-gray-400 py-10">
                                <p>画像が見つかりません</p>
                            </div>
                        )}
                    </div>

                    <div className="border-4 border-black bg-yellow-50 rounded-lg min-h-40 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-gray-700">
                            <p className="font-bold mb-2">ここにAI生成画像を表示予定</p>
                            <p className="text-xs">バックエンド接続後に差し替え</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={() => router.push("/camera")}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            📸 もう一度撮る
                        </Button>

                        <Button
                            onClick={() => router.push("/home")}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            🏠 ホームへ
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
    );
}