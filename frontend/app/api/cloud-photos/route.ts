import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const formData = await request.formData();

        const response = await fetch(`${BACKEND_URL}/cloud-photos`, {
            method: "POST",
            headers: {
                Authorization: authorization,
            },
            body: formData,
        });

        const responseText = await response.text();

        let data: unknown = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = {
                message:
                    responseText ||
                    "バックエンドからJSONではないレスポンスが返ってきました",
            };
        }

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("cloud photo upload proxy error:", error);

        return NextResponse.json(
            { message: "画像アップロード中にエラーが発生しました" },
            { status: 500 }
        );
    }
}