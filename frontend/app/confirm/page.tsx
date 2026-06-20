"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function ConfirmPage() {
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

    const handleRetry = () => {
        router.push("/camera");
    };

    const handleNext = () => {
        router.push("/home");
    };

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
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">📸 写真の確認</h1>
                    <p className="text-xs text-gray-500 mb-6">この雲の写真からAIイラストを作ってもいい？</p>

                    <div className="border-4 border-black bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt="撮影された雲"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-sm text-gray-400 py-10">
                                <p>あれれ？写真が見つからないよ</p>
                                <p className="text-xs mt-1">カメラ画面から撮り直してみてね</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3-translate-x-100">
                        <Button
                            onClick={handleRetry}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            ↩ 撮りなおす
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!imgSrc}
                            className={`h-16 flex items-center justify-center bg-white text-black font-bold text-lg ${!imgSrc ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            ✨ これで決定！
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
    );
}