import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

async function parseResponse(response: Response) {
    const responseText = await response.text();

    try {
        return responseText ? JSON.parse(responseText) : {};
    } catch {
        return {
            message:
                responseText ||
                "バックエンドからJSONではないレスポンスが返ってきました",
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const body = await request.text();
        const response = await fetch(`${BACKEND_URL}/battles`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authorization,
            },
            body,
        });

        const data = await parseResponse(response);

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("battle proxy error:", error);

        return NextResponse.json(
            { message: "バトルの実行中にエラーが発生しました" },
            { status: 500 }
        );
    }
}
