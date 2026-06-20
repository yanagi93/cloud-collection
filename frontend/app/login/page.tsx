'use client';

import React from 'react';

export default function LoginPage() {
    // 雲のデータを定義（初期位置、アニメーションの遅延、速度、大きさ、透明度）
    const clouds = [
        { id: 1, top: '10%', delay: '0s', duration: '25s', scale: 1.2, opacity: 0.8 },
        { id: 2, top: '25%', delay: '-5s', duration: '35s', scale: 0.8, opacity: 0.5 },
        { id: 3, top: '15%', delay: '-12s', duration: '40s', scale: 1.5, opacity: 0.6 },
        { id: 4, top: '40%', delay: '-3s', duration: '30s', scale: 0.9, opacity: 0.7 },
        { id: 5, top: '30%', delay: '-18s', duration: '28s', scale: 1.1, opacity: 0.4 },
    ];

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#E0F6FF] flex items-center justify-center">

            {/* ☁️ 背景層：漂う雲のアニメーション */}
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
                            filter: 'blur(4px)', // 少しぼかしてふんわりさせる
                        }}
                    >
                        {/* 雲のモコモコ感を出すための装飾円 */}
                        <div className="absolute top-[-30px] left-[30px] w-[90px] h-[90px] bg-white rounded-full"></div>
                        <div className="absolute top-[-40px] left-[80px] w-[70px] h-[70px] bg-white rounded-full"></div>
                    </div>
                ))}
            </div>

            {/* 🔐 前面層：ログインフォームの土台 */}
            {/* ⚠️ 友達がUIを作ったら、この中の要素（divやinputなど）を友達のコンポーネントと差し替えます */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mx-4">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">ログイン</h2>

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">ユーザー名</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/90"
                            placeholder="Username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">パスワード</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/90"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
                    >
                        ログイン
                    </button>
                </form>
            </div>

        </div>
    );
}