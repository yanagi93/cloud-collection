"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "pixel-retroui";

export default function CameraPage() {
    const router = useRouter();

    const [previewUrl, setPreviewUrl] = useState<string>("");

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);

        setPreviewUrl(imageUrl);
    };

    const handleNext = () => {
        router.push("/confirm");
    };

    return (
        <main
            className="
                relative
                min-h-screen
                overflow-hidden
                bg-gradient-to-b
                from-sky-300
                via-sky-200
                to-white
                flex
                items-center
                justify-center
                p-4
                sm:p-6
                md:p-8
            "
        >
            {/* 背景の流れる雲 */}

            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                <div
                    className="
                        absolute
                        bottom-8
                        text-4xl
                        sm:text-6xl
                        md:text-8xl
                        opacity-30
                        cloud-float
                        cloud-slow
                    "
                >
                    ☁️
                </div>

                <div
                    className="
                        absolute
                        bottom-28
                        text-3xl
                        sm:text-5xl
                        md:text-7xl
                        opacity-20
                        cloud-float
                        cloud-medium
                    "
                    style={{
                        animationDelay: "-8s",
                    }}
                >
                    ☁️
                </div>

                <div
                    className="
                        absolute
                        bottom-16
                        text-5xl
                        sm:text-7xl
                        md:text-9xl
                        opacity-10
                        cloud-float
                        cloud-fast
                    "
                    style={{
                        animationDelay: "-15s",
                    }}
                >
                    ☁️
                </div>

            </div>

            {/* メインカード */}

            <Card
                className="
                    w-full
                    max-w-3xl
                    p-4
                    sm:p-6
                    md:p-8
                    backdrop-blur-md
                    shadow-2xl
                    z-10
                "
            >
                <div className="text-center mb-8">

                    <h1
                        className="
                            text-3xl
                            sm:text-4xl
                            md:text-5xl
                            mb-3
                        "
                    >
                        📷 雲を撮影しよう
                    </h1>

                    <p
                        className="
                            text-sm
                            sm:text-base
                            text-gray-600
                        "
                    >
                        空に浮かぶ雲を選んで、
                        AIイラストに変換しよう。
                    </p>

                </div>

                <div className="flex flex-col items-center gap-6">

                    <label
                        htmlFor="image-upload"
                        className="
                            cursor-pointer
                            rounded-xl
                            bg-sky-500
                            px-6
                            py-4
                            text-white
                            shadow-lg
                            hover:bg-sky-600
                            transition
                            text-center
                            w-full
                            sm:w-auto
                        "
                    >
                        雲の写真を選択
                    </label>

                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    {previewUrl ? (
                        <div className="w-full flex justify-center">

                            <img
                                src={previewUrl}
                                alt="cloud preview"
                                className="
                                    w-full
                                    max-w-xl
                                    max-h-[50vh]
                                    object-contain
                                    rounded-2xl
                                    border-4
                                    border-white
                                    shadow-xl
                                "
                            />

                        </div>
                    ) : (
                        <div
                            className="
                                w-full
                                h-[180px]
                                sm:h-[240px]
                                md:h-[300px]
                                border-4
                                border-dashed
                                border-sky-300
                                rounded-2xl
                                flex
                                items-center
                                justify-center
                                text-sky-500
                                text-center
                                px-4
                                bg-white/30
                            "
                        >
                            ここに雲の写真が表示されます
                        </div>
                    )}

                    <div
                        className="
                            flex
                            flex-col
                            sm:flex-row
                            gap-4
                            w-full
                            justify-center
                        "
                    >
                        <Button
                            onClick={() => router.push("/home")}
                        >
                            ← 戻る
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!previewUrl}
                        >
                            次へ →
                        </Button>
                    </div>

                </div>
            </Card>
        </main>
    );
}