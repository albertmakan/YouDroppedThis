---
name: Codebase Visualization Diagram
overview: "Create mermaid diagrams that visualize the YouDroppedThis codebase: system architecture, frontend structure, backend modules, and data flow."
todos: []
isProject: false
---

# Codebase Visualization Plan

This plan presents mermaid diagrams to visualize the **YouDroppedThis** codebase—an ephemeral collaborative pixel-art app with a Vue 3 frontend, Deno API backend, and Supabase infrastructure.

---

## 1. System Architecture (High-Level)

```mermaid
flowchart TB
    subgraph client [Vue Client]
        Vite[Vite 7]
        Vue[Vue 3 + Composition API]
        Pinia[Pinia Store]
        VueQuery[TanStack Vue Query]
        Router[Vue Router]
    end

    subgraph api [Deno API]
        Oak[Oak Server]
        UserMod[User Module]
        CanvasMod[Canvas Module]
        ArtworkMod[Artwork Module]
        TxMod[Transaction Module]
    end

    subgraph supabase [Supabase]
        Auth[Supabase Auth]
        Realtime[Supabase Realtime]
    end

    subgraph db [PostgreSQL]
        Profiles[app.profiles]
        Canvases[app.canvases]
        Artworks[app.artworks]
        Transactions[app.transactions]
    end

    Vue --> Vite
    Vue --> Pinia
    Vue --> VueQuery
    Vue --> Router

    Oak --> UserMod
    Oak --> CanvasMod
    Oak --> ArtworkMod
    Oak --> TxMod

    client -->|"REST /api/*"| api
    client -->|"JWT + Session"| Auth
    client -->|"Realtime channel"| Realtime

    api -->|"SQL"| db
    api -->|"Admin JWT"| Auth

    UserMod --> Profiles
    CanvasMod --> Canvases
    ArtworkMod --> Artworks
    TxMod --> Transactions
```



---

## 2. Frontend Structure

```mermaid
flowchart TB
    subgraph entry [Entry]
        MainTs[main.ts]
        IndexHtml[index.html]
    end

    subgraph pages [Pages / Routes]
        IndexPage["/ - IndexPage"]
        CanvasPage["/c/:id - CanvasPage"]
        NewPage["/new - CanvasCreationForm"]
        SettingsPage["/settings/:tab - SettingsView"]
        NowPage["/now - NowPage"]
    end

    subgraph components [Components]
        subgraph artwork [Artwork]
            ArtworkThumb[ArtworkThumbnail]
            RenderArtwork[renderArtwork]
            ArtworkPopup[ArtworkInfoPopup]
        end
        subgraph canvas [Canvas]
            CanvasView[CanvasView]
            CanvasCard[CanvasCard]
            ShareBtn[ShareButton]
        end
        subgraph editor [Editor]
            PixelEditor[PixelArtEditorPopup]
            PaletteEditor[PaletteEditor]
            ColorPicker[ColorPicker]
        end
        subgraph layout [Layout]
            Header[Header]
            Drawer[Drawer]
            Toast[ToastContainer]
        end
        subgraph user [User]
            AuthComp[Auth]
            ProfileBtn[ProfileButton]
            Settings[Settings]
        end
    end

    subgraph state [State & Data]
        AuthStore[auth store]
        EditorStore[editor store]
        useCanvases[useCanvases]
        useUserArtworks[useUserArtworks]
        useProfiles[useProfiles]
    end

    subgraph services [Services]
        ApiTs[api.ts - Axios]
        SupabaseTs[supabase.ts]
    end

    MainTs --> Router
    Router --> IndexPage
    Router --> CanvasPage
    Router --> NewPage
    Router --> SettingsPage
    Router --> NowPage

    CanvasPage --> CanvasView
    CanvasPage --> ArtworkThumb
    CanvasView --> PixelEditor
    CanvasView --> SupabaseTs

    AuthStore --> ApiTs
    useCanvases --> ApiTs
    ApiTs --> SupabaseTs
```



---

## 3. Backend API Modules

```mermaid
flowchart LR
    subgraph main [main.ts]
        Oak[Oak Server]
        CORS[CORS]
        Routes[Route Mount]
    end

    subgraph middleware [Middleware]
        AuthMw[auth.ts - JWT]
        RateLimit[rateLimit.ts]
    end

    subgraph modules [Modules]
        User[User]
        Canvas[Canvas]
        Artwork[Artwork]
        Transaction[Transaction]
    end

    subgraph db [Database]
        Profiles[profiles]
        Canvases[canvases]
        Artworks[artworks]
        Transactions[transactions]
    end

    Oak --> CORS
    Oak --> AuthMw
    Oak --> RateLimit
    Oak --> Routes

    Routes --> User
    Routes --> Canvas
    Routes --> Artwork
    Routes --> Transaction

    User --> Profiles
    Canvas --> Canvases
    Artwork --> Artworks
    Transaction --> Transactions
```



---

## 4. API Routes Map

```mermaid
flowchart TB
    subgraph users [Users API]
        GET_Profile["GET /api/users/:id/profile"]
        PATCH_Profile["PATCH /api/users"]
    end

    subgraph canvases [Canvases API]
        GET_Hosted["GET /api/canvases/hosted-by/:userId"]
        GET_Now["GET /api/canvases/now"]
        POST_Canvas["POST /api/canvases"]
        GET_Info["GET /api/canvases/:id/info"]
        GET_Area["GET /api/canvases/:id/area"]
        POST_Reward["POST /api/canvases/:id/reward"]
        GET_Meta["GET /api/canvases/:id/meta"]
        GET_Preview["GET /api/canvases/:id/preview.png"]
    end

    subgraph artworks [Artworks API]
        POST_Place["POST /api/artworks/place"]
        POST_Collect["POST /api/artworks/collect/:id"]
        GET_Placed["GET /api/artworks/placed/:userId"]
        GET_Collected["GET /api/artworks/collected/:userId"]
    end

    subgraph transactions [Transactions API]
        GET_Tx["GET /api/transactions"]
        POST_Daily["POST /api/transactions/daily-bonus"]
    end

    Client[Vue Client] --> users
    Client --> canvases
    Client --> artworks
    Client --> transactions
```



---

## 5. Data Flow (Auth + Realtime)

```mermaid
sequenceDiagram
    participant User
    participant Vue as Vue Client
    participant AuthStore as auth store
    participant Supabase as Supabase Auth
    participant API as Deno API
    participant DB as PostgreSQL
    participant Realtime as Supabase Realtime

    User->>Vue: Login
    Vue->>AuthStore: signIn
    AuthStore->>Supabase: auth.signInWithPassword
    Supabase-->>AuthStore: session + JWT
    AuthStore->>API: getProfile (Bearer JWT)
    API->>DB: SELECT profile
    DB-->>API: profile
    API-->>AuthStore: profile

    User->>Vue: Open canvas
    Vue->>Realtime: subscribe canvas:id
    User->>Vue: Place artwork
    Vue->>API: POST /api/artworks/place
    API->>DB: INSERT artwork
    API->>Realtime: broadcast placed
    Realtime-->>Vue: placed event
    Vue->>Vue: Update UI
```



---

## Summary


| Diagram                 | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| **System Architecture** | Client, API, Supabase, and PostgreSQL relationships |
| **Frontend Structure**  | Vue routes, components, stores, and services        |
| **Backend Modules**     | Oak server, middleware, and domain modules          |
| **API Routes Map**      | All REST endpoints grouped by resource              |
| **Data Flow**           | Auth and realtime interaction sequence              |


---

## Where to Put the Diagram

You can add these diagrams to:

- `**docs/architecture.md`** – New file for architecture documentation
- `**README.md**` – Inline in the project root
- `**.cursor/rules/**` – If you use Cursor rules for context

If you want, I can create `docs/architecture.md` with these diagrams when you switch to agent mode.