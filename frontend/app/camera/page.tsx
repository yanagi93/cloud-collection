"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { Button, Card } from "pixel-retroui";

export default function CameraPage() {
    const router = useRouter();

    const webcamRef = useRef<Webcam>(null);

    const [capturedImage, setCapturedImage] =
        useState<string | null>(null);

    const capture = () => {
        const imageSrc =
            webcamRef.current?.getScreenshot();

        if (imageSrc) {
            setCapturedImage(imageSrc);
        }
    };

    const handleImageSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        const imageUrl =
            URL.createObjectURL(file);

        setCapturedImage(imageUrl);
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleNext = () => {
        if (!capturedImage) return;

        sessionStorage.setItem(
            "selectedCloudImage",
            capturedImage
        );

        router.push("/confirm");
    };

    return (
        <main
            className="
                min-h-screen
                bg-gradient-to-b
                from-sky-300
                via-sky-200
                to-white
                flex
                justify-center
                items-center
                p-4
            "
        >
            <Card
                className="
                    w-full
                    max-w-4xl
                    p-6
                "
            >
                <div className="text-center mb-8">

                    <h1
                        className="
                            text-4xl
                            font-bold
                            mb-3
                        "
                    >
                        ☁️ 雲を撮影しよう
                    </h1>

                    <p>
                        カメラ撮影または
                        画像アップロード
                    </p>

                </div>

                <div
                    className="
                        flex
                        flex-col
                        items-center
                        gap-6
                    "
                >
                    {!capturedImage ? (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: {
                                        ideal:
                                            "environment",
                                    },
                                }}
                                className="
                                    w-full
                                    max-w-2xl
                                    rounded-xl
                                    border-4
                                    border-white
                                    shadow-xl
                                "
                            />

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    justify-center
                                    gap-4
                                "
                            >
                                <Button
                                    onClick={
                                        capture
                                    }
                                >
                                    📸 撮影する
                                </Button>

                                <label
                                    htmlFor="image-upload"
                                    className="
                                        px-6
                                        py-3
                                        rounded-lg
                                        bg-sky-500
                                        text-white
                                        cursor-pointer
                                    "
                                >
                                    🖼️
                                    画像を選択
                                </label>

                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleImageSelect
                                    }
                                    className="hidden"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <img
                                src={
                                    capturedImage
                                }
                                alt="preview"
                                className="
                                    w-full
                                    max-w-2xl
                                    rounded-xl
                                    border-4
                                    border-white
                                    shadow-xl
                                "
                            />

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    justify-center
                                    gap-4
                                "
                            >
                                <Button
                                    onClick={
                                        handleRetake
                                    }
                                >
                                    🔄 撮り直し
                                </Button>

                                <Button
                                    onClick={
                                        handleNext
                                    }
                                >
                                    次へ →
                                </Button>
                            </div>
                        </>
                    )}

                    <Button
                        onClick={() =>
                            router.push(
                                "/home"
                            )
                        }
                    >
                        ← ホームへ戻る
                    </Button>
                </div>
            </Card>
        </main>
    );
}