"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-100">
      
      <div className="relative">
        
        <Image
          src="/images/title.jpg"
          alt="Pre Cloud Collection"
          width={1300}
          height={700}
          priority
        />

        {/* ゲームスタート → ログイン */}
        <button
          onClick={() => router.push("/login")}
          className="
            absolute
            bottom-[85px]
            left-1/2
            -translate-x-1/2
            rounded-full
            bg-blue-500
            px-8
            py-4
            text-xl
            font-bold
            text-white
            shadow-lg
            transition-all duration-300 hover:scale-105
            shadow-lg hover:shadow-xl
          "
        >
          ゲームスタート
        </button>

        {/* 新規登録 */}
        <button
          onClick={() => router.push("/register")}
          className="
            absolute
            bottom-[20px]
            left-1/2
            -translate-x-1/2
            rounded-full
            bg-yellow-500
            px-8
            py-4
            text-xl
            font-bold
            text-white
            transition-all duration-300 hover:scale-105
            shadow-lg hover:shadow-xl
          "
        >
          新規登録
        </button>
      </div>
    </main>
  );
}