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

export async function GET(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const response = await fetch(`${BACKEND_URL}/animals${url.search}`, {
            method: "GET",
            headers: {
                Authorization: authorization,
            },
            cache: "no-store",
        });

        const data = await parseResponse(response);

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error("animal list proxy error:", error);

        return NextResponse.json(
            { message: "動物一覧の取得中にエラーが発生しました" },
            { status: 500 }
        );
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
        const response = await fetch(`${BACKEND_URL}/animals`, {
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
        console.error("animal registration proxy error:", error);

        return NextResponse.json(
            { message: "動物登録中にエラーが発生しました" },
            { status: 500 }
        );
    }
}
