// src/mocks/data/ai.ts
export const mockAIModels = [
    {
        id: 1,
        name: 'GPT Translator',
        api_endpoint: 'https://api.openai.com/v1/translate',
        response_path: 'translated_text',
        is_active: true
    },
    {
        id: 2,
        name: 'Claude Translator',
        api_endpoint: 'https://api.anthropic.com/v1/translate',
        response_path: 'data.translation',
        is_active: true
    },
    {
        id: 3,
        name: 'DeepL API',
        api_endpoint: 'https://api-free.deepl.com/v2/translate',
        response_path: 'translations[0].text',
        is_active: false
    }
];

export const mockTranslationJobs = [
    {
        id: 1,
        manga_title: 'هجوم العمالقة',
        chapter_number: '1',
        status: 'completed',
        progress: 100,
        created_at: '2024-12-20T10:00:00Z',
        completed_at: '2024-12-20T10:15:00Z',
        model: mockAIModels[0]
    },
    {
        id: 2,
        manga_title: 'ون بيس',
        chapter_number: '1',
        status: 'processing',
        progress: 65,
        created_at: '2024-12-25T14:00:00Z',
        completed_at: null,
        model: mockAIModels[1]
    },
    {
        id: 3,
        manga_title: 'سولو ليفلينغ',
        chapter_number: '1',
        status: 'pending',
        progress: 0,
        created_at: '2024-12-26T08:00:00Z',
        completed_at: null,
        model: mockAIModels[0]
    },
    {
        id: 4,
        manga_title: 'ناروتو',
        chapter_number: '5',
        status: 'failed',
        progress: 30,
        created_at: '2024-12-24T12:00:00Z',
        completed_at: null,
        model: mockAIModels[2],
        error: 'API key expired'
    }
];

export function getAIModels() {
    return {
        results: mockAIModels
    };
}

export function getTranslationJobs() {
    return {
        results: mockTranslationJobs
    };
}

export function getJobById(id: number) {
    return mockTranslationJobs.find(j => j.id === id);
}

let nextJobId = 10;
export function createTranslationJob(data: any) {
    const newJob = {
        id: nextJobId++,
        manga_title: data.manga_title || 'Unknown',
        chapter_number: data.chapter_number || '0',
        status: 'pending' as const,
        progress: 0,
        created_at: new Date().toISOString(),
        completed_at: null,
        model: mockAIModels[0]
    };

    mockTranslationJobs.push(newJob);

    // Simulate progress after creation
    setTimeout(() => {
        newJob.status = 'pending';
        newJob.progress = 50;
    }, 1000);

    return newJob;
}
