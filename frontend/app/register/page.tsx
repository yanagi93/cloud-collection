"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Input,
  Button,
  Popup,
} from "pixel-retroui";

export default function RegisterPage() {
  const router = useRouter();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [isErrorOpen, setIsErrorOpen] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleRegister = async () => {
    // 未入力チェック
    if (!name && !email && !password) {
      setErrorMessage(
        "全て入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    if (!name) {
      setErrorMessage(
        "ユーザー名を入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    if (!email) {
      setErrorMessage(
        "メールアドレスを入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    if (!password) {
      setErrorMessage(
        "パスワードを入力してください"
      );
      setIsErrorOpen(true);
      return;
    }

    // メール形式チェック
    if (!emailRegex.test(email)) {
      setErrorMessage(
        "メールアドレスの形式が正しくありません"
      );
      setIsErrorOpen(true);
      return;
    }

    // パスワード形式チェック
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        "パスワードは8文字以上で英数字を含めてください"
      );
      setIsErrorOpen(true);
      return;
    }

    try {
      const response = await fetch(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            display_name: name,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message ??
            "登録に失敗しました"
        );
        setIsErrorOpen(true);
        return;
      }

      // 登録成功後

      const loginResponse = await fetch(
        "/api/login",
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

      if (!loginResponse.ok) {
        setErrorMessage(
          "登録は成功しましたがログインに失敗しました"
        );
        setIsErrorOpen(true);
        return;
      }

      const loginData = await loginResponse.json();

      localStorage.setItem(
        "accessToken",
        loginData.access_token
      );

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      router.push("/home");
    } catch (error) {
      console.error(error);
      
      setErrorMessage(
        "サーバーに接続できませんでした"
      );
      setIsErrorOpen(true);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gradient-to-b
        from-sky-200
        to-white
        px-4
      "
    >
      {/* 流れる雲 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">

        <div
          className="absolute top-92 animate-cloud-slow text-[10rem] opacity-80"
          style={{ animationDelay: "-7s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-128 animate-cloud-slow text-[11rem] opacity-80"
          style={{ animationDelay: "-15s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-12 animate-cloud-slow text-[13rem] opacity-80"
          style={{ animationDelay: "-10s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-32 animate-cloud-medium text-[9rem] opacity-80"
          style={{ animationDelay: "-20s" }}
        >
          ☁️
        </div>

        <div
          className="absolute top-64 animate-cloud-fast text-[12rem] opacity-80"
          style={{ animationDelay: "-5s" }}
        >
          ☁️
        </div>

      </div>

      <Card
        bg="#f9e191"
        className="
          w-full z-20
          max-w-md
          p-8
          flex
          flex-col
          items-center
        "
      >
        <h1
          className="
            text-3xl
            font-bold
            mb-2
            z-30
          "
        >
          ☁ 新規登録
        </h1>

        <p
          className="
            text-sm
            text-center
            mb-6
            z-30
          "
        >
          Cloud Collectionを始めよう
        </p>

        <div
          className="
            flex
            flex-col
            gap-4
            z-30
          "
        >
          {/* ユーザー名 */}
          <div>
            <p
              className="
                font-bold
                text-center
                mb-2
                z-30
              "
            >
              ユーザー名
            </p>

            <Input
              bg="#ffffff"
              borderColor="black"
              placeholder="ユーザー名を入力"
              className="w-full"
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

          {/* メールアドレス */}
          <div>
            <p
              className="
                font-bold
                text-center
                mb-2
                z-30
              "
            >
              メールアドレス
            </p>

            <Input
              bg="#ffffff"
              borderColor="black"
              placeholder="メールアドレスを入力"
              className="w-full"
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </div>

          {/* パスワード */}
          <div>
            <p
              className="
                font-bold
                text-center
                mb-2
                z-30
              "
            >
              パスワード
            </p>

            <Input
              type="password"
              bg="#ffffff"
              borderColor="black"
              placeholder="パスワードを入力"
              className="w-full"
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />
          </div>

          <Button
            bg="#f59e0b"
            textColor="white"
            className="mt-4"
            onClick={handleRegister}
          >
            登録する
          </Button>

          <Button
            bg="#38bdf8"
            textColor="white"
            onClick={() =>
              router.push("/login")
            }
          >
            ログインはこちら
          </Button>
        </div>
      </Card>

      {/* エラーポップアップ */}
      <Popup
        isOpen={isErrorOpen}
        onClose={() =>
          setIsErrorOpen(false)
        }
        bg="#fefcd0"
        baseBg="#ef4444"
        borderColor="black"
      >
        <div className="text-center">
          <h2
            className="
              text-xl
              font-bold
              mb-4
            "
          >
            ⚠ 登録エラー
          </h2>

          <p className="mb-4">
            {errorMessage}
          </p>

          <Button
            onClick={() =>
              setIsErrorOpen(false)
            }
          >
            OK
          </Button>
        </div>
      </Popup>
    </div>
  );
}
