/**
 * Supabase API Wrapper for Wedding Invitation Guestbook
 * 
 * This file provides a simple API interface compatible with the existing
 * guest.js implementation, using Supabase as the backend.
 */

class SupabaseAPI {
    constructor() {
        this.url = null;
        this.key = null;
        this.headers = null;
        this.initialized = false;
    }

    /**
     * Initialize Supabase connection
     * @param {string} url - Supabase project URL (with /rest/v1)
     * @param {string} key - Supabase anon key
     */
    init(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        this.initialized = true;
    }

    /**
     * Get client IP address (best effort)
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return '0.0.0.0';
        }
    }

    /**
     * GET request to Supabase
     */
    async get(table, params = {}) {
        if (!this.initialized) throw new Error('Supabase not initialized');

        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            queryParams.append(key, params[key]);
        });

        const response = await fetch(`${this.url}/${table}?${queryParams}`, {
            method: 'GET',
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(`Supabase GET error: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * POST request to Supabase
     */
    async post(table, data) {
        if (!this.initialized) throw new Error('Supabase not initialized');

        const response = await fetch(`${this.url}/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Supabase POST error: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * PATCH request to Supabase
     */
    async patch(table, id, data) {
        if (!this.initialized) throw new Error('Supabase not initialized');

        const response = await fetch(`${this.url}/${table}?uuid=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Supabase PATCH error: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * DELETE request to Supabase
     */
    async delete(table, id) {
        if (!this.initialized) throw new Error('Supabase not initialized');

        const response = await fetch(`${this.url}/${table}?uuid=eq.${id}`, {
            method: 'DELETE',
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(`Supabase DELETE error: ${response.statusText}`);
        }

        return { status: true };
    }

    /**
     * Get comments with pagination
     */
    async getComments(page = 1, per = 10) {
        const offset = (page - 1) * per;
        
        // Get parent comments (no parent_uuid)
        const comments = await this.get('comments', {
            'select': '*',
            'is.parent_uuid': 'null',
            'order': 'created_at.desc',
            'limit': per,
            'offset': offset
        });

        // For each comment, get its replies and like count
        const ip = await this.getClientIP();
        const enrichedComments = await Promise.all(comments.map(async (comment) => {
            // Get replies
            const replies = await this.get('comments', {
                'parent_uuid': `eq.${comment.uuid}`,
                'order': 'created_at.asc'
            });

            // Get like count
            const likes = await this.get('likes', {
                'comment_uuid': `eq.${comment.uuid}`,
                'select': 'count'
            });

            // Check if user has liked
            const userLiked = await this.get('likes', {
                'comment_uuid': `eq.${comment.uuid}`,
                'ip_address': `eq.${ip}`
            });

            return {
                ...comment,
                replies: replies,
                like_count: likes.length || 0,
                is_liked: userLiked.length > 0,
                own: false // Will be set based on session
            };
        }));

        return {
            data: enrichedComments,
            has_more: comments.length === per
        };
    }

    /**
     * Create a new comment
     */
    async createComment(name, presence, comment, gifUrl = null, parentUuid = null) {
        const ip = await this.getClientIP();
        const userAgent = navigator.userAgent;

        const data = {
            name: name.trim(),
            presence: parseInt(presence) || 0,
            comment: comment.trim(),
            gif_url: gifUrl,
            parent_uuid: parentUuid,
            ip_address: ip,
            user_agent: userAgent,
            is_admin: false
        };

        const result = await this.post('comments', data);
        return result[0]; // Supabase returns array
    }

    /**
     * Update a comment
     */
    async updateComment(uuid, comment, gifUrl = null) {
        const data = {
            comment: comment.trim(),
            updated_at: new Date().toISOString()
        };

        if (gifUrl !== null) {
            data.gif_url = gifUrl;
        }

        const result = await this.patch('comments', uuid, data);
        return result[0];
    }

    /**
     * Delete a comment
     */
    async deleteComment(uuid) {
        return await this.delete('comments', uuid);
    }

    /**
     * Like a comment
     */
    async likeComment(commentUuid) {
        const ip = await this.getClientIP();

        try {
            await this.post('likes', {
                comment_uuid: commentUuid,
                ip_address: ip
            });
            return { status: true, action: 'liked' };
        } catch (error) {
            // If already liked, try to unlike
            if (error.message.includes('duplicate')) {
                await this.unlikeComment(commentUuid);
                return { status: true, action: 'unliked' };
            }
            throw error;
        }
    }

    /**
     * Unlike a comment
     */
    async unlikeComment(commentUuid) {
        const ip = await this.getClientIP();
        
        const response = await fetch(`${this.url}/likes?comment_uuid=eq.${commentUuid}&ip_address=eq.${ip}`, {
            method: 'DELETE',
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(`Unlike error: ${response.statusText}`);
        }

        return { status: true };
    }

    /**
     * Get like count for a comment
     */
    async getLikeCount(commentUuid) {
        const likes = await this.get('likes', {
            'comment_uuid': `eq.${commentUuid}`,
            'select': 'count'
        });
        return likes.length || 0;
    }
}

// Create global instance
window.supabaseAPI = new SupabaseAPI();

/**
 * Check if backend is configured
 */
window.supabaseAPI.isConfigured = function() {
    const url = document.body.getAttribute('data-supabase-url') || document.body.getAttribute('data-url');
    const key = document.body.getAttribute('data-supabase-key') || document.body.getAttribute('data-key');
    return url && key && url.includes('supabase.co');
};

// Auto-initialize from body attributes when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const url = document.body.getAttribute('data-supabase-url') || document.body.getAttribute('data-url');
    const key = document.body.getAttribute('data-supabase-key') || document.body.getAttribute('data-key');
    
    if (url && key && url !== 'YOUR_SUPABASE_URL/rest/v1' && key !== 'YOUR_SUPABASE_KEY') {
        try {
            window.supabaseAPI.init(url, key);
            console.log('✅ Supabase API initialized');
        } catch (error) {
            console.warn('⚠️ Supabase initialization failed:', error.message);
        }
    } else {
        console.warn('⚠️ Supabase credentials not configured. Guestbook features will be disabled.');
        console.info('ℹ️ To enable guestbook, follow instructions in QUICK_START_VI.md');
        
        // Disable comment section UI if not configured
        setTimeout(() => {
            const commentSection = document.getElementById('comment');
            if (commentSection) {
                const alertBox = document.createElement('div');
                alertBox.className = 'alert alert-warning mx-3 mb-3 rounded-4';
                alertBox.innerHTML = `
                    <h5 class="mb-3"><i class="fa-solid fa-triangle-exclamation me-2"></i>Tính năng Guestbook chưa được kích hoạt</h5>
                    <p class="mb-2">Để kích hoạt tính năng để lại lời chúc, vui lòng:</p>
                    <ol class="mb-2">
                        <li>Tạo tài khoản Supabase miễn phí tại <a href="https://supabase.com" target="_blank" class="alert-link">supabase.com</a></li>
                        <li>Làm theo hướng dẫn trong file <strong>QUICK_START_VI.md</strong> (có trong source code)</li>
                        <li>Cấu hình credentials trong file <code>index.html</code></li>
                    </ol>
                    <p class="mb-0 small"><i class="fa-solid fa-info-circle me-1"></i>Setup chỉ mất ~5 phút và hoàn toàn MIỄN PHÍ!</p>
                `;
                commentSection.insertBefore(alertBox, commentSection.firstChild);
                
                // Hide comment form
                const commentForm = commentSection.querySelector('.border.rounded-5.shadow');
                if (commentForm) {
                    commentForm.style.opacity = '0.5';
                    commentForm.style.pointerEvents = 'none';
                }
            }
        }, 1000);
    }
});
