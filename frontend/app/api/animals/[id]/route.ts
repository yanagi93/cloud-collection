import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(request: NextRequest, { params }: Params) {
    const { id } = await params;

    const response = await fetch(`${API_BASE_URL}/animals/${id}`, {
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

export async function PATCH(request: NextRequest, { params }: Params) {
    const { id } = await params;
    const body = await request.text();

    const response = await fetch(`${API_BASE_URL}/animals/${id}`, {
        method: "PATCH",
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

export async function DELETE(request: NextRequest, { params }: Params) {
    const { id } = await params;

    const response = await fetch(`${API_BASE_URL}/animals/${id}`, {
        method: "DELETE",
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