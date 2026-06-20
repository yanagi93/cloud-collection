"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";
import AuthGuard from "@/component/AuthGuard";

type UploadResult = {
    id?: string;
    original_image_url?: string;
    status?: string;
    processing?: unknown;
    [key: string]: unknown;
};

function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";

    const binary = atob(base64);
    const array = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }

    return new File([array], filename, { type: mime });
}

export default function ConfirmPage() {
    const router = useRouter();

    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

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

    const handleNext = async () => {
        if (!imgSrc || isUploading) return;

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setMessage("ログインが必要です。ログイン画面に移動します。");
            router.push("/login");
            return;
        }

        try {
            setIsUploading(true);
            setMessage("画像をアップロード中...");

            const file = dataUrlToFile(imgSrc, "cloud-photo.png");

            const formData = new FormData();
            formData.append("image", file);
            formData.append("auto_process", "true");

            const response = await fetch("/api/cloud-photos", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
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
                console.error("upload failed:", data);

                if (response.status === 401) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("isLoggedIn");
                    setMessage("ログイン期限が切れています。もう一度ログインしてください。");
                    router.push("/login");
                    return;
                }

                setMessage(data.message ?? "アップロードに失敗しました。");
                return;
            }

            const uploadResult = data as UploadResult;

            sessionStorage.setItem("uploadedCloudPhoto", JSON.stringify(uploadResult));
            setMessage("アップロード成功！");

            router.push("/result");
        } catch (error) {
            console.error(error);
            setMessage("通信エラーです。バックエンドが起動しているか確認してください。");
        } finally {
            setIsUploading(false);
        }
    };

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
                        📸 写真の確認
                    </h1>

                    <p className="text-xs text-gray-500 mb-6">
                        この雲の写真からAIイラストを作ってもいい？
                    </p>

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

                    {message && (
                        <div className="mb-4 border-2 border-black bg-sky-50 px-3 py-2 text-xs text-gray-800 text-left">
                            {message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full">
                        <Button
                            onClick={handleRetry}
                            disabled={isUploading}
                            className="h-16 flex items-center justify-center bg-white text-black font-bold text-lg"
                        >
                            ↩ 撮りなおす
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!imgSrc || isUploading}
                            className={`h-16 flex items-center justify-center bg-white text-black font-bold text-lg ${!imgSrc || isUploading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            {isUploading ? "送信中..." : "✨ これで決定！"}
                        </Button>
                    </div>
                </Card>
            </div>
        </main>
      </AuthGuard>
    );
}