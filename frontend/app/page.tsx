"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "@/component/Button";

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
        <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2">
          <Button
            text="ゲームスタート"
            color="blue"
            onClick={() => router.push("/login")}
          />
        </div>
        {/* ゲームスタート → 新規登録 */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
          <Button
            text="新規登録"
            color="yellow"
            onClick={() => router.push("/register")}
          />
        </div>
      </div>
    </main>
  );
}