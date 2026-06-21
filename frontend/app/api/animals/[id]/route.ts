import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

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

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const response = await fetch(`${BACKEND_URL}/animals/${id}`, {
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
        console.error("animal detail proxy error:", error);

        return NextResponse.json(
            { message: "動物詳細の取得中にエラーが発生しました" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const body = await request.text();
        const response = await fetch(`${BACKEND_URL}/animals/${id}`, {
            method: "PATCH",
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
        console.error("animal update proxy error:", error);

        return NextResponse.json(
            { message: "動物情報の更新中にエラーが発生しました" },
            { status: 500 }
        );
    }
}
