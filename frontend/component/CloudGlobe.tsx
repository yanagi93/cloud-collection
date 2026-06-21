"use client";

import createGlobe from "cobe";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CloudPhoto = {
    id: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
};

type Props = {
    photos: CloudPhoto[];
};

type AnchorStyle = CSSProperties & {
    positionAnchor?: string;
};

function createSeedFromString(text: string) {
    let seed = 0;

    for (let i = 0; i < text.length; i += 1) {
        seed = (seed * 31 + text.charCodeAt(i)) % 100000;
    }

    return seed;
}

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function createRandomLocation(id: string, index: number): [number, number] {
    const seed = createSeedFromString(id) + index * 97;

    const latitude = -55 + seededRandom(seed) * 110;
    const longitude = -180 + seededRandom(seed + 33) * 360;

    return [latitude, longitude];
}

export default function CloudGlobe({ photos }: Props) {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const phiRef = useRef(0);
    const thetaRef = useRef(0.2);

    const isDraggingRef = useRef(false);
    const lastXRef = useRef(0);
    const lastYRef = useRef(0);

    const [selectedPhoto, setSelectedPhoto] = useState<CloudPhoto | null>(null);

    const markers = useMemo(() => {
        return photos.map((photo, index) => {
            const location =
                photo.latitude !== undefined && photo.longitude !== undefined
                    ? ([photo.latitude, photo.longitude] as [number, number])
                    : createRandomLocation(photo.id, index);

            return {
                id: photo.id,
                imageUrl: photo.imageUrl,
                location,
            };
        });
    }, [photos]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId: number;
        const globeSpeed = 0.0016;

        const globe = createGlobe(canvas, {
            devicePixelRatio: 2,
            width: 900,
            height: 900,
            phi: phiRef.current,
            theta: thetaRef.current,
            dark: 0,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.95, 0.98, 1],
            markerColor: [0.2, 0.5, 1],
            glowColor: [0.7, 0.9, 1],

            markers: markers.map((marker) => ({
                id: marker.id,
                location: marker.location,
                size: 0.035,
            })),

            arcs: [],
            scale: 1,
            offset: [190, 0],
        });

        const animate = () => {
            if (!isDraggingRef.current) {
                phiRef.current += globeSpeed;
            }

            globe.update({
                phi: phiRef.current,
                theta: thetaRef.current,
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            globe.destroy();
        };
    }, [markers]);

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        isDraggingRef.current = true;
        lastXRef.current = event.clientX;
        lastYRef.current = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDraggingRef.current) return;

        const deltaX = event.clientX - lastXRef.current;
        const deltaY = event.clientY - lastYRef.current;

        phiRef.current += deltaX * 0.006;

        thetaRef.current = Math.max(
            -0.8,
            Math.min(0.8, thetaRef.current + deltaY * 0.003)
        );

        lastXRef.current = event.clientX;
        lastYRef.current = event.clientY;
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
        isDraggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    return (
        <div className="flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden">
            <div className="relative mx-auto flex h-[520px] w-[520px] max-w-[94vw] items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={900}
                    height={900}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="z-10 touch-none cursor-grab active:cursor-grabbing"
                    style={{
                        width: "min(78vw, 420px)",
                        height: "min(78vw, 420px)",
                        aspectRatio: "1 / 1",
                    }}
                />

                {markers.map((marker, index) => {
                    const photo = photos.find((item) => item.id === marker.id);

                    const tilt =
                        index % 3 === 0 ? "-8deg" : index % 3 === 1 ? "6deg" : "-3deg";

                    const isSelected = selectedPhoto?.id === marker.id;

                    return (
                        <button
                            key={marker.id}
                            type="button"
                            onClick={() => {
                                if (photo) {
                                    setSelectedPhoto(photo);
                                }
                            }}
                            className={`absolute z-20 w-20 border-2 border-black bg-white p-1.5 pb-5 shadow-[3px_3px_0px_#000] transition hover:scale-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                                isSelected ? "ring-4 ring-sky-400" : ""
                            }`}
                            style={
                                {
                                    positionAnchor: `--cobe-${marker.id}`,
                                    left: "anchor(center)",
                                    top: "anchor(center)",
                                    translate: "-50% -50%",
                                    rotate: tilt,
                                    opacity: `var(--cobe-visible-${marker.id}, 0)`,
                                } as AnchorStyle
                            }
                        >
                            <div className="aspect-square w-full overflow-hidden border-2 border-black bg-sky-100">
                                <img
                                    src={marker.imageUrl}
                                    alt="雲の写真"
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <p className="absolute bottom-1 left-0 w-full text-center text-[8px] font-bold tracking-wider text-black">
                                ENEMY-{String(index + 1).padStart(2, "0")}
                            </p>
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-center text-xs text-white/80">
                地球をドラッグで回転できます
            </p>

            {selectedPhoto ? (
                <div className="mt-5 w-full max-w-sm rounded border-2 border-black bg-white p-4 shadow-[6px_6px_0px_#000]">
                    <div className="mb-4 border-2 border-black bg-white p-3 pb-8 shadow-[5px_5px_0px_#000]">
                        <div className="mx-auto aspect-square w-full max-w-72 overflow-hidden border-2 border-black bg-sky-100">
                            <img
                                src={selectedPhoto.imageUrl}
                                alt="選択した対戦相手の雲"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <p className="mt-2 text-center text-xs font-bold tracking-wider text-black">
                            SELECTED ENEMY
                        </p>
                    </div>

                    <p className="mb-3 text-sm font-bold text-white">
                        この雲と戦いますか？
                    </p>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedPhoto(null)}
                            className="w-1/2 rounded border-2 border-black bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            選び直す
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/battle?defenderId=${selectedPhoto.id}`
                                )
                            }
                            className="w-1/2 rounded border-2 border-black bg-sky-200 px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            バトル開始！
                        </button>
                    </div>
                </div>
            ) : (
                <p className="mt-5 text-center text-sm font-bold text-white">
                    戦う相手の雲を選んでください
                </p>
            )}
        </div>
    );
}
