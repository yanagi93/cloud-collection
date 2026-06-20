import type {
    Animal,
    AnimalListResponse,
    CreateAnimalRequest,
} from "@/types/animal";

async function apiFetch<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "API request failed");
    }

    return response.json();
}

export async function createAnimal(
    data: CreateAnimalRequest
): Promise<Animal> {
    return apiFetch<Animal>("/api/animals", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getAnimals(): Promise<AnimalListResponse> {
    return apiFetch<AnimalListResponse>(
        "/api/animals?page=1&page_size=100&sort=created_at_desc"
    );
}

export async function getAnimalById(id: string): Promise<Animal> {
    return apiFetch<Animal>(`/api/animals/${id}`);
}

export async function updateAnimalName(
    id: string,
    name: string
): Promise<Animal> {
    return apiFetch<Animal>(`/api/animals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    });
}

export async function deleteAnimal(id: string): Promise<void> {
    const response = await fetch(`/api/animals/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "API request failed");
    }
}