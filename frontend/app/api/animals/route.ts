import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const query = url.search;

    const response = await fetch(`${API_BASE_URL}/animals${query}`, {
        method: "GET",
        headers: {
            cookie: request.headers.get("cookie") ?? "",
            authorization: request.headers.get("authorization") ?? "",
        },
    });

    const text = await response.text();

    return new NextResponse(text, {
        status: response.status,
        headers: {
            "Content-Type":
                response.headers.get("Content-Type") ?? "application/json",
        },
    });
}

export async function POST(request: NextRequest) {
    const body = await request.text();

    const response = await fetch(`${API_BASE_URL}/animals`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
            authorization: request.headers.get("authorization") ?? "",
        },
        body,
    });

    const text = await response.text();

    return new NextResponse(text, {
        status: response.status,
        headers: {
            "Content-Type":
                response.headers.get("Content-Type") ?? "application/json",
        },
    });
}