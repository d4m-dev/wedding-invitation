/**
 * API Adapter - Intercepts old API calls and redirects to Supabase
 * This allows the existing dist/guest.js and dist/admin.js to work with Supabase
 */

(function() {
    'use strict';

    // Store original fetch
    const originalFetch = window.fetch;
    
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
                code: 200,
                data: {
                    lists: [],
                    hasMore: false
                }
            });
        }

        try {
            const params = new URLSearchParams(url.search);
            const per = parseInt(params.get('per')) || 10;
            const next = parseInt(params.get('next')) || 0;
            const offset = next * per;

            // Get parent comments from Supabase
            const response = await window.supabaseAPI.get('comments', {
                'select': '*',
                'is.parent_uuid': 'null',
                'order': 'created_at.desc',
                'limit': per,
                'offset': offset
            });

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
                    'comment_uuid': `eq.${comment.uuid}`,
                    'select': 'count'
                });

                // Check if user liked
                const userLiked = await window.supabaseAPI.get('likes', {
                    'comment_uuid': `eq.${comment.uuid}`,
                    'ip_address': `eq.${ip}`
                });

                // Transform replies
                const transformedReplies = await Promise.all(replies.map(async (reply) => {
                    const replyLikes = await window.supabaseAPI.get('likes', {
                        'comment_uuid': `eq.${reply.uuid}`,
                        'select': 'count'
                    });
                    
                    const replyUserLiked = await window.supabaseAPI.get('likes', {
                        'comment_uuid': `eq.${reply.uuid}`,
                        'ip_address': `eq.${ip}`
                    });

                    return {
                        uuid: reply.uuid,
                        nama: reply.name,
                        hadir: reply.presence,
                        komentar: reply.comment,
                        ip: reply.ip_address,
                        is_admin: reply.is_admin,
                        created_at: reply.created_at,
                        love: replyLikes.length || 0,
                        is_loved: replyUserLiked.length > 0,
                        own: false,
                        comments: []
                    };
                }));

                return {
                    uuid: comment.uuid,
                    nama: comment.name,
                    hadir: comment.presence,
                    komentar: comment.comment,
                    ip: comment.ip_address,
                    is_admin: comment.is_admin,
                    created_at: comment.created_at,
                    love: likes.length || 0,
                    is_loved: userLiked.length > 0,
                    own: false,
                    comments: transformedReplies
                };
            }));

            return createResponse({
                code: 200,
                data: {
                    lists: lists,
                    hasMore: response.length === per
                }
            });

        } catch (error) {
            console.error('Error fetching comments:', error);
            return createResponse({
                code: 500,
                data: { lists: [], hasMore: false }
            });
        }
    }

    // Handle POST /api/comment - create comment
    async function handlePostComment(request) {
        if (!isSupabaseConfigured()) {
            console.warn('[API Adapter] Supabase not configured');
            return createResponse({ code: 400, data: { message: 'Backend not configured' } }, 400);
        }

        try {
            const body = await request.json();
            console.log('[API Adapter] POST /api/comment - Request body:', body);
            
            const ip = await getClientIP();

            const data = {
                name: body.nama || 'Anonymous',
                presence: parseInt(body.hadir) || 0,
                comment: body.komentar || '',
                gif_url: body.gif_url || null,
                parent_uuid: body.uuid || null,
                ip_address: ip,
                user_agent: navigator.userAgent,
                is_admin: false
            };

            console.log('[API Adapter] Sending to Supabase:', data);
            const result = await window.supabaseAPI.post('comments', data);
            console.log('[API Adapter] Supabase response:', result);
            
            const newComment = result[0];

            const responseData = {
                code: 200,
                data: {
                    uuid: newComment.uuid,
                    nama: newComment.name,
                    hadir: newComment.presence,
                    komentar: newComment.comment,
                    ip: newComment.ip_address,
                    is_admin: newComment.is_admin,
                    created_at: newComment.created_at,
                    love: 0,
                    is_loved: false,
                    own: true
                }
            };

            console.log('[API Adapter] Returning response:', responseData);
            return createResponse(responseData);

        } catch (error) {
            console.error('[API Adapter] Error creating comment:', error);
            console.error('[API Adapter] Error stack:', error.stack);
            return createResponse({ code: 500, data: { message: error.message } }, 500);
        }
    }

    // Handle PATCH /api/comment/:uuid - update comment
    async function handleUpdateComment(request, uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ code: 400, data: { status: false } }, 400);
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
                code: 200,
                data: { status: true }
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            return createResponse({ code: 500, data: { status: false } }, 500);
        }
    }

    // Handle DELETE /api/comment/:uuid - delete comment
    async function handleDeleteComment(uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ code: 400, data: { status: false } }, 400);
        }

        try {
            await window.supabaseAPI.delete('comments', uuid);

            return createResponse({
                code: 200,
                data: { status: true }
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            return createResponse({ code: 500, data: { status: false } }, 500);
        }
    }

    // Handle like/unlike
    async function handleLike(request, uuid) {
        if (!isSupabaseConfigured()) {
            return createResponse({ code: 400, data: { status: false } }, 400);
        }

        try {
            const result = await window.supabaseAPI.likeComment(uuid);

            return createResponse({
                code: 200,
                data: { status: true }
            });

        } catch (error) {
            console.error('Error toggling like:', error);
            return createResponse({ code: 500, data: { status: false } }, 500);
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

                if (method === 'PATCH' || method === 'PUT') {
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
