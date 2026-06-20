"use client";

import { useState } from "react";
import { Button, Card, Input, Popup } from "pixel-retroui";
import { useRouter } from "next/navigation";


export default function LoginPage() {
    const [email, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [isErrorOpen, setIsErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();

  const clouds = [
    {
      id: 1,
      top: "10%",
      delay: "0s",
      duration: "25s",
      scale: 1.2,
      opacity: 0.8,
    },
    {
      id: 2,
      top: "25%",
      delay: "-5s",
      duration: "35s",
      scale: 0.8,
      opacity: 0.5,
    },
    {
      id: 3,
      top: "15%",
      delay: "-12s",
      duration: "40s",
      scale: 1.5,
      opacity: 0.6,
    },
    {
      id: 4,
      top: "40%",
      delay: "-3s",
      duration: "30s",
      scale: 0.9,
      opacity: 0.7,
    },
    {
      id: 5,
      top: "30%",
      delay: "-18s",
      duration: "28s",
      scale: 1.1,
      opacity: 0.4,
    },
  ];


 const handleLogin = async (
    e: React.FormEvent
    ) => {
    e.preventDefault();

    if (!email && !password) {
      setErrorMessage(
        "メールアドレスとパスワードを入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    if (email && !password) {
      setErrorMessage(
        "パスワードを入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    if (!email && password) {
      setErrorMessage(
        "メールアドレスを入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    try {
        const response = await fetch(
        "http://localhost:8080/auth/login",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            email,
            password,
            }),
        }
        );

        if (!response.ok) {
        throw new Error("ログイン失敗");
        }

        const data = await response.json();

        console.log(data);

        localStorage.setItem(
        "accessToken",
        data.access_token
        );

        localStorage.setItem(
        "isLoggedIn",
        "true"
        );

        router.push("/home");

    } catch (error) {
        console.error(error);

        setErrorMessage(
        "メールアドレスまたはパスワードが違います"
        );

        setIsErrorOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#E0F6FF] flex items-center justify-center">

      {/* 背景雲 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            className="absolute left-[-200px] w-[200px] h-[60px] bg-white rounded-full animate-drift"
            style={{
              top: cloud.top,
              animationDelay: cloud.delay,
              animationDuration: cloud.duration,
              transform: `scale(${cloud.scale})`,
              opacity: cloud.opacity,
              filter: "blur(4px)",
            }}
          >
            <div className="absolute top-[-30px] left-[30px] w-[90px] h-[90px] bg-white rounded-full" />
            <div className="absolute top-[-40px] left-[80px] w-[70px] h-[70px] bg-white rounded-full" />
          </div>
        ))}
      </div>

      {/* ログインカード */}
      <Card
        bg="#fefcd0"
        className="relative z-10 w-full max-w-md p-8 flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold text-center mb-2">
          ☁ ログイン
        </h1>

        <p className="text-center text-sm mb-6">
          Cloud Collectionへようこそ
        </p>

        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center gap-4 w-full"
        >
          <div className="w-full max-w-sm">
            <p className="mb-2 font-bold text-center">
              メールアドレス
            </p>

            <Input
              value={email}
              bg="#ffffff"
              borderColor="black"
              placeholder="メールアドレスを入力"
              className="w-full"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="w-full max-w-sm">
            <p className="mb-2 font-bold text-center">
              パスワード
            </p>

            <Input
              value={password}
              type="password"
              bg="#ffffff"
              borderColor="black"
              placeholder="パスワードを入力"
              className="w-full"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            bg="#38bdf8"
            textColor="white"
            className="w-full max-w-sm mt-4"
            >
            ログイン
          </Button>
        </form>
          <Button
            bg="#fde68a"
            className="w-full max-w-sm"
            onClick={() => router.push("/register")}
            >
            新規登録はこちら
          </Button>
      </Card>

      {/* エラーポップアップ */}
      <Popup
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        bg="#fefcd0"
        baseBg="#ef4444"
        borderColor="black"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">
            ⚠ 入力エラー
          </h2>

          <p className="mb-4">
            {errorMessage}
          </p>

          <Button onClick={() => setIsErrorOpen(false)}>
            OK
          </Button>
        </div>
      </Popup>

    </div>
  );
}