(() => {
    var S = (() => {
        let n = null,
            s = null,
            l = 0,
            r = 0,
            g = !0,
            o = !1,
            c = null,
            x = () => {
                l += 1
            },
            b = () => `(${r}/${l}) [${parseInt(r/l*100).toFixed(0)}%]`;
        return {
            init: () => {
                n = document.getElementById("progress-info"), s = document.getElementById("progress-bar"), n.classList.remove("d-none"), c = new Promise(p => document.addEventListener("undangan.progress.invalid", p))
            },
            add: x,
            invalid: p => {
                g && !o && (g = !1, s.style.backgroundColor = "red", n.innerText = `Error loading ${p} ${b()}`, document.dispatchEvent(new Event("undangan.progress.invalid")))
            },
            complete: (p, y = !1) => {
                g && (r += 1, n.innerText = `Loading ${p} ${y?"skipped":"complete"} ${b()}`, s.style.width = Math.min(r / l * 100, 100).toString() + "%", r === l && (o = !0, document.dispatchEvent(new Event("undangan.progress.done"))))
            },
            getAbort: () => c
        }
    })();
    var d = (() => {
        let n = '<span class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem;"></span>',
            s = [
                ["*", '<strong class="text-theme-auto">$1</strong>'],
                ["_", '<em class="text-theme-auto">$1</em>'],
                ["~", '<del class="text-theme-auto">$1</del>'],
                ["```", '<code class="font-monospace text-theme-auto">$1</code>']
            ],
            l = [{
                type: "Mobile",
                regex: /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
            }, {
                type: "Tablet",
                regex: /iPad|Android(?!.*Mobile)|Tablet/i
            }, {
                type: "Desktop",
                regex: /Windows NT|Macintosh|Linux/i
            }],
            r = [{
                name: "Chrome",
                regex: /Chrome|CriOS/i
            }, {
                name: "Safari",
                regex: /Safari/i
            }, {
                name: "Edge",
                regex: /Edg|Edge/i
            }, {
                name: "Firefox",
                regex: /Firefox|FxiOS/i
            }, {
                name: "Opera",
                regex: /Opera|OPR/i
            }, {
                name: "Internet Explorer",
                regex: /MSIE|Trident/i
            }, {
                name: "Samsung Browser",
                regex: /SamsungBrowser/i
            }],
            g = [{
                name: "Windows",
                regex: /Windows NT ([\d.]+)/i
            }, {
                name: "MacOS",
                regex: /Mac OS X ([\d_.]+)/i
            }, {
                name: "Android",
                regex: /Android ([\d.]+)/i
            }, {
                name: "iOS",
                regex: /OS ([\d_]+) like Mac OS X/i
            }, {
                name: "Linux",
                regex: /Linux/i
            }, {
                name: "Ubuntu",
                regex: /Ubuntu/i
            }, {
                name: "Chrome OS",
                regex: /CrOS/i
            }],
            o = e => String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"),
            c = e => {
                let t = a => {
                    window.alert(`${a} ${e}`)
                };
                return {
                    success: () => t("\u{1F7E9}"),
                    error: () => t("\u{1F7E5}"),
                    warning: () => t("\u{1F7E8}"),
                    info: () => t("\u{1F7E6}"),
                    custom: a => t(a)
                }
            },
            x = e => window.confirm(`\u{1F7E6} ${e}`),
            b = (e, t) => (e.replaceChildren(document.createRange().createContextualFragment(t)), e),
            E = (e, t, a = .05) => new Promise(v => {
                let L = parseFloat(e.style.opacity),
                    C = t ? 1 : 0,
                    B = () => {
                        L += t ? a : -a, L = Math.max(0, Math.min(1, L)), e.style.opacity = L.toFixed(2), t && L >= C || !t && L <= C ? (e.style.opacity = C.toString(), v(e)) : requestAnimationFrame(B)
                    };
                requestAnimationFrame(B)
            }),
            u = (e, t = 0) => {
                let a = null;
                a = setTimeout(() => {
                    e(), clearTimeout(a), a = null
                }, t)
            };
        return {
            loader: n,
            ask: x,
            copy: async (e, t = null, a = 1500) => {
                let v = e.getAttribute("data-copy");
                if (!v || v.length === 0) {
                    c("Nothing to copy").warning();
                    return
                }
                e.disabled = !0;
                try {
                    await navigator.clipboard.writeText(v)
                } catch {
                    e.disabled = !1, c("Failed to copy").error();
                    return
                }
                let L = e.innerHTML;
                b(e, t || '<i class="fa-solid fa-check"></i>'), u(() => {
                    e.disabled = !1, e.innerHTML = L
                }, a)
            },
            notify: c,
            timeOut: u,
            debounce: (e, t = 100) => {
                let a = null;
                return (...v) => {
                    clearTimeout(a), a = setTimeout(() => e(...v), t)
                }
            },
            escapeHtml: o,
            base64Encode: e => {
                let a = new TextEncoder().encode(e);
                return window.btoa(String.fromCharCode(...a))
            },
            base64Decode: e => {
                let t = new TextDecoder,
                    a = Uint8Array.from(window.atob(e), v => v.charCodeAt(0));
                return t.decode(a)
            },
            disableButton: (e, t = "Loading", a = !1) => {
                e.disabled = !0;
                let v = e.innerHTML;
                return b(e, a ? t : n + t), {
                    restore: (L = !1) => {
                        e.innerHTML = v, e.disabled = L
                    }
                }
            },
            disableCheckbox: e => {
                e.disabled = !0;
                let t = document.querySelector(`label[for="${e.id}"]`),
                    a = t.innerHTML;
                return b(t, n + a), {
                    restore: () => {
                        t.innerHTML = a, e.disabled = !1
                    }
                }
            },
            safeInnerHTML: b,
            parseUserAgent: e => {
                if (!e || typeof e != "string") return "Unknown";
                let t = l.find(B => B.regex.test(e))?.type ?? "Unknown",
                    a = r.find(B => B.regex.test(e))?.name ?? "Unknown",
                    v = g.find(B => B.regex.test(e)),
                    L = v ? v.name : "Unknown",
                    C = v ? e.match(v.regex)?.[1]?.replace(/_/g, ".") ?? null : null;
                return `${a} ${t} ${C?`${L} ${C}`:L}`
            },
            changeOpacity: E,
            getGMTOffset: e => {
                let t = new Date,
                    a = new Intl.DateTimeFormat("en-US", {
                        timeZone: e,
                        hourCycle: "h23",
                        hour: "numeric"
                    }),
                    v = (parseInt(a.format(t)) - t.getUTCHours() + 24) % 24;
                return v > 12 && (v -= 24), `GMT${v>=0?"+":""}${v}`
            },
            convertMarkdownToHTML: e => (s.forEach(([t, a]) => {
                e = e.replace(new RegExp(`\\${t}(\\S(?:[\\s\\S]*?\\S)?)\\${t}`, "g"), a)
            }), e)
        }
    })();
    var U = "GET",
        ce = "PUT",
        X = "POST",
        de = "PATCH",
        me = "DELETE";
    var ne = "AbortError",
        xe = "TypeError",
        oe = {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        Le = "request",
        ke = (() => {
            let n = null;
            return {
                getInstance: () => (n || (n = window.caches.open(Le)), n),
                purge: () => {
                    n = null
                }
            }
        })();
    var Z = n => ({
            set: (g, o, c, x) => o.clone().arrayBuffer().then(b => {
                if (!o.ok || !window.isSecureContext) return o;
                let E = new Date,
                    u = new Headers(o.headers);
                if (u.has("Date") || u.set("Date", E.toUTCString()), c || !u.has("Cache-Control")) {
                    if (!c && u.has("Expires")) {
                        let T = new Date(u.get("Expires"));
                        x = Math.max(0, T.getTime() - E.getTime())
                    }
                    u.set("Cache-Control", `public, max-age=${Math.floor(x/1e3)}`)
                }
                return u.has("Content-Length") || u.set("Content-Length", String(b.byteLength)), n.put(g, new Response(b, {
                    headers: u
                })).then(() => o)
            }),
            has: g => n.match(g).then(o => {
                if (!o) return null;
                let c = o.headers.get("Cache-Control").match(/max-age=(\d+)/)[1],
                    x = Date.parse(o.headers.get("Date")) + parseInt(c) * 1e3;
                return Date.now() > x ? null : o
            }),
            del: g => n.delete(g)
        }),
        F = (n, s) => {
            let l = new AbortController,
                r = {
                    signal: l.signal,
                    credential: "include",
                    headers: new Headers(oe),
                    method: String(n).toUpperCase()
                };
            window.addEventListener("offline", () => l.abort(), {
                once: !0
            }), window.addEventListener("popstate", () => l.abort(), {
                once: !0
            });
            let g = 0,
                o = 0,
                c = 0,
                x = 0,
                b = !1,
                E = null,
                u = null,
                T = null,
                k = y => {
                    let $ = () => {
                        let w = () => window.fetch(y, r).then(async m => {
                            if (!m.ok || !T) return m;
                            let i = parseInt(m.headers.get("Content-Length") ?? 0);
                            if (i === 0) return m;
                            let e = [],
                                t = 0,
                                a = m.body.getReader();
                            for (;;) {
                                let {
                                    done: L,
                                    value: C
                                } = await a.read();
                                if (L) break;
                                e.push(C), t += C.length, await T(t, i, window.structuredClone ? window.structuredClone(e) : e)
                            }
                            let v = m.headers.get("Content-Type") ?? "application/octet-stream";
                            return new Response(new Blob(e, {
                                type: v
                            }), {
                                status: m.status,
                                statusText: m.statusText,
                                headers: new Headers(m.headers)
                            })
                        });
                        return g === 0 || !window.isSecureContext ? w() : r.method !== U ? (console.warn("Only method GET can be cached"), w()) : ke.getInstance().then(Z).then(m => m.has(y).then(i => i ? Promise.resolve(i) : m.del(y).then(w).then(e => m.set(y, e, b, g))))
                    };
                    if (o === 0 && c === 0) return $();
                    let I = async () => {
                        try {
                            return await $()
                        } catch (w) {
                            if (w.name === ne) throw w;
                            if (c *= 2, x++, x > o) throw new Error(`Max retries reached: ${w}`);
                            return console.warn(`Retrying fetch (${x}/${o}): ${y.toString()}`), await new Promise(m => window.setTimeout(m, c)), I()
                        }
                    };
                    return I()
                },
                p = y => {
                    if (y.status !== 200) return y;
                    let $ = document.querySelector("a[download]");
                    $ && document.body.removeChild($);
                    let I = y.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1];
                    return y.clone().blob().then(w => {
                        let m = document.createElement("a"),
                            i = window.URL.createObjectURL(w);
                        return m.href = i, m.download = I || `${u}.${E||(w.type.split("/")?.[1]??"bin")}`, document.body.appendChild(m), m.click(), document.body.removeChild(m), window.URL.revokeObjectURL(i), y
                    })
                };
            return {
                send(y = null) {
                    return u && Object.keys(oe).forEach($ => r.headers.delete($)), k(new URL(s, document.body.getAttribute("data-url"))).then($ => u && $.ok ? {
                        code: $.status,
                        data: p($),
                        error: null
                    } : $.json().then(I => {
                        if (I.error) {
                            let w = I.error.at(0),
                                m = $.status >= 500;
                            throw new Error(m ? `ID: ${I.id}
\u{1F7E5} ${w}` : `\u{1F7E8} ${w}`)
                        }
                        return y && (I.data = y(I.data)), Object.assign(I, {
                            code: $.status
                        })
                    })).catch($ => {
                        if ($.name === ne) return console.warn("Fetch aborted:", $), $;
                        throw $.name === xe && ($ = new Error("\u{1F7E5} Network error or rate limit exceeded")), alert($.message || String($)), $
                    })
                },
                withCache(y = 1e3 * 60 * 60 * 6) {
                    return g = y, this
                },
                withForceCache() {
                    return b = !0, this
                },
                withRetry(y = 3, $ = 1e3) {
                    return o = y, c = $, this
                },
                withCancel(y) {
                    return y == null ? this : ((async () => (await y, l.abort()))(), this)
                },
                withDownload(y, $ = null) {
                    return u = y, E = $, this
                },
                withProgressFunc(y = null) {
                    return T = y, this
                },
                default (y = null) {
                    return r.headers = new Headers(y ?? {}), k(s).then($ => u ? p($) : $)
                },
                token(y) {
                    return y.split(".").length === 3 ? (r.headers.append("Authorization", "Bearer " + y), this) : (r.headers.append("x-access-key", y), this)
                },
                body(y) {
                    if (r.method === U) throw new Error("GET method does not support body");
                    return r.body = JSON.stringify(y), this
                }
            }
        };
    var $e = (() => {
            let n = null;
            return {
                getInstance: s => (n || (n = new Map), n.has(s) || n.set(s, window.caches.open(s)), n.get(s))
            }
        })(),
        W = n => {
            let s = new Map,
                l = new Map,
                r = null,
                g = 1e3 * 60 * 60 * 6,
                o = !1,
                c = async () => (!r && window.isSecureContext && (r = await $e.getInstance(n)), r), x = (p, y) => c().then(Z).then($ => {
                    if (!y.ok) throw new Error(y.statusText);
                    return $.set(p, y, o, g)
                }), b = p => c().then(Z).then(y => y.has(p)), E = p => c().then(Z).then(y => y.del(p)), u = (p, y = null) => {
                    if (s.has(p)) return Promise.resolve(s.get(p));
                    if (l.has(p)) return l.get(p);
                    let $ = () => F(U, p).withCancel(y).withRetry().default(),
                        I = c().then(() => window.isSecureContext ? b(p).then(w => w ? Promise.resolve(w) : E(p).then($).then(m => x(p, m))) : $()).then(w => w.blob()).then(w => s.set(p, URL.createObjectURL(w))).then(() => s.get(p)).finally(() => l.delete(p));
                    return l.set(p, I), I
                };
            return {
                run: (p, y = null) => c().then(() => {
                    let $ = new Map;
                    return window.isSecureContext || console.warn("Cache is not supported in insecure context"), p.filter(I => I !== null).forEach(I => {
                        let w = $.get(I.url) ?? [];
                        $.set(I.url, [...w, [I.res, I?.rej]])
                    }), Promise.allSettled(Array.from($).map(([I, w]) => u(I, y).then(m => (w.forEach(i => i[0]?.(m)), m)).catch(m => (w.forEach(i => i[1]?.(m)), m))))
                }),
                del: E,
                has: b,
                set: x,
                get: u,
                open: c,
                download: async (p, y) => {
                    if (!new Map(Array.from(s.entries()).map(([I, w]) => [w, I])).has(p)) try {
                        if (!new URL(p).protocol.includes("blob")) throw new Error("Is not blob")
                    } catch {
                        p = await u(p)
                    }
                    return F(U, p).withDownload(y).default()
                },
                setTtl(p) {
                    return g = Number(p), this
                },
                withForceCache() {
                    return o = !0, this
                }
            }
        };
    var ue = (() => {
        let n = null,
            s = () => {
                let r = document.getElementById("video-love-stroy");
                if (!r || !r.hasAttribute("data-src")) return r?.remove(), S.complete("video", !0), Promise.resolve();
                let g = r.getAttribute("data-src");
                if (!g) return S.complete("video", !0), Promise.resolve();
                let o = document.createElement("video");
                o.className = r.getAttribute("data-vid-class"), o.loop = !0, o.muted = !0, o.controls = !0, o.autoplay = !1, o.playsInline = !0, o.preload = "metadata", o.disableRemotePlayback = !0, o.disablePictureInPicture = !0, o.controlsList = "noremoteplayback nodownload noplaybackrate";
                let c = new IntersectionObserver(E => E.forEach(u => u.isIntersecting ? o.play() : o.pause())),
                    x = E => (o.addEventListener("loadedmetadata", () => {
                        o.style.removeProperty("height"), document.getElementById("video-love-stroy-loading")?.remove()
                    }, {
                        once: !0
                    }), E.clone().blob().then(u => (o.src = URL.createObjectURL(u), E))),
                    b = () => {
                        let E = document.getElementById("progress-bar-video-love-stroy"),
                            u = document.getElementById("progress-info-video-love-stroy");
                        return F(U, g).withCancel(new Promise(T => o.addEventListener("undangan.video.prefetch", T, {
                            once: !0
                        }))).default({
                            Range: "bytes=0-1"
                        }).then(T => {
                            if (o.dispatchEvent(new Event("undangan.video.prefetch")), T.status === 200) return o.preload = "none", o.src = d.escapeHtml(g), r.appendChild(o), Promise.resolve();
                            if (T.status !== 206) throw new Error("failed to fetch video");
                            o.addEventListener("error", () => S.invalid("video"), {
                                once: !0
                            });
                            let k = new Promise(p => o.addEventListener("loadedmetadata", p, {
                                once: !0
                            }));
                            return o.src = d.escapeHtml(g), r.appendChild(o), k
                        }).then(() => {
                            S.complete("video");
                            let T = o.getBoundingClientRect().width * (o.videoHeight / o.videoWidth);
                            return o.style.height = `${T}px`, F(U, o.src).withProgressFunc((k, p) => {
                                let y = Number(k / p * 100).toFixed(0) + "%";
                                E.style.width = y, u.innerText = y
                            }).withRetry().default().then(x).catch(k => {
                                E.style.backgroundColor = "red", u.innerText = "Error loading video", console.error(k)
                            }).finally(() => c.observe(o))
                        })
                    };
                return window.isSecureContext ? n.has(g).then(E => E ? (S.complete("video"), x(E).finally(() => {
                    r.appendChild(o), c.observe(o)
                })) : n.del(g).then(b).then(u => n.set(g, u))) : b()
            };
        return {
            init: () => (S.add(), n = W("video").withForceCache(), {
                load: s
            })
        }
    })();
    var fe = (() => {
        let n = null,
            s = null,
            l = !1,
            r = [],
            g = k => new Promise((p, y) => {
                let $ = new Image;
                $.onload = () => p($), $.onerror = y, $.src = k
            }),
            o = (k, p) => g(p).then(y => {
                k.width = y.naturalWidth, k.height = y.naturalHeight, k.src = y.src, y.remove(), S.complete("image")
            }),
            c = k => {
                r.push({
                    url: k.getAttribute("data-src"),
                    res: p => o(k, p),
                    rej: p => {
                        console.error(p), S.invalid("image")
                    }
                })
            },
            x = k => {
                k.onerror = () => S.invalid("image"), k.onload = () => {
                    k.width = k.naturalWidth, k.height = k.naturalHeight, S.complete("image")
                }, k.complete && k.naturalWidth !== 0 && k.naturalHeight !== 0 ? S.complete("image") : k.complete && S.invalid("image")
            },
            b = () => l,
            E = async () => {
                let k = Array.from(n);
                k.filter(p => p.getAttribute("data-fetch-img") !== "high").forEach(p => {
                    p.hasAttribute("data-src") ? c(p) : x(p)
                }), l && (await s.open(), await Promise.allSettled(k.filter(p => p.getAttribute("data-fetch-img") === "high").map(p => s.get(p.getAttribute("data-src"), S.getAbort()).then(y => o(p, y)).then(() => p.classList.remove("opacity-0")))), await s.run(r, S.getAbort()))
            }, u = k => s.download(k, `image_${Date.now()}`);
        return {
            init: () => (s = W("image").withForceCache(), n = document.querySelectorAll("img"), n.forEach(S.add), l = Array.from(n).some(k => k.hasAttribute("data-src")), {
                load: E,
                download: u,
                hasDataSrc: b
            })
        }
    })();
    var ge = (() => {
        let n = '<i class="fa-solid fa-circle-pause spin-button"></i>',
            s = '<i class="fa-solid fa-circle-play"></i>',
            l = async (g = !0) => {
                let o = document.body.getAttribute("data-audio");
                if (!o) {
                    S.complete("audio", !0);
                    return
                }
                let c = null;
                try {
                    c = new Audio(await W("audio").withForceCache().get(o, S.getAbort())), c.loop = !0, c.muted = !1, c.autoplay = !1, c.controls = !1, S.complete("audio")
                } catch {
                    S.invalid("audio");
                    return
                }
                let x = !1,
                    b = document.getElementById("button-music"),
                    E = async () => {
                        if (!(!navigator.onLine || !b)) {
                            b.disabled = !0;
                            try {
                                await c.play(), x = !0, b.disabled = !1, b.innerHTML = n
                            } catch (T) {
                                x = !1, d.notify(T).error()
                            }
                        }
                    }, u = () => {
                        x = !1, c.pause(), b.innerHTML = s
                    };
                document.addEventListener("undangan.open", () => {
                    b.classList.remove("d-none"), g && E()
                }), b.addEventListener("offline", u), b.addEventListener("click", () => x ? u() : E())
            };
        return {
            init: () => (S.add(), {
                load: l
            })
        }
    })();
    var pe = {
        tab: l => window.bootstrap.Tab.getOrCreateInstance(document.getElementById(l)),
        modal: l => window.bootstrap.Modal.getOrCreateInstance(document.getElementById(l))
    };
    var Ce = "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css",
        Ie = "https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js",
        Se = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js",
        Be = n => {
            let s = () => n.get(Ce).then(r => new Promise((g, o) => {
                    let c = document.createElement("link");
                    c.onload = g, c.onerror = o, c.rel = "stylesheet", c.href = r, document.head.appendChild(c)
                })),
                l = () => n.get(Ie).then(r => new Promise((g, o) => {
                    let c = document.createElement("script");
                    c.onload = g, c.onerror = o, c.src = r, document.head.appendChild(c)
                }));
            return Promise.all([s(), l()]).then(() => {
                if (typeof window.AOS > "u") throw new Error("AOS library failed to load");
                window.AOS.init()
            })
        },
        Me = n => n.get(Se).then(s => new Promise((l, r) => {
            let g = document.createElement("script");
            g.onerror = r, g.onload = () => {
                typeof window.confetti > "u" ? r(new Error("Confetti library failed to load")) : l()
            }, g.src = s, document.head.appendChild(g)
        })),
        he = (n = {}) => {
            let s = W("libs");
            return s.open().then(() => {
                let l = [];
                return (n?.aos ?? !0) && l.push(Be(s)), (n?.confetti ?? !0) && l.push(Me(s)), Promise.all(l)
            })
        };
    var P = n => {
        let s = (c = null) => {
                let x = JSON.parse(localStorage.getItem(n));
                return c ? x[String(c)] : x
            },
            l = (c, x) => {
                let b = s();
                b[String(c)] = x, localStorage.setItem(n, JSON.stringify(b))
            },
            r = c => Object.keys(s()).includes(String(c)),
            g = c => {
                if (!r(c)) return;
                let x = s();
                delete x[String(c)], localStorage.setItem(n, JSON.stringify(x))
            },
            o = () => localStorage.setItem(n, "{}");
        return localStorage.getItem(n) || o(), {
            set: l,
            get: s,
            has: r,
            clear: o,
            unset: g
        }
    };
    var ee = (() => {
        let n = {
                "#000000": "#ffffff",
                "#ffffff": "#000000",
                "#212529": "#f8f9fa",
                "#f8f9fa": "#212529"
            },
            s = ["#ffffff", "#f8f9fa"],
            l = ["#000000", "#212529"],
            r = !1,
            g = null,
            o = null,
            c = () => g.set("active", "light"),
            x = () => g.set("active", "dark"),
            b = I => {
                let w = o.getAttribute("content");
                o.setAttribute("content", I.some(m => m === w) ? n[w] : w)
            },
            E = () => {
                c(), document.documentElement.setAttribute("data-bs-theme", "light"), b(l)
            },
            u = () => {
                x(), document.documentElement.setAttribute("data-bs-theme", "dark"), b(s)
            },
            T = (I = null, w = null) => {
                let m = g.get("active") === "dark";
                return I && w ? m ? I : w : m
            };
        return {
            init: () => {
                switch (g = P("theme"), o = document.querySelector('meta[name="theme-color"]'), g.has("active") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? x() : c()), document.documentElement.getAttribute("data-bs-theme")) {
                    case "dark":
                        x();
                        break;
                    case "light":
                        c();
                        break;
                    default:
                        r = !0
                }
                T() ? u() : E()
            },
            spyTop: () => {
                let I = m => m.filter(i => i.isIntersecting).forEach(i => {
                        let e = i.target.classList.contains("bg-white-black") ? T(l[0], s[0]) : T(l[1], s[1]);
                        o.setAttribute("content", e)
                    }),
                    w = new IntersectionObserver(I, {
                        rootMargin: "0% 0% -95% 0%"
                    });
                document.querySelectorAll("section").forEach(m => w.observe(m))
            },
            change: () => T() ? E() : u(),
            isDarkMode: T,
            isAutoMode: () => r
        }
    })();
    var J = (() => {
        let n = {
                id: "ID",
                en: "US",
                fr: "FR",
                de: "DE",
                es: "ES",
                zh: "CN",
                ja: "JP",
                ko: "KR",
                ar: "SA",
                ru: "RU",
                it: "IT",
                nl: "NL",
                pt: "PT",
                tr: "TR",
                th: "TH",
                vi: "VN",
                ms: "MY",
                hi: "IN"
            },
            s = null,
            l = null,
            r = null,
            g = null;
        return {
            on(o, c) {
                return g.set(o, c), this
            },
            get() {
                let o = g.get(r);
                return g.clear(), o
            },
            getCountry() {
                return s
            },
            getLocale() {
                return l
            },
            getLanguage() {
                return r
            },
            setDefault(o) {
                let c = !0;
                n[o] || (c = !1, console.warn("Language not found, please add manually in countryMapping")), s = c ? n[o] : "US", r = c ? o : "en", l = `${r}_${s}`
            },
            init() {
                g = new Map, this.setDefault(navigator.language.split("-").shift())
            }
        }
    })();
    var z = (() => {
        let n = ({
                uuid: u,
                own: T,
                name: k,
                presence: p,
                comment: y,
                created_at: $,
                is_admin: I,
                is_parent: w,
                gif_url: m,
                ip: i,
                user_agent: e,
                comments: t,
                like_count: a
            }) => ({
                uuid: u,
                own: T,
                name: k,
                presence: p,
                comment: y,
                created_at: $,
                is_admin: I ?? !1,
                is_parent: w,
                gif_url: m,
                ip: i,
                user_agent: e,
                comments: t?.map(n) ?? [],
                like_count: a ?? 0
            }),
            s = u => u.map(n);
        return {
            uuidResponse: ({
                uuid: u
            }) => ({
                uuid: u
            }),
            tokenResponse: ({
                token: u
            }) => ({
                token: u
            }),
            statusResponse: ({
                status: u
            }) => ({
                status: u
            }),
            getCommentResponse: n,
            getCommentsResponse: s,
            getCommentsResponseV2: u => ({
                count: u.count,
                lists: s(u.lists)
            }),
            commentShowMore: (u, T = !1) => ({
                uuid: u,
                show: T
            }),
            postCommentRequest: (u, T, k, p, y) => ({
                id: u,
                name: T,
                presence: k,
                comment: p,
                gif_id: y
            }),
            postSessionRequest: (u, T) => ({
                email: u,
                password: T
            }),
            updateCommentRequest: (u, T, k) => ({
                presence: u,
                comment: T,
                gif_id: k
            })
        }
    })();
    var O = (() => {
        let n = null,
            s = () => n.get("token"),
            l = E => n.set("token", E),
            r = E => F(X, "/api/session").body(E).send(z.tokenResponse).then(u => (u.code === 200 && l(u.data.token), u.code === 200)),
            g = () => n.unset("token"),
            o = () => String(s() ?? ".").split(".").length === 3;
        return {
            init: () => {
                n = P("session")
            },
            guest: E => F(U, "/api/v2/config").withCache(1e3 * 60 * 30).withForceCache().token(E).send().then(u => {
                if (u.code !== 200) throw new Error("failed to get config.");
                let T = P("config");
                for (let [k, p] of Object.entries(u.data)) T.set(k, p);
                return l(E), u
            }),
            login: r,
            logout: g,
            decode: () => {
                if (!o()) return null;
                try {
                    return JSON.parse(d.base64Decode(s().split(".")[1]))
                } catch {
                    return null
                }
            },
            isAdmin: o,
            setToken: l,
            getToken: s
        }
    })();
    var be = (() => {
        let n = null,
            s = !0,
            l = ["input[data-offline-disabled]", "button[data-offline-disabled]", "select[data-offline-disabled]", "textarea[data-offline-disabled]"],
            r = () => s,
            g = () => {
                let T = n.firstElementChild.firstElementChild;
                T.classList.remove("bg-success"), T.classList.add("bg-danger"), T.firstElementChild.innerHTML = '<i class="fa-solid fa-ban me-2"></i>Koneksi tidak tersedia'
            },
            o = () => {
                let T = n.firstElementChild.firstElementChild;
                T.classList.remove("bg-danger"), T.classList.add("bg-success"), T.firstElementChild.innerHTML = '<i class="fa-solid fa-cloud me-2"></i>Koneksi tersedia kembali'
            },
            c = async () => {
                s && (await d.changeOpacity(n, !1), g())
            }, x = () => {
                document.querySelectorAll(l.join(", ")).forEach(T => {
                    T.dispatchEvent(new Event(r() ? "online" : "offline")), T.setAttribute("data-offline-disabled", r() ? "false" : "true"), T.tagName === "BUTTON" ? r() ? T.classList.remove("disabled") : T.classList.add("disabled") : r() ? T.removeAttribute("disabled") : T.setAttribute("disabled", "true")
                })
            }, b = () => {
                s = !1, g(), d.changeOpacity(n, !0), x()
            }, E = () => {
                s = !0, o(), d.timeOut(c, 3e3), x()
            };
        return {
            init: () => {
                window.addEventListener("online", E), window.addEventListener("offline", b), n = document.createElement("div"), n.classList.add("fixed-top", "pe-none"), n.style.cssText = "opacity: 0; z-index: 1057;", n.innerHTML = `
        <div class="d-flex justify-content-center mx-auto">
            <div class="d-flex justify-content-center align-items-center rounded-pill my-2 bg-danger shadow">
                <small class="text-center py-1 px-2 mx-1 mt-1 mb-0 text-white" style="font-size: 0.8rem;"></small>
            </div>
        </div>`, document.body.insertBefore(n, document.body.lastChild)
            },
            isOnline: r
        }
    })();
    var R = (() => {
        let n = "default",
            s = {
                128: 2,
                256: 3,
                512: 4,
                768: 5
            },
            l = null,
            r = null,
            g = null,
            o = null,
            c = (h, f, A = null) => {
                let M = r.get(h);
                return f.map(D => {
                    let {
                        id: N,
                        media_formats: {
                            tinygif: {
                                url: j
                            }
                        },
                        content_description: H
                    } = D;
                    M.pointer === -1 || M.pointer === M.col - 1 ? M.pointer = 0 : M.pointer++;
                    let te = M.lists.childNodes[M.pointer] ?? null;
                    return te ? {
                        url: j,
                        res: ie => {
                            te.insertAdjacentHTML("beforeend", `
                <figure class="hover-wrapper m-0 position-relative">
                    <button onclick="undangan.comment.gif.click(this, '${M.uuid}', '${N}', '${d.base64Encode(j)}')" class="btn hover-area position-absolute justify-content-center align-items-center top-0 end-0 bg-overlay-auto p-1 m-1 rounded-circle border shadow-sm z-1">
                        <i class="fa-solid fa-circle-check"></i>
                    </button>
                    <img src="${ie}" class="img-fluid" alt="${d.escapeHtml(H)}" style="width: 100%;">
                </figure>`), A?.step()
                        }
                    } : null
                })
            },
            x = () => l.open(),
            b = h => l.get(h),
            E = h => {
                let f = r.get(h),
                    A = f.lists,
                    M = document.getElementById(`gif-loading-${f.uuid}`),
                    D = document.getElementById(`progress-bar-${f.uuid}`),
                    N = document.getElementById(`progress-info-${f.uuid}`),
                    j = 0,
                    H = 0;
                A.setAttribute("data-continue", "false"), A.classList.replace("overflow-y-scroll", "overflow-y-hidden");
                let te = 150,
                    re = !1,
                    ie = setTimeout(() => {
                        re || (N.innerText = `${H}/${j}`, A.classList.contains("d-none") || M.classList.replace("d-none", "d-flex"))
                    }, te);
                return {
                    release: () => {
                        re = !0, clearTimeout(ie), A.classList.contains("d-none") || M.classList.replace("d-flex", "d-none"), D.style.width = "0%", N.innerText = `${H}/${j}`, A.setAttribute("data-continue", "true"), A.classList.replace("overflow-y-hidden", "overflow-y-scroll")
                    },
                    until: Ee => {
                        j = Ee, N.innerText = `${H}/${j}`
                    },
                    step: () => {
                        H += 1, N.innerText = `${H}/${j}`, D.style.width = Math.min(H / j * 100, 100).toString() + "%"
                    }
                }
            },
            u = (h, f, A) => {
                A = {
                    media_filter: "tinygif",
                    client_key: "undangan_app",
                    key: o.get("tenor_key"),
                    country: J.getCountry(),
                    locale: J.getLocale(),
                    ...A ?? {}
                };
                let M = Object.keys(A).filter(H => A[H] !== null && A[H] !== void 0).map(H => `${H}=${encodeURIComponent(A[H])}`).join("&"),
                    D = E(h),
                    N = r.get(h),
                    j = new Promise(H => {
                        N.reqs.push(H)
                    });
                N.last = F(U, `https://tenor.googleapis.com/v2${f}?${M}`).withCache().withRetry().withCancel(j).default(oe).then(H => H.json()).then(H => {
                    if (H.error) throw new Error(H.error.message);
                    return H.results.length === 0 ? H : (N.next = H?.next, D.until(H.results.length), N.gifs.push(...H.results), l.run(c(h, H.results, D), j))
                }).catch(H => {
                    H.name === ne ? console.warn("Fetch abort:", H) : d.notify(H).error()
                }).finally(() => D.release())
            },
            T = h => (h = d.escapeHtml(h), `
        <label for="gif-search-${h}" class="form-label my-1"><i class="fa-solid fa-photo-film me-2"></i>Gif</label>

        <div class="d-flex mb-3" id="gif-search-nav-${h}">
            <button class="btn btn-secondary btn-sm rounded-4 shadow-sm me-1 my-1" onclick="undangan.comment.gif.back(this, '${h}')" data-offline-disabled="false"><i class="fa-solid fa-arrow-left"></i></button>
            <input type="text" name="gif-search" id="gif-search-${h}" autocomplete="on" class="form-control shadow-sm rounded-4" placeholder="Search for a GIF on Tenor" data-offline-disabled="false">
        </div>

        <div class="position-relative">
            <div class="position-absolute d-flex flex-column justify-content-center align-items-center top-50 start-50 translate-middle w-100 h-100 bg-overlay-auto rounded-4 z-3" id="gif-loading-${h}">
                <div class="progress w-25" role="progressbar" style="height: 0.5rem;" aria-label="progress bar">
                    <div class="progress-bar" id="progress-bar-${h}" style="width: 0%"></div>
                </div>
                <small class="mt-1 text-theme-auto bg-theme-auto py-0 px-2 rounded-4" id="progress-info-${h}" style="font-size: 0.7rem;"></small>
            </div>
            <div id="gif-lists-${h}" class="d-flex rounded-4 p-0 overflow-y-scroll border" data-continue="true" style="height: 15rem;"></div>
        </div>

        <figure class="d-flex m-0 position-relative" id="gif-result-${h}">
            <button onclick="undangan.comment.gif.cancel('${h}')" id="gif-cancel-${h}" class="btn d-none position-absolute justify-content-center align-items-center top-0 end-0 bg-overlay-auto p-2 m-0 rounded-circle border shadow-sm z-1">
                <i class="fa-solid fa-circle-xmark"></i>
            </button>
        </figure>`),
            k = async h => {
                let f = r.get(h);
                f.reqs.forEach(A => A()), f.reqs.length = 0, f.last && (await f.last, f.last = null)
            }, p = async h => {
                await k(h);
                let f = r.get(h),
                    A = f.col ?? 0,
                    M = 0;
                for (let [D, N] of Object.entries(s)) M = N, f.lists.clientWidth >= parseInt(D) && (f.col = M);
                if (f.col === null && (f.col = M), A !== f.col && (f.pointer = -1, f.limit = f.col * 5, f.lists.innerHTML = '<div class="d-flex flex-column"></div>'.repeat(f.col), f.gifs.length !== 0)) {
                    try {
                        await l.run(c(h, f.gifs))
                    } catch {
                        f.gifs.length = 0
                    }
                    A !== f.col && f.lists.scroll({
                        top: f.lists.scrollHeight,
                        behavior: "instant"
                    }), f.gifs.length === 0 && await p(h)
                }
            }, y = async h => {
                let f = r.get(h);
                if (f.lists.getAttribute("data-continue") !== "true" || !f.next || f.next.length === 0) return;
                let A = f.query && f.query.trim().length > 0,
                    M = {
                        pos: f.next,
                        limit: f.limit
                    };
                A && (M.q = f.query), f.lists.scrollTop > (f.lists.scrollHeight - f.lists.clientHeight) * .8 && (await p(h), u(h, A ? "/search" : "/featured", M))
            }, $ = async (h, f = null) => {
                let A = r.get(h);
                A.query = f !== null ? f : A.query, (!A.query || A.query.trim().length === 0) && (A.query = null), A.col = null, A.next = null, A.pointer = -1, A.gifs.length = 0, await p(h), u(h, A.query === null ? "/featured" : "/search", {
                    q: A.query,
                    limit: A.limit
                })
            }, I = async (h, f, A, M) => {
                let D = d.disableButton(h, d.loader.replace("me-1", "me-0"), !0),
                    N = document.getElementById(`gif-result-${f}`);
                N.setAttribute("data-id", A), N.querySelector(`#gif-cancel-${f}`).classList.replace("d-none", "d-flex"), N.insertAdjacentHTML("beforeend", `<img src="${await b(d.base64Decode(M))}" class="img-fluid mx-auto gif-image rounded-4" alt="selected-gif">`), D.restore(), r.get(f).lists.classList.replace("d-flex", "d-none"), document.getElementById(`gif-search-nav-${f}`).classList.replace("d-flex", "d-none")
            }, w = h => {
                let f = document.getElementById(`gif-result-${h}`);
                f.removeAttribute("data-id"), f.querySelector(`#gif-cancel-${h}`).classList.replace("d-flex", "d-none"), f.querySelector("img").remove(), r.get(h).lists.classList.replace("d-none", "d-flex"), document.getElementById(`gif-search-nav-${h}`).classList.replace("d-none", "d-flex")
            }, m = async (h = null) => {
                h ? r.has(h) && (await k(h), g.delete(h), r.delete(h)) : (await Promise.allSettled(Array.from(r.keys()).map(f => k(f))), g.clear(), r.clear())
            }, i = async (h, f) => {
                let A = d.disableButton(h, d.loader.replace("me-1", "me-0"), !0);
                await k(f), A.restore(), document.getElementById(`gif-form-${f}`).classList.toggle("d-none", !0), document.getElementById(`comment-form-${f}`)?.classList.toggle("d-none", !1)
            }, e = h => {
                if (!r.has(h)) {
                    d.safeInnerHTML(document.getElementById(`gif-form-${h}`), T(h));
                    let f = document.getElementById(`gif-lists-${h}`);
                    r.set(h, {
                        uuid: h,
                        lists: f,
                        last: null,
                        limit: null,
                        query: null,
                        next: null,
                        col: null,
                        pointer: -1,
                        gifs: [],
                        reqs: []
                    });
                    let A = d.debounce(y, 150);
                    f.addEventListener("scroll", () => A(h));
                    let M = d.debounce($, 850);
                    document.getElementById(`gif-search-${h}`).addEventListener("input", D => M(h, D.target.value))
                }
                return document.getElementById(`gif-form-${h}`).classList.toggle("d-none", !1), document.getElementById(`comment-form-${h}`)?.classList.toggle("d-none", !0), g.has(h) && g.get(h)(), $(h)
            }, t = h => {
                let f = document.getElementById(`gif-form-${h}`);
                return f && !f.classList.contains("d-none")
            }, a = h => document.getElementById(`gif-result-${h}`)?.getAttribute("data-id"), v = h => document.querySelector(`[for="gif-search-${h}"]`)?.remove(), L = h => document.querySelector(`[onclick="undangan.comment.gif.back(this, '${h}')"]`)?.remove(), C = (h, f) => g.set(h, f), B = (h = null) => {
                let f = document.getElementById(`gif-cancel-${h||n}`);
                return {
                    show: () => f.classList.replace("d-none", "d-flex"),
                    hide: () => f.classList.replace("d-flex", "d-none"),
                    click: () => f.dispatchEvent(new Event("click"))
                }
            }, _ = () => !!o.get("tenor_key"), q = () => {
                document.querySelector('[onclick="undangan.comment.gif.open(undangan.comment.gif.default)"]')?.classList.toggle("d-none", !o.get("tenor_key"))
            };
        return {
            default: n,
            init: () => {
                l = W("gif"), r = new Map, g = new Map, o = P("config"), document.addEventListener("undangan.session", q)
            },
            get: b,
            back: i,
            open: e,
            cancel: w,
            click: I,
            remove: m,
            isOpen: t,
            onOpen: C,
            isActive: _,
            getResultId: a,
            buttonCancel: B,
            removeGifSearch: v,
            removeButtonBack: L,
            prepareCache: x
        }
    })();
    var G = (() => {
        let n = null,
            s = null,
            l = null,
            r = null,
            g = 300,
            o = () => `
        <div class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4">
            <div class="d-flex justify-content-between align-items-center placeholder-wave">
                <span class="placeholder bg-secondary col-5 rounded-3 my-1"></span>
                <span class="placeholder bg-secondary col-3 rounded-3 my-1"></span>
            </div>
            <hr class="my-1">
            <p class="placeholder-wave m-0">
                <span class="placeholder bg-secondary col-6 rounded-3"></span>
                <span class="placeholder bg-secondary col-5 rounded-3"></span>
                <span class="placeholder bg-secondary col-12 rounded-3 my-1"></span>
            </p>
        </div>`,
            c = e => `
        <button style="font-size: 0.8rem;" onclick="undangan.comment.like.love(this)" data-uuid="${e.uuid}" class="btn btn-sm btn-outline-auto ms-auto rounded-3 p-0 shadow-sm d-flex justify-content-start align-items-center" data-offline-disabled="false">
            <span class="my-0 mx-1" data-count-like="${e.like_count}">${e.like_count}</span>
            <i class="me-1 ${s.has(e.uuid)?"fa-solid fa-heart text-danger":"fa-regular fa-heart"}"></i>
        </button>`,
            x = e => {
                let t = `<div class="d-flex justify-content-start align-items-center" data-button-action="${e.uuid}">`;
                return l.get("can_reply") !== !1 && (t += `<button style="font-size: 0.8rem;" onclick="undangan.comment.reply('${e.uuid}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Reply</button>`), O.isAdmin() && e.is_admin && (!e.gif_url || R.isActive()) ? t += `<button style="font-size: 0.8rem;" onclick="undangan.comment.edit(this, ${e.is_parent?"true":"false"})" data-uuid="${e.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-own="${e.own}" data-offline-disabled="false">Edit</button>` : n.has(e.uuid) && l.get("can_edit") !== !1 && (!e.gif_url || R.isActive()) && (t += `<button style="font-size: 0.8rem;" onclick="undangan.comment.edit(this, ${e.is_parent?"true":"false"})" data-uuid="${e.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Edit</button>`), O.isAdmin() ? t += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${e.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-own="${e.own}" data-offline-disabled="false">Delete</button>` : n.has(e.uuid) && l.get("can_delete") !== !1 && (t += `<button style="font-size: 0.8rem;" onclick="undangan.comment.remove(this)" data-uuid="${e.uuid}" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1 shadow-sm" data-offline-disabled="false">Delete</button>`), t += "</div>", t
            },
            b = (e, t) => {
                e = d.escapeHtml(e);
                let a = r.get("show").includes(e);
                return `<a class="text-theme-auto" style="font-size: 0.8rem;" onclick="undangan.comment.showOrHide(this)" data-uuid="${e}" data-uuids="${d.escapeHtml(t.join(","))}" data-show="${a?"true":"false"}" role="button" class="me-auto ms-1 py-0">${a?"Hide replies":`Show replies (${t.length})`}</a>`
            },
            E = e => `
        <div class="d-flex justify-content-between align-items-center" id="button-${e.uuid}">
            ${x(e)}
            ${e.comments.length>0?b(e.uuid,e.comments.map(t=>t.uuid)):""}
            ${c(e)}
        </div>`,
            u = e => !e.ip || !e.user_agent || e.is_admin ? "" : `
        <div class="mb-1 mt-3">
            <p class="text-theme-auto mb-1 mx-0 mt-0 p-0" style="font-size: 0.7rem;" id="ip-${e.uuid}"><i class="fa-solid fa-location-dot me-1"></i>${d.escapeHtml(e.ip)} <span class="mb-1 placeholder col-2 rounded-3"></span></p>
            <p class="text-theme-auto m-0 p-0" style="font-size: 0.7rem;"><i class="fa-solid fa-mobile-screen-button me-1"></i>${d.parseUserAgent(d.escapeHtml(e.user_agent))}</p>
        </div>`,
            T = e => e.is_parent ? 'class="bg-theme-auto shadow p-3 mx-0 mt-0 mb-3 rounded-4"' : `class="${r.get("hidden").find(t=>t.uuid===e.uuid).show?"":"d-none"} overflow-x-scroll mw-100 border-start bg-theme-auto py-2 ps-2 pe-0 my-2 ms-2 me-0"`,
            k = e => e.is_admin ? `<strong class="me-1">${d.escapeHtml(e.name)}</strong><i class="fa-solid fa-certificate text-primary"></i>` : e.is_parent ? `<strong class="me-1">${d.escapeHtml(e.name)}</strong><i id="badge-${e.uuid}" data-is-presence="${e.presence?"true":"false"}" class="fa-solid ${e.presence?"fa-circle-check text-success":"fa-circle-xmark text-danger"}"></i>` : `<strong>${d.escapeHtml(e.name)}</strong>`,
            p = async e => {
                let t = `
        <div class="d-flex justify-content-between align-items-center">
            <p class="text-theme-auto text-truncate m-0 p-0" style="font-size: 0.95rem;">${k(e)}</p>
            <small class="text-theme-auto m-0 p-0" style="font-size: 0.75rem;">${e.created_at}</small>
        </div>
        <hr class="my-1">`;
                if (e.gif_url) return t + `
            <div class="d-flex justify-content-center align-items-center my-2">
                <img src="${await R.get(e.gif_url)}" id="img-gif-${e.uuid}" class="img-fluid mx-auto gif-image rounded-4" alt="selected-gif">
            </div>`;
                let a = e.comment.length > g,
                    v = d.convertMarkdownToHTML(d.escapeHtml(a ? e.comment.slice(0, g) + "..." : e.comment));
                return t + `
        <p class="text-theme-auto my-1 mx-0 p-0" style="white-space: pre-wrap !important; font-size: 0.95rem;" data-comment="${d.base64Encode(e.comment)}" id="content-${e.uuid}">${v}</p>
        ${a?`<p class="d-block mb-2 mt-0 mx-0 p-0"><a class="text-theme-auto" role="button" style="font-size: 0.85rem;" data-show="false" onclick="undangan.comment.showMore(this, '${e.uuid}')">Selengkapnya</a></p>`:""}`
            }, y = async e => {
                let t = await p(e),
                    a = await Promise.all(e.comments.map(v => y(v)));
                return `
        <div ${T(e)} id="${e.uuid}" style="overflow-wrap: break-word !important;">
            <div id="body-content-${e.uuid}" data-tapTime="0" data-liked="false" tabindex="0">${t}</div>
            ${u(e)}
            ${E(e)}
            <div id="reply-content-${e.uuid}">${a.join("")}</div>
        </div>`
            };
        return {
            init: () => {
                n = P("owns"), s = P("likes"), l = P("config"), r = P("comment")
            },
            renderEdit: (e, t, a, v) => {
                e = d.escapeHtml(e);
                let L = document.createElement("div");
                L.classList.add("my-2"), L.id = `inner-${e}`;
                let C = `
        <p class="my-1 mx-0 p-0" style="font-size: 0.95rem;"><i class="fa-solid fa-pen me-2"></i>Edit</p>
        ${a?`
        <select class="form-select shadow-sm mb-2 rounded-4" id="form-inner-presence-${e}" data-offline-disabled="false">
            <option value="1" ${t?"selected":""}>&#9989; Datang</option>
            <option value="2" ${t?"":"selected"}>&#10060; Berhalangan</option>
        </select>`:""}
        ${v?`${R.isActive()?`<div class="d-none mb-2" id="gif-form-${e}"></div>`:""}`:`<textarea class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${e}" minlength="1" maxlength="1000" placeholder="Type update comment" rows="3" data-offline-disabled="false"></textarea>    
        `}
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel(this, '${e}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.update(this)" data-uuid="${e}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Update</button>
        </div>`;
                return d.safeInnerHTML(L, C)
            },
            renderReply: e => {
                e = d.escapeHtml(e);
                let t = document.createElement("div");
                t.classList.add("my-2"), t.id = `inner-${e}`;
                let a = `
        <p class="my-1 mx-0 p-0" style="font-size: 0.95rem;"><i class="fa-solid fa-reply me-2"></i>Reply</p>
        <div class="d-block mb-2" id="comment-form-${e}">
            <div class="position-relative">
                ${R.isActive()?`<button class="btn btn-secondary btn-sm rounded-4 shadow-sm me-1 my-1 position-absolute bottom-0 end-0" onclick="undangan.comment.gif.open('${e}')" aria-label="button gif" data-offline-disabled="false"><i class="fa-solid fa-photo-film"></i></button>`:""}
                <textarea class="form-control shadow-sm rounded-4 mb-2" id="form-inner-${e}" minlength="1" maxlength="1000" placeholder="Type reply comment" rows="3" data-offline-disabled="false"></textarea>
            </div>
        </div>
        <div class="d-none mb-2" id="gif-form-${e}"></div>
        <div class="d-flex justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="undangan.comment.cancel(this, '${e}')" class="btn btn-sm btn-outline-auto rounded-4 py-0 me-1" data-offline-disabled="false">Cancel</button>
            <button style="font-size: 0.8rem;" onclick="undangan.comment.send(this)" data-uuid="${e}" class="btn btn-sm btn-outline-auto rounded-4 py-0" data-offline-disabled="false">Send</button>
        </div>`;
                return d.safeInnerHTML(t, a)
            },
            renderLoading: o,
            renderReadMore: b,
            renderContentMany: e => R.prepareCache().then(() => Promise.all(e.map(t => y(t)))).then(t => t.join("")),
            renderContentSingle: e => R.prepareCache().then(() => y(e)),
            maxCommentLength: g
        }
    })();
    var ye = () => window.confetti.shapeFromPath({
            path: "M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z",
            matrix: [.03333333333333333, 0, 0, .03333333333333333, -5.566666666666666, -5.533333333333333]
        }),
        we = () => {
            window.confetti && window.confetti({
                origin: {
                    y: 1
                },
                zIndex: 1057
            })
        },
        ve = (n = 15) => {
            if (!window.confetti) return;
            let s = n * 1e3,
                l = Date.now() + s,
                r = ye(),
                g = ["#FFC0CB", "#FF1493", "#C71585"],
                o = (x, b) => Math.random() * (b - x) + x,
                c = () => {
                    let x = l - Date.now();
                    g.forEach(b => {
                        window.confetti({
                            particleCount: 1,
                            startVelocity: 0,
                            ticks: Math.max(50, 75 * (x / s)),
                            origin: {
                                x: Math.random(),
                                y: Math.abs(Math.random() - x / s)
                            },
                            zIndex: 1057,
                            colors: [b],
                            shapes: [r],
                            drift: o(-.5, .5),
                            gravity: o(.5, 1),
                            scalar: o(.5, 1)
                        })
                    }), x > 0 && requestAnimationFrame(c)
                };
            requestAnimationFrame(c)
        },
        se = (n, s = 50) => {
            if (!window.confetti) return;
            let l = Date.now() + s,
                r = n.getBoundingClientRect(),
                g = Math.max(.3, Math.min(1, r.top / window.innerHeight + .2)),
                o = ye(),
                c = ["#FF69B4", "#FF1493"],
                x = () => {
                    c.forEach(b => {
                        window.confetti({
                            particleCount: 2,
                            angle: 60,
                            spread: 55,
                            shapes: [o],
                            origin: {
                                x: r.left / window.innerWidth,
                                y: g
                            },
                            zIndex: 1057,
                            colors: [b]
                        }), window.confetti({
                            particleCount: 2,
                            angle: 120,
                            spread: 55,
                            shapes: [o],
                            origin: {
                                x: r.right / window.innerWidth,
                                y: g
                            },
                            zIndex: 1057,
                            colors: [b]
                        })
                    }), Date.now() < l && requestAnimationFrame(x)
                };
            requestAnimationFrame(x)
        };
    var K = (() => {
        let n = null,
            s = null,
            l = async b => {
                let E = b.firstElementChild,
                    u = b.lastElementChild,
                    T = b.getAttribute("data-uuid"),
                    k = parseInt(E.getAttribute("data-count-like"));
                b.disabled = !0, navigator.vibrate && navigator.vibrate(100), n.has(T) ? await F(de, "/api/comment/" + n.get(T)).token(O.getToken()).send(z.statusResponse).then(p => {
                    p.data.status && (n.unset(T), u.classList.remove("fa-solid", "text-danger"), u.classList.add("fa-regular"), E.setAttribute("data-count-like", String(k - 1)))
                }).finally(() => {
                    E.innerText = E.getAttribute("data-count-like"), b.disabled = !1
                }) : await F(X, "/api/comment/" + T).token(O.getToken()).send(z.uuidResponse).then(p => {
                    p.code === 201 && (n.set(T, p.data.uuid), u.classList.remove("fa-regular"), u.classList.add("fa-solid", "text-danger"), E.setAttribute("data-count-like", String(k + 1)))
                }).finally(() => {
                    E.innerText = E.getAttribute("data-count-like"), b.disabled = !1
                })
            }, r = b => document.querySelector(`button[onclick="undangan.comment.like.love(this)"][data-uuid="${b}"]`), g = async b => {
                if (!navigator.onLine) return;
                let E = Date.now(),
                    u = E - parseInt(b.getAttribute("data-tapTime")),
                    T = b.id.replace("body-content-", ""),
                    k = u < 300 && u > 0,
                    p = !n.has(T) && b.getAttribute("data-liked") !== "true";
                k && p && (se(b), b.setAttribute("data-liked", "true"), await l(r(T)), b.setAttribute("data-liked", "false")), b.setAttribute("data-tapTime", String(E))
            };
        return {
            init: () => {
                s = new Map, n = P("likes")
            },
            love: l,
            getButtonLike: r,
            addListener: b => {
                let E = new AbortController,
                    u = document.getElementById(`body-content-${b}`);
                u.addEventListener("touchend", () => g(u), {
                    signal: E.signal
                }), s.set(b, E)
            },
            removeListener: b => {
                let E = s.get(b);
                E && (E.abort(), s.delete(b))
            }
        }
    })();
    var V = (() => {
        let n = 10,
            s = 0,
            l = 0,
            r = null,
            g = null,
            o = null,
            c = null,
            x = null,
            b = e => {
                n = Number(e)
            },
            E = () => n,
            u = () => s,
            T = () => l,
            k = () => g.classList.contains("disabled") ? null : g.classList.add("disabled"),
            p = () => g.classList.contains("disabled") ? g.classList.remove("disabled") : null,
            y = () => o.classList.contains("disabled") ? null : o.classList.add("disabled"),
            $ = () => o.classList.contains("disabled") ? o.classList.remove("disabled") : null,
            I = e => {
                y(), k();
                let t = d.disableButton(e, d.loader.replace("ms-0 me-1", "mx-1"), !0),
                    a = () => {
                        x.addEventListener("undangan.comment.done", () => t.restore(), {
                            once: !0
                        }), x.addEventListener("undangan.comment.result", () => x.scrollIntoView(), {
                            once: !0
                        }), x.dispatchEvent(new Event("undangan.comment.show"))
                    };
                return {
                    next: () => {
                        s += n, e.innerHTML = "Next" + e.innerHTML, a()
                    },
                    prev: () => {
                        s -= n, e.innerHTML = e.innerHTML + "Prev", a()
                    }
                }
            };
        return {
            init: () => {
                c = document.getElementById("pagination"), c.innerHTML = `
        <ul class="pagination mb-2 shadow-sm rounded-4">
            <li class="page-item disabled" id="previous">
                <button class="page-link rounded-start-4" onclick="undangan.comment.pagination.previous(this)" data-offline-disabled="false">
                    <i class="fa-solid fa-circle-left me-1"></i>Prev
                </button>
            </li>
            <li class="page-item disabled">
                <span class="page-link text-theme-auto" id="page"></span>
            </li>
            <li class="page-item" id="next">
                <button class="page-link rounded-end-4" onclick="undangan.comment.pagination.next(this)" data-offline-disabled="false">
                    Next<i class="fa-solid fa-circle-right ms-1"></i>
                </button>
            </li>
        </ul>`, x = document.getElementById("comments"), r = document.getElementById("page"), g = document.getElementById("previous"), o = document.getElementById("next")
            },
            setPer: b,
            getPer: E,
            getNext: u,
            reset: () => s === 0 ? !1 : (s = 0, y(), k(), !0),
            setTotal: e => {
                if (l = Number(e), l <= n && s === 0) {
                    c.classList.add("d-none");
                    return
                }
                let t = s / n + 1,
                    a = Math.ceil(l / n);
                if (r.innerText = `${t} / ${a}`, s > 0 && p(), t >= a) {
                    y();
                    return
                }
                $(), c.classList.contains("d-none") && c.classList.remove("d-none")
            },
            geTotal: T,
            previous: e => I(e).prev(),
            next: e => I(e).next()
        }
    })();
    var ae = (() => {
        let n = null,
            s = null,
            l = null,
            r = [],
            g = () => `<div class="text-center p-4 mx-0 mt-0 mb-3 bg-theme-auto rounded-4 shadow"><p class="fw-bold p-0 m-0" style="font-size: 0.95rem;">${J.on("id","\u{1F4E2} Yuk, share undangan ini biar makin rame komentarnya! \u{1F389}").on("en","\u{1F4E2} Let's share this invitation to get more comments! \u{1F389}").get()}</p></div>`,
            o = (i, e) => {
                document.querySelector(`[data-button-action="${i}"]`).childNodes.forEach(t => {
                    t.disabled = e
                })
            },
            c = i => {
                o(i, !1), document.getElementById(`inner-${i}`).remove()
            },
            x = i => {
                let e = i.getAttribute("data-uuids").split(","),
                    t = i.getAttribute("data-show") === "true",
                    a = i.getAttribute("data-uuid"),
                    v = s.get("show");
                i.setAttribute("data-show", t ? "false" : "true"), i.innerText = t ? `Show replies (${e.length})` : "Hide replies", s.set("show", t ? v.filter(L => L !== a) : [...v, a]);
                for (let L of e) s.set("hidden", s.get("hidden").map(C => (C.uuid === L && (C.show = !t), C))), document.getElementById(L).classList.toggle("d-none", t)
            },
            b = (i, e) => {
                let t = document.getElementById(`content-${e}`),
                    a = d.base64Decode(t.getAttribute("data-comment")),
                    v = i.getAttribute("data-show") === "false";
                d.safeInnerHTML(t, d.convertMarkdownToHTML(d.escapeHtml(v ? a : a.slice(0, G.maxCommentLength) + "..."))), i.innerText = v ? "Sebagian" : "Selengkapnya", i.setAttribute("data-show", v ? "true" : "false")
            },
            E = async i => {
                if (i.comments && await Promise.all(i.comments.map(t => E(t))), !i.ip || !i.user_agent || i.is_admin) return;
                let e = t => {
                    let a = document.getElementById(`ip-${d.escapeHtml(i.uuid)}`);
                    d.safeInnerHTML(a, `<i class="fa-solid fa-location-dot me-1"></i>${d.escapeHtml(i.ip)} <strong>${d.escapeHtml(t)}</strong>`)
                };
                await F(U, `https://apip.cc/api-json/${i.ip}`).withCache().withRetry().default().then(t => t.json()).then(t => {
                    let a = "localhost";
                    t.status === "success" && (t.City.length !== 0 && t.RegionName.length !== 0 ? a = t.City + " - " + t.RegionName : t.Capital.length !== 0 && t.CountryName.length !== 0 && (a = t.Capital + " - " + t.CountryName)), e(a)
                }).catch(t => e(t.message))
            }, u = (i, e = []) => {
                let t = s.get("show"),
                    a = L => L.forEach(C => {
                        if (e.find(B => B.uuid === C.uuid)) {
                            a(C.comments);
                            return
                        }
                        e.push(z.commentShowMore(C.uuid)), a(C.comments)
                    }),
                    v = L => L.forEach(C => {
                        if (!t.includes(C.uuid)) {
                            v(C.comments);
                            return
                        }
                        C.comments.forEach(B => {
                            let _ = e.findIndex(q => q.uuid === B.uuid);
                            _ !== -1 && (e[_].show = !0)
                        }), v(C.comments)
                    });
                return a(i), v(i), e
            }, T = () => (r.forEach(i => {
                K.removeListener(i)
            }), l.getAttribute("data-loading") === "false" && (l.setAttribute("data-loading", "true"), l.innerHTML = G.renderLoading().repeat(V.getPer())), F(U, `/api/v2/comment?per=${V.getPer()}&next=${V.getNext()}&lang=${J.getLanguage()}`).token(O.getToken()).withCache(1e3 * 30).withForceCache().send(z.getCommentsResponseV2).then(async i => {
                l.setAttribute("data-loading", "false");
                for (let a of r) await R.remove(a);
                if (i.data.lists.length === 0) return l.innerHTML = g(), i;
                let e = a => a.flatMap(v => [v.uuid, ...e(v.comments)]);
                r.splice(0, r.length, ...e(i.data.lists)), s.set("hidden", u(i.data.lists, s.get("hidden")));
                let t = await G.renderContentMany(i.data.lists);
                return i.data.lists.length < V.getPer() && (t += g()), d.safeInnerHTML(l, t), r.forEach(a => {
                    K.addListener(a)
                }), i
            }).then(async i => (l.dispatchEvent(new Event("undangan.comment.result")), i.data.lists && O.isAdmin() && await Promise.all(i.data.lists.map(e => E(e))), V.setTotal(i.data.count), l.dispatchEvent(new Event("undangan.comment.done")), i)));
        return {
            gif: R,
            like: K,
            pagination: V,
            init: () => {
                R.init(), K.init(), G.init(), V.init(), l = document.getElementById("comments"), l.addEventListener("undangan.comment.show", T), n = P("owns"), s = P("comment"), s.has("hidden") || s.set("hidden", []), s.has("show") || s.set("show", [])
            },
            send: async i => {
                let e = i.getAttribute("data-uuid"),
                    t = document.getElementById("form-name"),
                    a = t.value;
                if (a.length === 0) {
                    d.notify("Name cannot be empty.").warning(), e && t.scrollIntoView({
                        block: "center"
                    });
                    return
                }
                let v = document.getElementById("form-presence");
                if (!e && v && v.value === "0") {
                    d.notify("Please select your attendance status.").warning();
                    return
                }
                let L = R.isOpen(e || R.default),
                    C = R.getResultId(e || R.default),
                    B = R.buttonCancel(e);
                if (L && !C) {
                    d.notify("Gif cannot be empty.").warning();
                    return
                }
                L && C && B.hide();
                let _ = document.getElementById(`form-${e?`inner-${e}`:"comment"}`);
                if (!L && _.value?.trim().length === 0) {
                    d.notify("Comments cannot be empty.").warning();
                    return
                }!e && t && !O.isAdmin() && (t.disabled = !0), !O.isAdmin() && v && v.value !== "0" && (v.disabled = !0), _ && (_.disabled = !0);
                let q = document.querySelector(`[onclick="undangan.comment.cancel(this, '${e}')"]`);
                q && (q.disabled = !0);
                let Y = d.disableButton(i),
                    h = v ? v.value === "1" : !0;
                if (!O.isAdmin()) {
                    let A = P("information");
                    A.set("name", a), e || A.set("presence", h)
                }
                let f = await F(X, `/api/comment?lang=${J.getLanguage()}`).token(O.getToken()).body(z.postCommentRequest(e, a, h, L ? null : _.value, C)).send(z.getCommentResponse);
                if (t && (t.disabled = !1), _ && (_.disabled = !1), q && (q.disabled = !1), v && (v.disabled = !1), L && C && B.show(), Y.restore(), !(!f || f.code !== 201)) {
                    if (n.set(f.data.uuid, f.data.own), _ && (_.value = null), L && C && B.click(), !e) {
                        if (V.reset()) {
                            await T(), l.scrollIntoView();
                            return
                        }
                        V.setTotal(V.geTotal() + 1), l.children.length === V.getPer() && l.lastElementChild.remove(), f.data.is_parent = !0, f.data.is_admin = O.isAdmin(), l.insertAdjacentHTML("afterbegin", await G.renderContentMany([f.data])), l.scrollIntoView()
                    }
                    if (e) {
                        s.set("hidden", s.get("hidden").concat([z.commentShowMore(f.data.uuid, !0)])), s.set("show", s.get("show").concat([e])), c(e), f.data.is_parent = !1, f.data.is_admin = O.isAdmin(), document.getElementById(`reply-content-${e}`).insertAdjacentHTML("beforeend", await G.renderContentSingle(f.data));
                        let A = document.getElementById(`button-${e}`).querySelector("a");
                        A && (A.getAttribute("data-show") === "false" && x(A), A.remove());
                        let M = [f.data.uuid],
                            D = document.createRange().createContextualFragment(G.renderReadMore(e, A ? A.getAttribute("data-uuids").split(",").concat(M) : M)),
                            N = K.getButtonLike(e);
                        N.parentNode.insertBefore(D, N)
                    }
                    K.addListener(f.data.uuid), r.push(f.data.uuid)
                }
            },
            edit: async (i, e) => {
                let t = i.getAttribute("data-uuid");
                o(t, !0), O.isAdmin() && n.set(t, i.getAttribute("data-own"));
                let a = document.getElementById(`badge-${t}`),
                    v = !!a && a.getAttribute("data-is-presence") === "true",
                    L = document.getElementById(`img-gif-${t}`);
                L && await R.remove(t);
                let C = e && !O.isAdmin();
                if (document.getElementById(`button-${t}`).insertAdjacentElement("afterend", G.renderEdit(t, v, C, !!L)), L) {
                    R.onOpen(t, () => {
                        R.removeGifSearch(t), R.removeButtonBack(t)
                    }), await R.open(t);
                    return
                }
                let B = document.getElementById(`form-inner-${t}`),
                    _ = d.base64Decode(document.getElementById(`content-${t}`)?.getAttribute("data-comment"));
                B.value = _, B.setAttribute("data-original", d.base64Encode(_))
            },
            reply: i => {
                o(i, !0), R.remove(i).then(() => {
                    R.onOpen(i, () => R.removeGifSearch(i)), document.getElementById(`button-${i}`).insertAdjacentElement("afterend", G.renderReply(i))
                })
            },
            remove: async i => {
                if (!d.ask("Bạn chắc chứ?")) return;
                let e = i.getAttribute("data-uuid");
                O.isAdmin() && n.set(e, i.getAttribute("data-own")), o(e, !0);
                let t = d.disableButton(i),
                    a = K.getButtonLike(e);
                if (a.disabled = !0, !await F(me, "/api/comment/" + n.get(e)).token(O.getToken()).send(z.statusResponse).then(L => L.data.status)) {
                    t.restore(), a.disabled = !1, o(e, !1);
                    return
                }
                document.querySelectorAll('a[onclick="undangan.comment.showOrHide(this)"]').forEach(L => {
                    let C = L.getAttribute("data-uuids").split(",");
                    if (C.includes(e)) {
                        let B = C.filter(_ => _ !== e).join(",");
                        B.length === 0 ? L.remove() : L.setAttribute("data-uuids", B)
                    }
                }), n.unset(e), document.getElementById(e).remove(), l.children.length === 0 && (l.innerHTML = g())
            },
            update: async i => {
                let e = i.getAttribute("data-uuid"),
                    t = !1,
                    a = document.getElementById(`form-inner-presence-${e}`);
                a && (a.disabled = !0, t = a.value === "1");
                let v = document.getElementById(`badge-${e}`),
                    L = !!v && v.getAttribute("data-is-presence") === "true",
                    C = R.isOpen(e),
                    B = R.getResultId(e),
                    _ = R.buttonCancel(e);
                C && B && _.hide();
                let q = document.getElementById(`form-inner-${e}`);
                if (e && !C && d.base64Encode(q.value) === q.getAttribute("data-original") && L === t) {
                    c(e);
                    return
                }
                if (!C && q.value?.trim().length === 0) {
                    d.notify("Comments cannot be empty.").warning();
                    return
                }
                q && (q.disabled = !0);
                let Y = document.querySelector(`[onclick="undangan.comment.cancel(this, '${e}')"]`);
                Y && (Y.disabled = !0);
                let h = d.disableButton(i),
                    f = await F(ce, `/api/comment/${n.get(e)}?lang=${J.getLanguage()}`).token(O.getToken()).body(z.updateCommentRequest(a ? t : null, C ? null : q.value, B)).send(z.statusResponse).then(A => A.data.status);
                if (q && (q.disabled = !1), Y && (Y.disabled = !1), a && (a.disabled = !1), h.restore(), C && B && _.show(), !!f) {
                    if (C && B && (document.getElementById(`img-gif-${e}`).src = document.getElementById(`gif-result-${e}`)?.querySelector("img").src, _.click()), c(e), !C) {
                        let A = document.querySelector(`[onclick="undangan.comment.showMore(this, '${e}')"]`),
                            M = document.getElementById(`content-${e}`);
                        M.setAttribute("data-comment", d.base64Encode(q.value));
                        let D = d.convertMarkdownToHTML(d.escapeHtml(q.value));
                        q.value.length > G.maxCommentLength ? (d.safeInnerHTML(M, A?.getAttribute("data-show") === "false" ? D.slice(0, G.maxCommentLength) + "..." : D), A?.classList.replace("d-none", "d-block")) : (d.safeInnerHTML(M, D), A?.classList.replace("d-block", "d-none"))
                    }
                    a && (document.getElementById("form-presence").value = t ? "1" : "2", P("information").set("presence", t)), !(!a || !v) && (v.classList.toggle("fa-circle-xmark", !t), v.classList.toggle("text-danger", !t), v.classList.toggle("fa-circle-check", t), v.classList.toggle("text-success", t))
                }
            },
            cancel: async (i, e) => {
                let t = document.getElementById(`form-inner-presence-${e}`),
                    a = t ? t.value === "1" : !1,
                    v = document.getElementById(`badge-${e}`),
                    L = v && n.has(e) && t ? v.getAttribute("data-is-presence") === "true" : !1,
                    C = d.disableButton(i);
                if (R.isOpen(e) && (!R.getResultId(e) && L === a || d.ask("Are you sure?"))) {
                    await R.remove(e), c(e);
                    return
                }
                let B = document.getElementById(`form-inner-${e}`);
                if (B.value.length === 0 || d.base64Encode(B.value) === B.getAttribute("data-original") && L === a || d.ask("Are you sure?")) {
                    c(e);
                    return
                }
                C.restore()
            },
            show: T,
            showMore: b,
            showOrHide: x
        }
    })();
    var Te = (() => {
        let n = null,
            s = null,
            l = () => {
                let w = new Date(document.body.getAttribute("data-time").replace(" ", "T")).getTime(),
                    m = L => L < 10 ? `0${L}` : `${L}`,
                    i = document.getElementById("day"),
                    e = document.getElementById("hour"),
                    t = document.getElementById("minute"),
                    a = document.getElementById("second"),
                    v = () => {
                        let L = Math.abs(w - Date.now());
                        i.textContent = m(Math.floor(L / (1e3 * 60 * 60 * 24))), e.textContent = m(Math.floor(L % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60))), t.textContent = m(Math.floor(L % (1e3 * 60 * 60) / (1e3 * 60))), a.textContent = m(Math.floor(L % (1e3 * 60) / 1e3)), d.timeOut(v, 1e3 - Date.now() % 1e3)
                    };
                d.timeOut(v)
            },
            r = () => {
                let w = window.location.search.split("to="),
                    m = null;
                if (w.length > 1 && w[1].length >= 1 && (m = window.decodeURIComponent(w[1])), m) {
                    let e = document.getElementById("guest-name"),
                        t = document.createElement("div");
                    t.classList.add("m-2");
                    let a = `<small class="mt-0 mb-1 mx-0 p-0">${d.escapeHtml(e?.getAttribute("data-message"))}</small><p class="m-0 p-0" style="font-size: 1.25rem">${d.escapeHtml(m)}</p>`;
                    d.safeInnerHTML(t, a), e?.appendChild(t)
                }
                let i = document.getElementById("form-name");
                i && (i.value = n.get("name") ?? m)
            },
            g = async () => {
                let m = document.querySelectorAll(".slide-desktop");
                if (!m || m.length === 0) return;
                let i = document.getElementById("root")?.querySelector(".d-sm-block");
                if (!i || (i.dispatchEvent(new Event("undangan.slide.stop")), window.getComputedStyle(i).display === "none")) return;
                if (m.length === 1) {
                    d.changeOpacity(m[0], !0);
                    return
                }
                let e = 0;
                for (let [L, C] of m.entries())
                    if (L === e) {
                        C.classList.add("slide-desktop-active"), await d.changeOpacity(C, !0);
                        break
                    } let t = !0,
                    a = async () => (await d.changeOpacity(m[e], !1), m[e].classList.remove("slide-desktop-active"), e = (e + 1) % m.length, t && (m[e].classList.add("slide-desktop-active"), await d.changeOpacity(m[e], !0)), t);
                i.addEventListener("undangan.slide.stop", () => {
                    t = !1
                });
                let v = async () => {
                    await a() && d.timeOut(v, 6e3)
                };
                d.timeOut(v, 6e3)
            }, o = w => {
                w.disabled = !0, document.body.scrollIntoView({
                    behavior: "instant"
                }), ee.isAutoMode() && document.getElementById("button-theme").classList.remove("d-none"), g(), ee.spyTop(), we(), d.timeOut(ve, 1500), document.dispatchEvent(new Event("undangan.open")), d.changeOpacity(document.getElementById("welcome"), !1).then(m => m.remove())
            }, c = w => {
                document.getElementById("button-modal-click").setAttribute("href", w.src), document.getElementById("button-modal-download").setAttribute("data-src", w.src);
                let m = document.getElementById("show-modal-image");
                m.src = w.src, m.width = w.width, m.height = w.height, pe.modal("modal-image").show()
            }, x = () => {
                document.getElementById("show-modal-image").addEventListener("click", w => {
                    let m = w.currentTarget.parentNode.querySelector(".position-absolute");
                    m.classList.contains("d-none") ? m.classList.replace("d-none", "d-flex") : m.classList.replace("d-flex", "d-none")
                })
            }, b = w => {
                navigator.vibrate && navigator.vibrate(500), se(w, 100), d.changeOpacity(w, !1).then(m => m.remove())
            }, E = () => n.set("info", !0), u = () => {
                document.querySelectorAll(".font-arabic").forEach(w => {
                    w.innerHTML = String(w.innerHTML).normalize("NFC")
                })
            }, T = () => {
                document.querySelectorAll("svg").forEach(w => {
                    w.hasAttribute("data-class") && d.timeOut(() => w.classList.add(w.getAttribute("data-class")), parseInt(w.getAttribute("data-time")))
                })
            }, k = () => {
                let w = e => new Date(e.replace(" ", "T") + ":00Z").toISOString().replace(/[-:]/g, "").split(".").shift(),
                    m = new URL("https://calendar.google.com/calendar/render"),
                    i = new URLSearchParams({
                        action: "TEMPLATE",
                        text: "The Wedding of Thừa Ân and [Người Thương]",
                        dates: `${w("2026-12-22 07:30")}/${w("2026-12-22 10:00")}`,
                        details: "Với tất cả lòng trân trọng, chúng tôi trân trọng kính mời quý vị đến dự lễ thành hôn của chúng tôi. Xin chân thành cảm ơn sự quan tâm và những lời chúc phúc của quý vị - đó là niềm hạnh phúc và vinh dự lớn lao đối với chúng tôi.",
                        location: "180A, ấp Đường Gỗ Vàm, xã Long Thạnh, tỉnh Ang Giang.",
                        ctz: s.get("Asia/Ho_Chi_Minh")
                    });
                m.search = i.toString(), document.querySelector("#home button")?.addEventListener("click", () => window.open(m, "_blank"))
            }, p = () => (S.add(), {
                load: m => {
                    he(m).then(() => S.complete("libs")).catch(() => S.invalid("libs"))
                }
            }), y = async () => {
                T(), l(), r(), x(), u(), k(), document.body.scrollIntoView({
                    behavior: "instant"
                }), document.getElementById("root").classList.remove("opacity-0"), n.has("presence") && (document.getElementById("form-presence").value = n.get("presence") ? "1" : "2"), n.get("info") && document.getElementById("information")?.remove(), await d.changeOpacity(document.getElementById("welcome"), !0), await d.changeOpacity(document.getElementById("loading"), !1).then(w => w.remove())
            }, $ = () => {
                J.init(), be.init(), ae.init(), S.init(), s = P("config"), n = P("information");
                let w = ue.init(),
                    m = fe.init(),
                    i = ge.init(),
                    e = p(),
                    t = document.body.getAttribute("data-key"),
                    a = new URLSearchParams(window.location.search);
                if (window.addEventListener("resize", d.debounce(g)), document.addEventListener("undangan.progress.done", () => y()), document.addEventListener("hide.bs.modal", () => document.activeElement?.blur()), document.getElementById("button-modal-download").addEventListener("click", v => {
                        m.download(v.currentTarget.getAttribute("data-src"))
                    }), (!t || t.length <= 0) && (document.getElementById("comment")?.remove(), document.querySelector('a.nav-link[href="#comment"]')?.closest("li.nav-item")?.remove(), w.load(), m.load(), i.load(), e.load({
                        confetti: document.body.getAttribute("data-confetti") === "true"
                    })), t && t.length > 0) {
                    S.add(), S.add(), m.hasDataSrc() || m.load();
                    let v = () => O.guest(a.get("k") ?? t).then(({
                        data: L
                    }) => {
                        document.dispatchEvent(new Event("undangan.session")), S.complete("config"), m.hasDataSrc() && m.load(), w.load(), i.load(), e.load({
                            confetti: L.is_confetti_animation
                        }), ae.show().then(() => S.complete("comment")).catch(() => S.invalid("comment"))
                    }).catch(() => S.invalid("config"));
                    window.addEventListener("load", v)
                }
            };
        return {
            init: () => (ee.init(), O.init(), O.isAdmin() && (P("user").clear(), P("owns").clear(), P("likes").clear(), P("session").clear(), P("comment").clear()), document.addEventListener("DOMContentLoaded", $), {
                util: d,
                theme: ee,
                comment: ae,
                guest: {
                    open: o,
                    modal: c,
                    showStory: b,
                    closeInformation: E
                }
            })
        }
    })();
    (n => {
        n.undangan = Te.init()
    })(window);
})();