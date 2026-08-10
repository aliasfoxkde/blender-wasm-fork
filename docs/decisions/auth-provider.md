# Auth Provider Decision

**Status**: Proposed

**Track H** is deferred pending auth provider decision and app sync architecture.

## Constraints

1. Blender WASM runtime must work in **guest mode** (no auth required) — anonymous users can render
2. Auth is needed only for **sync features** (save/load render history across devices, optional cloud backup)
3. No backend server exists yet — auth must be stateless or use third-party managed services
4. Cloudflare Workers are the primary deployment target

## Options Considered

### Option A: Cloudflare Access (Zero Trust)

**Pros**:
- Native integration with Cloudflare Workers/deployment
- No separate auth server needed
- JWT tokens validated in Worker
- Works with existing Cloudflare setup

**Cons**:
- Requires Cloudflare Zero Trust subscription (paid)
- Complex setup for simple guest+sync use case
- Overkill for anonymous render history

**Verdict**: ❌ Too heavy for this use case

---

### Option B: Auth0 / Okta (External IdP)

**Pros**:
- Full-featured identity platform
- Social login (Google, GitHub, etc.)
- Free tier available
- Well-documented WASM integration

**Cons**:
- Adds external dependency
- Requires managing application in Auth0 dashboard
- Callback/OAuth flow complexity in SPA

**Verdict**: ⚠️ Good but adds friction; consider if sign-in is mandatory

---

### Option C: Supabase Auth

**Pros**:
- Works with Supabase edge (could run alongside Worker)
- Email + magic link, OAuth providers
- Anonymous sign-ins for guest mode
- Sync via Postgres
- Free tier sufficient for MVP

**Cons**:
- Requires Supabase project (external dependency)
- Auth callbacks need separate domain/Worker route

**Verdict**: ✅ Strong candidate — anonymous sign-ins + sync in one service

---

### Option D: Stateless JWT (Self-hosted)

**Pros**:
- No external auth provider needed
- User provides their own secret key
- Render history encrypted client-side with user's key
- Completely self-contained

**Cons**:
- No password recovery
- Key management UX challenge
- No "sign in from another device"

**Verdict**: ⚠️ Interesting but poor UX; good for paranoid security model

---

### Option E: GitHub OAuth via existing Worker

**Pros**:
- Users likely already have GitHub accounts
- GitHub OAuth is free and well-supported
- Could use GitHub Gist for sync storage (free 1 GB per user)

**Cons**:
- Requires GitHub OAuth app registration
- More complex than Supabase anonymous auth
- GitHub API rate limits on Gist

**Verdict**: ⚠️ Good option if users are expected to be developers

---

## Recommended Path

**Phase 1 (MVP)**: Keep guest mode. Render history stored in IndexedDB only. No sync.

**Phase 2 (Supabase)**: Add Supabase anonymous auth. User gets a UUID in IndexedDB. Optionally "link" account via email magic link. Sync render history to Supabase Postgres.

**Rationale**: Supabase gives us auth + database + storage in one managed service with a generous free tier. Anonymous sign-ins mean zero onboarding friction. When user later chooses to link their account, history can be merged.

---

## Next Steps

1. Create Supabase project at supabase.com
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to app env
3. Implement anonymous sign-in in CyclesRenderRuntime
4. Add sync button to RenderHistoryList (exports to Supabase)
5. Update TASKS.md Track H status

## Alternatives to Supabase

- **Cloudflare Durable Objects**: Auth state stored in DO, Workers handle sync. More "native" to CF ecosystem but requires more custom code.
- **Firebase Auth + Firestore**: Google's offering, well-tested with WASM, but heavy bundle size.
