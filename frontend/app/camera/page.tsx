"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import Cropper from "react-easy-crop";
import { Button, Card } from "pixel-retroui";

type CroppedAreaPixels = {
    x: number;
    y: number;
    width: number;
    height: number;
};

// --- 画像切り取り用の補助関数 ---
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: CroppedAreaPixels
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Canvas context is not available");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg");
}

export default function CameraPage() {
    const router = useRouter();
    const webcamRef = useRef<Webcam>(null);

    // 撮影・アップロードされた直後の画像
    const [rawImage, setRawImage] = useState<string | null>(null);

    // 切り取りが終わった最終画像
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Cropper用の状態
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] =
        useState<CroppedAreaPixels | null>(null);

    const capture = () => {
        const imageSrc = webcamRef.current?.getScreenshot();

        if (imageSrc) {
            setRawImage(imageSrc);
            setCapturedImage(null);
        }
    };

    const handleImageSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setRawImage(imageUrl);
        setCapturedImage(null);
    };

    const onCropComplete = useCallback(
        (_croppedArea: unknown, croppedAreaPixels: CroppedAreaPixels) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleCropImage = async () => {
        if (!rawImage || !croppedAreaPixels) return;

        try {
            const croppedImageBase64 = await getCroppedImg(
                rawImage,
                croppedAreaPixels
            );

            setCapturedImage(croppedImageBase64);
            setRawImage(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRetake = () => {
        setRawImage(null);
        setCapturedImage(null);
        setCroppedAreaPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleNext = () => {
        if (!capturedImage) return;

        sessionStorage.setItem("selectedCloudImage", capturedImage);
        router.push("/confirm");
    };

    return (
        <main className="h-dvh bg-gradient-to-b from-sky-300 via-sky-200 to-white flex justify-center items-center p-3 overflow-hidden">
            <Card
                className="w-full max-w-2xl max-h-[calc(100dvh-24px)] p-4 bg-white overflow-hidden"
                borderColor="#000000"
                shadowColor="#222222"               
            >
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold mb-1 text-gray-800">
                        ☁️ 雲を撮影しよう
                    </h1>
                    <p className="text-sm text-gray-600">
                        お気に入りの雲を見つけてね
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    {/* ========== 状態1：カメラ起動＆アップロード待ち ========== */}
                    {!rawImage && !capturedImage && (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: { ideal: "environment" },
                                    aspectRatio: 1,
                                }}
                                className="w-[min(82vw,50dvh,420px)] aspect-square rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover"
                            />

                            <div className="flex flex-wrap justify-center gap-3 mt-1">
                                <Button
                                    onClick={capture}
                                    className="bg-sky-500 text-white font-bold text-base py-2 px-5"
                                >
                                    📸 撮影する
                                </Button>

                                <Button
                                    className="bg-green-400 text-black font-bold"
                                    onClick={() =>
                                        document.getElementById("image-upload")?.click()
                                    }
                                >
                                    🖼️ 画像を選択
                                </Button>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>
                        </>
                    )}

                    {/* ========== 状態2：画像の切り取り画面 ========== */}
                    {rawImage && !capturedImage && (
                        <>
                            <p className="text-sm font-bold text-gray-700">
                                スワイプして正方形に切り取ってね！
                            </p>

                            <div className="relative w-[min(82vw,50dvh,420px)] aspect-square bg-gray-900 rounded-xl overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Cropper
                                    image={rawImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>

                            <div className="flex justify-center gap-3 w-[min(82vw,50dvh,420px)]">
                                <Button
                                    onClick={handleRetake}
                                    className="bg-gray-400 text-white font-bold w-1/2 text-base py-2"
                                >
                                    ↩ やめる
                                </Button>

                                <Button
                                    onClick={handleCropImage}
                                    className="bg-yellow-400 text-black font-bold w-1/2 text-base py-2"
                                >
                                    ✂️ 切り取る
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ========== 状態3：切り取り完了後のプレビュー画面 ========== */}
                    {capturedImage && (
                        <>
                            <img
                                src={capturedImage}
                                alt="preview"
                                className="w-[min(82vw,50dvh,420px)] aspect-square rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover"
                            />

                            <div className="flex flex-wrap justify-center gap-3 mt-1">
                                <Button
                                    onClick={handleRetake}
                                    className="bg-red-500 text-white font-bold text-base py-2 px-5"
                                >
                                    🔄 撮り直し
                                </Button>

                                <Button
                                    onClick={handleNext}
                                    className="bg-blue-600 text-white font-bold text-base py-2 px-5"
                                >
                                    次へ →
                                </Button>
                            </div>
                        </>
                    )}

                    <div className="mt-1">
                        <Button
                            onClick={() => router.push("/home")}
                            className="bg-white text-black text-xs py-1 px-3"
                        >
                            ← ホームへ戻る
                        </Button>
                    </div>
                </div>
            </Card>
        </main>
    );
}