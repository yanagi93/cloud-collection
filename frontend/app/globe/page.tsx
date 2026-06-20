"use client";

import { useEffect, useState } from "react";
import CloudGlobe from "../../component/CloudGlobe";
import AuthGuard from "@/component/AuthGuard";
import { Button } from "pixel-retroui";
import { useRouter } from "next/navigation";
import StarField from "@/component/StarField";

type CloudPhoto = {
    id: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
};

type TimelineAnimal = {
    id: string;
    original_image_url?: string | null;
    composite_image_url?: string | null;
    location?: {
        latitude?: number;
        longitude?: number;
    } | null;
};

type TimelinePickupResponse = {
    items?: TimelineAnimal[];
};

const PICKUP_COUNT = 24;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_BASE_URL =
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
        /\/$/,
        ""
    );

function toImageUrl(url?: string | null): string | null {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${IMAGE_BASE_URL}${url}`;
    }

    return `${IMAGE_BASE_URL}/${url}`;
}

function toCloudPhoto(animal: TimelineAnimal): CloudPhoto | null {
    const imageUrl = toImageUrl(
        animal.composite_image_url ?? animal.original_image_url
    );

    if (!imageUrl) return null;

    return {
        id: animal.id,
        imageUrl,
        latitude: animal.location?.latitude,
        longitude: animal.location?.longitude,
    };
}

export default function GlobePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<CloudPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      return;
    }

    const controller = new AbortController();

    const fetchPickup = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const createdTo = new Date();
      const createdFrom = new Date(createdTo.getTime() - ONE_WEEK_MS);
      const params = new URLSearchParams({
        created_from: createdFrom.toISOString(),
        created_to: createdTo.toISOString(),
        count: String(PICKUP_COUNT),
      });

      try {
        const response = await fetch(`/api/timeline/pickup?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("timeline pickup request failed");
        }

        const data = (await response.json()) as TimelinePickupResponse;
        const pickedPhotos = (data.items ?? [])
          .map(toCloudPhoto)
          .filter((photo): photo is CloudPhoto => photo !== null);

        setPhotos(pickedPhotos);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("timeline pickup error:", error);
        setErrorMessage("対戦相手の取得に失敗しました");
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPickup();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <AuthGuard>
      <main className="relative min-h-screen overflow-hidden px-4 py-6 bg-gradient-to-b from-black via-slate-900 to-blue-950">

        <StarField />
        
        {/* タイトルエリア */}
        <div className="mx-auto flex min-h-[90vh] max-w-5xl flex-col items-center justify-center relative z-10">
          
          <h1 className="mb-2 text-center text-2xl font-bold text-white">
            雲の地球儀
          </h1>

                {isLoading ? (
                    <p className="mb-4 text-center text-sm font-bold">
                        対戦相手を探しています...
                    </p>
                ) : errorMessage ? (
                    <p className="mb-4 text-center text-sm font-bold text-red-600">
                        {errorMessage}
                    </p>
                ) : photos.length === 0 ? (
                    <p className="mb-4 text-center text-sm font-bold">
                        過去一週間に追加された対戦相手が見つかりません
                    </p>
                ) : null}

                <CloudGlobe photos={photos} />
            </div>

            {/* 戻るボタン */}
            <div className="flex justify-center mt-12">
                <Button
                  onClick={() => router.push("/home")}
                  className="font-minecraft"
                >
                  🏠 ホームへ戻る
                </Button>
            </div>
        </main>
      </AuthGuard>
    );
}
