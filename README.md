# CanvasCrafter

CanvasCrafter is a premium, high-performance graphic design editor that runs natively within your web browser. Built on modern web technologies, it features a fluid canvas with layers, background removal, intelligent silhouette edge strokes, precise vector shapes, custom typography, stock photo integrations, and more.

## Installation & Self-Hosting

Hosting your own instance of CanvasCrafter is fast and easy. Since CanvasCrafter relies on Next.js, ensure you have Node.js and npm installed on your self-hosted server environment.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/canvascrafter.git
cd canvascrafter
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
CanvasCrafter natively integrates with Unsplash to fetch over 10M+ high quality stock images. To configure the stock gallery, you must register as a developer on [Unsplash](https://unsplash.com/developers) to obtain an API access key.

Copy the `.env.example` file:
```bash
cp .env.example .env
```

Inside your `.env` file, input the following Unsplash keys you generated:
```
NEXT_PUBLIC_UNSPLASH_APPLICATION_ID=your_id_here
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_key_here
NEXT_PUBLIC_UNSPLASH_SECRET_KEY=your_secret_here
```

### 4. Running the Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Production Build

#### Option A: Node.js (Manual)
When deploying publicly, run the production build steps:
```bash
npm run build
npm start
```

#### Option B: Docker Compose
Alternatively, CanvasCrafter ships with a `docker-compose.yml` Docker configuration, giving you the option to containerize and orchestrate your deployment. You can pass in your `.env` file directly via docker-compose:

```bash
docker-compose --env-file .env up -d --build
```
## Key Features

- **Layer System & Groups**: Arrange elements front to back, combine objects, and duplicate dynamically via context-menus.
- **Smart AI Tools**: Perform complex local-browser edge detection and silhouette tracing directly on images without an external API. Remove backgrounds locally via on-device AI.
- **Typography & Brand Kits**: Build organization palettes and import unlimited local `.ttf`/`.otf` font files.
- **System Clipboard Interoperability**: External plain text and screenshots sync straight to your web canvas automatically when you press `Ctrl+V`.
- **Exporting**: Save as crisp PNGs, JPEGs, and PDFs or download your design templates directly.

## Interface Preview

> **Note:** Ensure you include photos of the UI!  
> `![CanvasCrafter UI Example 1](/docs/ui/1.png)`  
> `![CanvasCrafter UI Example 2](/docs/ui/2.png)`
