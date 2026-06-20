export type PendingAnimal = {
    photoId: string;
    originalImageUrl: string;
    compositeImageUrl: string;
    suggestedAnimal: string;
    confidence: number;
    description?: string;
};

export type Animal = {
    id: string;
    userId: string;
    photoId: string;
    name: string;
    species: string;
    originalImageUrl?: string;
    compositeImageUrl: string;
    confidence?: number;
    description?: string;
    capturedAt?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    createdAt: string;
    updatedAt?: string;
};

export type CreateAnimalRequest = {
    photoId: string;
    name: string;
    useSuggestedAnimal: boolean;
    species?: string;
    hp: number;
    attack: number;
    evasion: number;
    defense: number;
};

export type AnimalListResponse = {
    items: Animal[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
};
