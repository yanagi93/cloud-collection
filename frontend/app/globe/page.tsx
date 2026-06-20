import CloudGlobe from "../../component/CloudGlobe";
import AuthGuard from "@/component/AuthGuard";

type CloudPhoto = {
    id: string;
    imageUrl: string;
    latitude?: number;
    longitude?: number;
};

const samplePhotos: CloudPhoto[] = [
    {
        id: "cloud-1",
        imageUrl: "/sample-cloud-1.jpg",
    },
    {
        id: "cloud-2",
        imageUrl: "/sample-cloud-2.jpg",
    },
];

export default function GlobePage() {
    return (
      <AuthGuard>
        <main className="min-h-screen overflow-hidden bg-sky-100 px-4 py-6">
            <div className="mx-auto flex min-h-[90vh] max-w-5xl flex-col items-center justify-center">
                <h1 className="mb-2 text-center text-2xl font-bold">
                    雲の地球儀
                </h1>

                <p className="mb-4 text-center text-sm">
                    地球に現れた雲たちの中から、次の対戦相手を選ぼう。
                </p>

                <CloudGlobe photos={samplePhotos} />
            </div>
        </main>
      </AuthGuard>
    );
}