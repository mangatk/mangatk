// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

// Import all mock data
import { mockMangaList, createPaginatedMangaResponse, getFeaturedManga, getMangaById } from './data/manga'
import { mockChapters, getChapterById, getChaptersByMangaId } from './data/chapters'
import { mockUsers, createAuthResponse, mockTokens } from './data/users'
import { mockComments, getCommentsByChapter, createComment, getCommentById } from './data/comments'
import { mockGenres } from './data/genres'
import { mockCategories } from './data/categories'
import { mockAchievements, getMyAchievements, checkAchievements } from './data/achievements'
import { mockRatings, getMyRating, createOrUpdateRating, getAllRatings } from './data/ratings'
import { mockBookmarks, getMyBookmarks, toggleBookmark } from './data/bookmarks'
import { mockReadingHistory, getMyHistory, addToHistory } from './data/history'
import { mockSubscriptionPlans, getAllSubscriptions, createSubscriptionPlan } from './data/subscriptions'
import { mockAIModels, mockTranslationJobs, getAIModels, getTranslationJobs, getJobById, createTranslationJob } from './data/ai'
import { mockNotifications, getMyNotifications, markAsRead, markAllAsRead } from './data/notifications'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const handlers = [
    // ==================== Authentication Endpoints ====================

    // POST /auth/login/
    http.post(`${API_BASE}/auth/login/`, async ({ request }) => {
        const body = await request.json() as any
        const { email, password } = body

        // Simple mock authentication
        const user = mockUsers.find(u => u.email === email)

        if (!user || password.length < 3) {
            return HttpResponse.json({
                success: false,
                error: 'بيانات الدخول غير صحيحة'
            }, { status: 401 })
        }

        return HttpResponse.json(createAuthResponse(user))
    }),

    // POST /auth/register/
    http.post(`${API_BASE}/auth/register/`, async ({ request }) => {
        const body = await request.json() as any
        const { username, email, password } = body

        if (!username || !email || !password) {
            return HttpResponse.json({
                success: false,
                error: 'جميع الحقول مطلوبة'
            }, { status: 400 })
        }

        // Create new user
        const newUser = {
            id: mockUsers.length + 1,
            username,
            email,
            is_staff: false,
            is_superuser: false,
            points: 100,
            equipped_title: null
        }

        return HttpResponse.json(createAuthResponse(newUser))
    }),

    // POST /auth/refresh/
    http.post(`${API_BASE}/auth/refresh/`, async ({ request }) => {
        const body = await request.json() as any

        return HttpResponse.json({
            access: 'mock-refreshed-access-token-' + Date.now(),
            refresh: body.refresh
        })
    }),

    // ==================== Manga Endpoints ====================

    // GET /manga/ (with filters)
    http.get(`${API_BASE}/manga/`, ({ request }) => {
        const url = new URL(request.url)
        const search = url.searchParams.get('search')
        const status = url.searchParams.get('status')
        const category = url.searchParams.get('category')
        const page = parseInt(url.searchParams.get('page') || '1')

        const response = createPaginatedMangaResponse(page, 20, { search, status, category })
        return HttpResponse.json(response)
    }),

    // GET /manga/featured/
    http.get(`${API_BASE}/manga/featured/`, () => {
        return HttpResponse.json(getFeaturedManga())
    }),

    // GET /manga/:id/
    http.get(`${API_BASE}/manga/:id/`, ({ params }) => {
        const manga = getMangaById(Number(params.id))

        if (!manga) {
            return HttpResponse.json({ error: 'Manga not found' }, { status: 404 })
        }

        // Add chapters to response
        const chapters = getChaptersByMangaId(Number(params.id))
        return HttpResponse.json({ ...manga, chapters })
    }),

    // POST /manga/:id/increment_views/
    http.post(`${API_BASE}/manga/:id/increment_views/`, ({ params }) => {
        const manga = mockMangaList.find(m => m.id === Number(params.id))
        if (manga) {
            manga.views++
        }
        return HttpResponse.json({ views: manga?.views || 0 })
    }),

    // POST /manga/
    http.post(`${API_BASE}/manga/`, async ({ request }) => {
        const body = await request.json() as any
        const newManga = {
            id: mockMangaList.length + 1,
            ...body,
            views: 0,
            chapter_count: 0,
            avg_rating: '0.0',
            last_updated: new Date().toISOString()
        }
        mockMangaList.push(newManga)
        return HttpResponse.json(newManga, { status: 201 })
    }),

    // PUT /manga/:id/
    http.put(`${API_BASE}/manga/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockMangaList.findIndex(m => m.id === Number(params.id))

        if (index === -1) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }

        mockMangaList[index] = { ...mockMangaList[index], ...body }
        return HttpResponse.json(mockMangaList[index])
    }),

    // DELETE /manga/:id/
    http.delete(`${API_BASE}/manga/:id/`, ({ params }) => {
        const index = mockMangaList.findIndex(m => m.id === Number(params.id))
        if (index !== -1) {
            mockMangaList.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Chapter Endpoints ====================

    // GET /chapters/:id/
    http.get(`${API_BASE}/chapters/:id/`, ({ params }) => {
        const chapter = getChapterById(Number(params.id))

        if (!chapter) {
            return HttpResponse.json({ error: 'Chapter not found' }, { status: 404 })
        }

        return HttpResponse.json(chapter)
    }),

    // POST /chapters/:id/increment_views/
    http.post(`${API_BASE}/chapters/:id/increment_views/`, ({ params }) => {
        const chapter = mockChapters.find(c => c.id === Number(params.id))
        if (chapter) {
            chapter.views++
        }
        return HttpResponse.json({ views: chapter?.views || 0 })
    }),

    // POST /chapters/
    http.post(`${API_BASE}/chapters/`, async ({ request }) => {
        // Handle multipart form data for CBZ upload
        const formData = await request.formData()
        const mangaId = Number(formData.get('manga'))
        const number = formData.get('number') as string
        const title = formData.get('title') as string

        const newChapter = {
            id: mockChapters.length + 1,
            manga_id: mangaId,
            manga_title: mockMangaList.find(m => m.id === mangaId)?.title || 'Unknown',
            title,
            number,
            release_date: new Date().toISOString().split('T')[0],
            views: 0,
            images: [],
            prev_chapter_id: null,
            next_chapter_id: null
        }

        mockChapters.push(newChapter)
        return HttpResponse.json(newChapter, { status: 201 })
    }),

    // PATCH /chapters/:id/
    http.patch(`${API_BASE}/chapters/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const chapter = mockChapters.find(c => c.id === Number(params.id))

        if (!chapter) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }

        Object.assign(chapter, body)
        return HttpResponse.json(chapter)
    }),

    // DELETE /chapters/:id/
    http.delete(`${API_BASE}/chapters/:id/`, ({ params }) => {
        const index = mockChapters.findIndex(c => c.id === Number(params.id))
        if (index !== -1) {
            mockChapters.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Comments Endpoints ====================

    // GET /comments/?chapter=:id
    http.get(`${API_BASE}/comments/`, ({ request }) => {
        const url = new URL(request.url)
        const chapterId = url.searchParams.get('chapter')

        if (chapterId) {
            return HttpResponse.json(getCommentsByChapter(Number(chapterId)))
        }

        // Return all comments for admin
        return HttpResponse.json({ results: mockComments })
    }),

    // POST /comments/
    http.post(`${API_BASE}/comments/`, async ({ request }) => {
        const body = await request.json() as any
        const newComment = createComment(body)
        return HttpResponse.json(newComment, { status: 201 })
    }),

    // POST /comments/:id/like/
    http.post(`${API_BASE}/comments/:id/like/`, ({ params }) => {
        const comment = getCommentById(Number(params.id))
        if (comment) {
            comment.likes_count++
        }
        return HttpResponse.json({ likes_count: comment?.likes_count || 0 })
    }),

    // PATCH /comments/:id/
    http.patch(`${API_BASE}/comments/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const comment = getCommentById(Number(params.id))

        if (!comment) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }

        comment.content = body.content
        return HttpResponse.json(comment)
    }),

    // DELETE /comments/:id/
    http.delete(`${API_BASE}/comments/:id/`, ({ params }) => {
        const index = mockComments.findIndex(c => c.id === Number(params.id))
        if (index !== -1) {
            mockComments.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Ratings Endpoints ====================

    // GET /ratings/my_rating/?chapter=:id
    http.get(`${API_BASE}/ratings/my_rating/`, ({ request }) => {
        const url = new URL(request.url)
        const chapterId = url.searchParams.get('chapter')
        return HttpResponse.json(getMyRating(Number(chapterId)))
    }),

    // POST /ratings/
    http.post(`${API_BASE}/ratings/`, async ({ request }) => {
        const body = await request.json() as any
        const rating = createOrUpdateRating(body)
        return HttpResponse.json(rating, { status: 201 })
    }),

    // GET /ratings/ (all ratings for admin)
    http.get(`${API_BASE}/ratings/`, () => {
        return HttpResponse.json(getAllRatings())
    }),

    // ==================== Bookmarks/Favorites Endpoints ====================

    // GET /bookmarks/
    http.get(`${API_BASE}/bookmarks/`, () => {
        return HttpResponse.json(getMyBookmarks())
    }),

    // POST /bookmarks/toggle/
    http.post(`${API_BASE}/bookmarks/toggle/`, async ({ request }) => {
        const body = await request.json() as any
        const result = toggleBookmark(body.manga_id)
        return HttpResponse.json(result)
    }),

    // ==================== Reading History Endpoints ====================

    // GET /reading-history/
    http.get(`${API_BASE}/reading-history/`, () => {
        return HttpResponse.json(getMyHistory())
    }),

    // POST /reading-history/
    http.post(`${API_BASE}/reading-history/`, async ({ request }) => {
        const body = await request.json() as any
        const history = addToHistory(body)
        return HttpResponse.json(history, { status: 201 })
    }),

    // ==================== Achievements Endpoints ====================

    // GET /achievements/my/
    http.get(`${API_BASE}/achievements/my/`, () => {
        return HttpResponse.json(getMyAchievements())
    }),

    // POST /achievements/check/
    http.post(`${API_BASE}/achievements/check/`, () => {
        return HttpResponse.json(checkAchievements())
    }),

    // GET /achievements/ (all achievements for admin)
    http.get(`${API_BASE}/achievements/`, () => {
        return HttpResponse.json({ results: mockAchievements })
    }),

    // POST /achievements/
    http.post(`${API_BASE}/achievements/`, async ({ request }) => {
        const body = await request.json() as any
        const newAchievement = {
            id: mockAchievements.length + 1,
            ...body
        }
        mockAchievements.push(newAchievement)
        return HttpResponse.json(newAchievement, { status: 201 })
    }),

    // PUT /achievements/:id/
    http.put(`${API_BASE}/achievements/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockAchievements.findIndex(a => a.id === Number(params.id))

        if (index !== -1) {
            mockAchievements[index] = { ...mockAchievements[index], ...body }
            return HttpResponse.json(mockAchievements[index])
        }

        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    // DELETE /achievements/:id/
    http.delete(`${API_BASE}/achievements/:id/`, ({ params }) => {
        const index = mockAchievements.findIndex(a => a.id === Number(params.id))
        if (index !== -1) {
            mockAchievements.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Categories & Genres Endpoints ====================

    // GET /categories/
    http.get(`${API_BASE}/categories/`, () => {
        return HttpResponse.json({ results: mockCategories })
    }),

    // POST /categories/
    http.post(`${API_BASE}/categories/`, async ({ request }) => {
        const body = await request.json() as any
        const newCategory = {
            id: mockCategories.length + 1,
            ...body
        }
        mockCategories.push(newCategory)
        return HttpResponse.json(newCategory, { status: 201 })
    }),

    // PUT /categories/:slug/
    http.put(`${API_BASE}/categories/:slug/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockCategories.findIndex(c => c.slug === params.slug)

        if (index !== -1) {
            mockCategories[index] = { ...mockCategories[index], ...body }
            return HttpResponse.json(mockCategories[index])
        }

        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    // DELETE /categories/:slug/
    http.delete(`${API_BASE}/categories/:slug/`, ({ params }) => {
        const index = mockCategories.findIndex(c => c.slug === params.slug)
        if (index !== -1) {
            mockCategories.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // GET /genres/
    http.get(`${API_BASE}/genres/`, () => {
        return HttpResponse.json({ results: mockGenres })
    }),

    // POST /genres/
    http.post(`${API_BASE}/genres/`, async ({ request }) => {
        const body = await request.json() as any
        const newGenre = {
            id: mockGenres.length + 1,
            ...body
        }
        mockGenres.push(newGenre)
        return HttpResponse.json(newGenre, { status: 201 })
    }),

    // PUT /genres/:slug/
    http.put(`${API_BASE}/genres/:slug/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockGenres.findIndex(g => g.slug === params.slug)

        if (index !== -1) {
            mockGenres[index] = { ...mockGenres[index], ...body }
            return HttpResponse.json(mockGenres[index])
        }

        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    // DELETE /genres/:slug/
    http.delete(`${API_BASE}/genres/:slug/`, ({ params }) => {
        const index = mockGenres.findIndex(g => g.slug === params.slug)
        if (index !== -1) {
            mockGenres.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Subscriptions Endpoints ====================

    // GET /subscriptions/
    http.get(`${API_BASE}/subscriptions/`, () => {
        return HttpResponse.json(getAllSubscriptions())
    }),

    // POST /subscriptions/
    http.post(`${API_BASE}/subscriptions/`, async ({ request }) => {
        const body = await request.json() as any
        const newPlan = createSubscriptionPlan(body)
        return HttpResponse.json(newPlan, { status: 201 })
    }),

    // PUT /subscriptions/:id/
    http.put(`${API_BASE}/subscriptions/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockSubscriptionPlans.findIndex(p => p.id === Number(params.id))

        if (index !== -1) {
            mockSubscriptionPlans[index] = { ...mockSubscriptionPlans[index], ...body }
            return HttpResponse.json(mockSubscriptionPlans[index])
        }

        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    // DELETE /subscriptions/:id/
    http.delete(`${API_BASE}/subscriptions/:id/`, ({ params }) => {
        const index = mockSubscriptionPlans.findIndex(p => p.id === Number(params.id))
        if (index !== -1) {
            mockSubscriptionPlans.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== AI Translation Endpoints ====================

    // GET /translation/ai-models/
    http.get(`${API_BASE}/translation/ai-models/`, () => {
        return HttpResponse.json(getAIModels())
    }),

    // GET /translation/jobs/
    http.get(`${API_BASE}/translation/jobs/`, () => {
        return HttpResponse.json(getTranslationJobs())
    }),

    // GET /translation/jobs/:id/
    http.get(`${API_BASE}/translation/jobs/:id/`, ({ params }) => {
        const job = getJobById(Number(params.id))

        if (!job) {
            return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return HttpResponse.json(job)
    }),

    // POST /translation/upload/
    http.post(`${API_BASE}/translation/upload/`, async ({ request }) => {
        const formData = await request.formData()
        const job = createTranslationJob({
            manga_title: formData.get('manga_title'),
            chapter_number: formData.get('chapter_number')
        })
        return HttpResponse.json(job, { status: 201 })
    }),

    // GET /translation/jobs/:id/download/
    http.get(`${API_BASE}/translation/jobs/:id/download/`, ({ params }) => {
        // Mock file download
        return HttpResponse.json({ download_url: `https://example.com/download/${params.id}` })
    }),

    // POST /ai-models/
    http.post(`${API_BASE}/ai-models/`, async ({ request }) => {
        const body = await request.json() as any
        const newModel = {
            id: mockAIModels.length + 1,
            ...body
        }
        mockAIModels.push(newModel)
        return HttpResponse.json(newModel, { status: 201 })
    }),

    // PATCH /ai-models/:id/
    http.patch(`${API_BASE}/ai-models/:id/`, async ({ params, request }) => {
        const body = await request.json() as any
        const index = mockAIModels.findIndex(m => m.id === Number(params.id))

        if (index !== -1) {
            mockAIModels[index] = { ...mockAIModels[index], ...body }
            return HttpResponse.json(mockAIModels[index])
        }

        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }),

    // DELETE /ai-models/:id/
    http.delete(`${API_BASE}/ai-models/:id/`, ({ params }) => {
        const index = mockAIModels.findIndex(m => m.id === Number(params.id))
        if (index !== -1) {
            mockAIModels.splice(index, 1)
        }
        return HttpResponse.json({ success: true }, { status: 204 })
    }),

    // ==================== Notifications Endpoints ====================

    // GET /notifications/
    http.get(`${API_BASE}/notifications/`, () => {
        return HttpResponse.json(getMyNotifications())
    }),

    // POST /notifications/:id/mark-read/
    http.post(`${API_BASE}/notifications/:id/mark-read/`, ({ params }) => {
        return HttpResponse.json(markAsRead(Number(params.id)))
    }),

    // POST /notifications/mark-all-read/
    http.post(`${API_BASE}/notifications/mark-all-read/`, () => {
        return HttpResponse.json(markAllAsRead())
    }),

    // ==================== Dashboard Stats Endpoints ====================

    // GET /dashboard/stats/
    http.get(`${API_BASE}/dashboard/stats/`, () => {
        return HttpResponse.json({
            total_manga: mockMangaList.length,
            total_chapters: mockChapters.length,
            total_users: mockUsers.length,
            total_comments: mockComments.length
        })
    }),

    // ==================== Banners Endpoints ====================

    // PATCH /manga/:id/ (for banner toggle)
    // Already handled in manga PUT/PATCH above
]
