"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from 'react';
import { Button } from 'pixel-retroui';

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
            color="blue"
            onClick={() => router.push("/login")}
          />
        </div>
        {/* ゲームスタート → 新規登録 */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
          <Button onClick={() => router.push("/register")}>
            新規登録
          </Button>
        </div>
      </div>
    </main>
  );
}