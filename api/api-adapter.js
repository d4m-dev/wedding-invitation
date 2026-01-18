/**
 * API Adapter - Intercepts old API calls and redirects to Supabase
 * This allows the existing dist/guest.js and dist/admin.js to work with Supabase
 */

(function() {
    'use strict';

    // Store original fetch
    const originalFetch = window.fetch;

    // Force legacy API base URL to current origin so /api/* calls are intercepted locally
    const existingDataUrl = document.body.getAttribute('data-url');
    if (!existingDataUrl || existingDataUrl.includes('supabase.co')) {
        document.body.setAttribute('data-url', window.location.origin);
    }
    
    // Helper to check if Supabase is configured
    function isSupabaseConfigured() {
        return window.supabaseAPI && window.supabaseAPI.isConfigured && window.supabaseAPI.isConfigured();
    }

    // Get client IP
    async function getClientIP() {
        try {
            const response = await originalFetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return '0.0.0.0';
        }
    }

    // Convert old API response format to new format
    function createResponse(data, status = 200, statusText = 'OK') {
        const body = JSON.stringify(data);
        return new Response(body, {
            status: status,
            statusText: statusText,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Handle /api/session - mock authentication (not needed for public guestbook)
    async function handleSession(request) {
        // Return mock session token
        return createResponse({
            code: 200,
            data: {
                token: 'mock-token-public-access'
            }
        });
    }

    // Handle /api/v2/config - return config
    async function handleConfig() {
        return createResponse({
            code: 200,
            data: {
                can_reply: true,
                can_edit: true,
                can_delete: true,
                tenor_key: null // Disable GIF for now
            }
        });
    }

    // Handle GET /api/v2/comment - get comments with pagination
    async function handleGetComments(url) {
        if (!isSupabaseConfigured()) {
            return createResponse({
                data: {
                    count: 0,
                    lists: []
                }
            });
        }

        try {
            const params = new URLSearchParams(url.search);
            const per = parseInt(params.get('per')) || 10;
            const next = parseInt(params.get('next')) || 0;
            const offset = next * per;

            const supabaseUrl = window.supabaseAPI.url;
            const supabaseHeaders = {
                'apikey': window.supabaseAPI.key,
                'Authorization': `Bearer ${window.supabaseAPI.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            };

            // Get parent comments from Supabase
            const listResponse = await originalFetch(`${supabaseUrl}/comments?select=*&parent_uuid=is.null&order=created_at.desc&limit=${per}&offset=${offset}`, {
                method: 'GET',
                headers: supabaseHeaders
            });

            if (!listResponse.ok) {
                throw new Error(`Supabase list error: ${listResponse.statusText}`);
            }

            const response = await listResponse.json();
            const contentRange = listResponse.headers.get('Content-Range');
            const totalCount = contentRange && contentRange.includes('/') ? parseInt(contentRange.split('/')[1]) : response.length;

            const ip = await getClientIP();
            
            // Transform to old API format
            const lists = await Promise.all(response.map(async (comment) => {
                // Get replies
                const replies = await window.supabaseAPI.get('comments', {
                    'parent_uuid': `eq.${comment.uuid}`,
                    'order': 'created_at.asc'
                });

                // Get like count
                const likes = await window.supabaseAPI.get('likes', {
                    'comment_uuid': `eq.${comment.uuid}`
                });

                // Check if user liked
                const userLiked = await window.supabaseAPI.get('likes', {
                    'comment_uuid': `eq.${comment.uuid}`,
                    'ip_address': `eq.${ip}`
                });

                // Transform replies
                const transformedReplies = await Promise.all(replies.map(async (reply) => {
                    const replyLikes = await window.supabaseAPI.get('likes', {
                        'comment_uuid': `eq.${reply.uuid}`
                    });
                    
                    const replyUserLiked = await window.supabaseAPI.get('likes', {
                        'comment_uuid': `eq.${reply.uuid}`,
                        'ip_address': `eq.${ip}`
                    });

                    return {
                        uuid: reply.uuid,
                        name: reply.name,
                        presence: reply.presence,
                        comment: reply.comment,
                        ip: reply.ip_address,
                        user_agent: reply.user_agent,
                        is_admin: reply.is_admin,
                        is_parent: false,
                        gif_url: reply.gif_url,
                        created_at: reply.created_at,
                        like_count: replyLikes.length || 0,
                        comments: []
                    };
                }));

                return {
                    uuid: comment.uuid,
                    name: comment.name,
                    presence: comment.presence,
                    comment: comment.comment,
                    ip: comment.ip_address,
                    user_agent: comment.user_agent,
                    is_admin: comment.is_admin,
                    is_parent: true,
                    gif_url: comment.gif_url,
                    created_at: comment.created_at,
                    like_count: likes.length || 0,
                    comments: transformedReplies
                };
            }));

            return createResponse({
                data: {
                    count: totalCount,
                    lists: lists
                }
            });

        } catch (error) {
            console.error('Error fetching comments:', error);
            return createResponse({
                data: { count: 0, lists: [] }
            }, 500, 'Error');
        }
    }

    // Handle POST /api/comment - create comment
    async function handlePostComment(request) {
        if (!isSupabaseConfigured()) {
            console.warn('[API Adapter] Supabase not configured');
            return createResponse({ data: { message: 'Backend not configured' } }, 400, 'Bad Request');
        }

        try {
            const body = await request.json();
            console.log('[API Adapter] POST /api/comment - Request body:', body);
            
            const ip = await getClientIP();

            const presenceValue = typeof body.presence === 'boolean'
                ? (body.presence ? 1 : 2)
                : (body.presence != null ? parseInt(body.presence) : 0);

            const data = {
                name: body.name || body.nama || 'Anonymous',
                presence: Number.isNaN(presenceValue) ? 0 : presenceValue,
                comment: body.comment || body.komentar || '',
                gif_url: body.gif_url || body.gif_id || null,
                parent_uuid: body.id || body.uuid || null,
                ip_address: ip,
                user_agent: navigator.userAgent,
                is_admin: false
            };

            console.log('[API Adapter] Sending to Supabase:', data);
            const result = await window.supabaseAPI.post('comments', data);
            console.log('[API Adapter] Supabase response:', result);
            
            const newComment = result[0];

            const responseData = {
                data: {
                    uuid: newComment.uuid,
                    name: newComment.name,
                    presence: newComment.presence,
                    comment: newComment.comment,
                    ip: newComment.ip_address,
                    user_agent: newComment.user_agent,
                    is_admin: newComment.is_admin,
                    is_parent: !newComment.parent_uuid,
                    gif_url: newComment.gif_url,
                    created_at: newComment.created_at,
                    like_count: 0,
                    comments: [],
                    own: true
                }
            };

            console.log('[API Adapter] Returning response:', responseData);
            return createResponse(responseData, 201, 'Created');

        } catch (error) {
            console.error('[API Adapter] Error creating comment:', error);
            console.error('[API Adapter] Error stack:', error.stack);
            return createResponse({ data: { message: error.message } }, 500, 'Error');
        }
    }

    // Handle PATCH /api/comment/:uuid - update comment
    async function handleUpdateComment(request, uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ data: { status: false } }, 400, 'Bad Request');
        }

        try {
            const body = await request.json();
            
            const data = {
                comment: body.komentar || '',
                updated_at: new Date().toISOString()
            };

            if (body.gif_url !== undefined) {
                data.gif_url = body.gif_url;
            }

            await window.supabaseAPI.patch('comments', uuid, data);

            return createResponse({
                data: { status: true }
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            return createResponse({ data: { status: false } }, 500, 'Error');
        }
    }

    // Handle DELETE /api/comment/:uuid - delete comment
    async function handleDeleteComment(uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ data: { status: false } }, 400, 'Bad Request');
        }

        try {
            await window.supabaseAPI.delete('comments', uuid);

            return createResponse({
                data: { status: true }
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            return createResponse({ data: { status: false } }, 500, 'Error');
        }
    }

    // Handle like/unlike
    async function handleLike(request, uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ data: { status: false } }, 400, 'Bad Request');
        }

        try {
            const ip = await getClientIP();
            const likeInsert = await window.supabaseAPI.post('likes', {
                comment_uuid: uuid,
                ip_address: ip
            });

            return createResponse({
                data: { uuid: likeInsert[0]?.id || likeInsert[0]?.uuid || uuid }
            }, 201, 'Created');

        } catch (error) {
            console.error('Error toggling like:', error);
            return createResponse({ data: { status: false } }, 500, 'Error');
        }
    }

    // Handle unlike (PATCH /api/comment/:likeId)
    async function handleUnlike(likeId) {
        if (!isSupabaseConfigured()) {
            return createResponse({ data: { status: false } }, 400, 'Bad Request');
        }

        try {
            const response = await originalFetch(`${window.supabaseAPI.url}/likes?id=eq.${likeId}`, {
                method: 'DELETE',
                headers: window.supabaseAPI.headers
            });

            if (!response.ok) {
                throw new Error(`Unlike error: ${response.statusText}`);
            }

            return createResponse({ data: { status: true } });
        } catch (error) {
            console.error('Error unliking comment:', error);
            return createResponse({ data: { status: false } }, 500, 'Error');
        }
    }

    // Override fetch to intercept API calls
    window.fetch = async function(url, options = {}) {
        const urlString = typeof url === 'string' ? url : url.href || url.toString();
        
        // Check if this is an API call we need to intercept
        if (urlString.includes('/api/')) {
            const parsedUrl = new URL(urlString, window.location.origin);
            const path = parsedUrl.pathname;

            console.log('[API Adapter] Intercepting:', path, 'Method:', options.method || 'GET');

            // Route to appropriate handler
            if (path === '/api/session') {
                return handleSession(new Request(url, options));
            }
            
            if (path === '/api/v2/config') {
                return handleConfig();
            }
            
            if (path.startsWith('/api/v2/comment') && (!options.method || options.method === 'GET')) {
                return handleGetComments(parsedUrl);
            }

            if (path === '/api/comment' && options.method === 'POST') {
                console.log('[API Adapter] Handling POST /api/comment');
                return handlePostComment(new Request(url, options));
            }
            
            if (path.startsWith('/api/comment') && !options.method) {
                // Default to POST if no method specified for /api/comment
                console.log('[API Adapter] Defaulting to POST for /api/comment');
                return handlePostComment(new Request(url, {...options, method: 'POST'}));
            }

            const commentMatch = path.match(/^\/api\/comment\/([a-f0-9-]+)$/);
            if (commentMatch) {
                const uuid = commentMatch[1];
                const method = options.method || 'GET';

                if (method === 'PATCH') {
                    const hasBody = options.body != null && String(options.body).length > 0;
                    if (!hasBody) {
                        return handleUnlike(uuid);
                    }
                    return handleUpdateComment(new Request(url, options), uuid);
                }

                if (method === 'PUT') {
                    return handleUpdateComment(new Request(url, options), uuid);
                }
                
                if (method === 'DELETE') {
                    return handleDeleteComment(uuid);
                }
                
                if (method === 'POST') {
                    return handleLike(new Request(url, options), uuid);
                }
            }
        }

        // Not an API call we handle, use original fetch
        return originalFetch(url, options);
    };

    console.log('✅ API Adapter loaded - Old API calls will be redirected to Supabase');
})();
