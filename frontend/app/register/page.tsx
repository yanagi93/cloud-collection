"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    //メールアドレス確認
    if (!emailRegex.test(email)) {
        alert("メールアドレスが正しくありません");
    } else {
        //パスワード確認
        if (!passwordRegex.test(password)) {
            alert("パスワードは8文字以上で英数字を含めてください");
        } else {
            //成功、未入力確認
            if (name && email && password) {
                alert("登録成功（仮）");
                router.push("/login"); // or "/"
            } else {
                alert("全て入力してください");
            }
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-white">

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-[350px]">

        <h1 className="text-3xl font-bold text-center mb-2">
          新規登録
        </h1>

        <p className="text-center text-gray-500 mb-6">
          雲コレクションを始めよう
        </p>

        {/* ユーザー名 */}
        <input
          type="text"
          placeholder="ユーザー名"
          className="w-full p-3 mb-3 border rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* メール */}
        <input
          type="email"
          placeholder="メールアドレス"
          className="w-full p-3 mb-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* パスワード */}
        <input
          type="password"
          placeholder="パスワード"
          className="w-full p-3 mb-6 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ボタン */}
        <button
          onClick={handleRegister}
          className="
            w-full
            bg-yellow-500
            hover:bg-yellow-600
            text-white
            py-3
            rounded-lg
            font-bold
            shadow-md
            transition-all
            duration-300
            hover:scale-105
          "
        >
          登録する
        </button>

      </div>
    </div>
  );
}
