"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function Globe() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let phi = 0;
        let animationFrameId: number;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0.2,
            dark: 0,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [1, 1, 1],
            markerColor: [0.2, 0.4, 1],
            glowColor: [1, 1, 1],

            markers: [
                {
                    location: [35.68, 139.65],
                    size: 0.04,
                    id: "tokyo",
                },
                {
                    location: [37.78, -122.44],
                    size: 0.03,
                    id: "sf",
                },
                {
                    location: [40.71, -74.01],
                    size: 0.03,
                    id: "nyc",
                },
            ],

            arcs: [
                {
                    from: [35.68, 139.65],
                    to: [37.78, -122.44],
                },
            ],

            arcColor: [0.3, 0.5, 1],
            arcWidth: 0.5,
            arcHeight: 0.3,
        });

        const animate = () => {
            phi += 0.005;
            globe.update({ phi });
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            globe.destroy();
        };
    }, []);

    return (
        <div className="flex justify-center items-center">
            <canvas
                ref={canvasRef}
                width={1200}
                height={1200}
                style={{
                    width: "600px",
                    height: "600px",
                    maxWidth: "100%",
                    aspectRatio: "1 / 1",
                }}
            />
        </div>
    );
}