import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

type RouteContext = {
    params: Promise<{
        photoId: string;
    }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { photoId } = await context.params;
        const authorization = request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                { message: "Authorization header is required" },
                { status: 401 }
            );
        }

        const response = await fetch(`${BACKEND_URL}/cloud-photos/${photoId}/process`, {
            method: "GET",
            headers: {
                Authorization: authorization,
            },
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
        console.error("process status proxy error:", error);

        return NextResponse.json(
            { message: "生成状態の取得中にエラーが発生しました" },
            { status: 500 }
        );
    }
}