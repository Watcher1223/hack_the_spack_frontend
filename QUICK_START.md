# Universal Adapter - Quick Start Guide

Get the Universal Adapter running in 5 minutes! 🚀

---

## Prerequisites

- Node.js 20+ and npm
- Python 3.9+ (for backend)
- MongoDB (optional - can use Docker)

---

## Step 1: Frontend Setup (2 minutes)

```bash
# Navigate to frontend directory
cd hack_the_spack_frontend

# Install dependencies (if not already installed)
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local and verify:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

✅ Frontend should now be running at `http://localhost:3000`

---

## Step 2: Backend Setup (3 minutes)

### Option A: If you have the backend repository

```bash
# Navigate to backend directory
cd path/to/backend

# Create virtual environment (if needed)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example dev.env

# Edit dev.env and add required keys:
# VOYAGE_API_KEY=your_voyage_api_key
# FIRECRAWL_API_KEY=your_firecrawl_api_key
# OPENROUTER_API_KEY=your_openrouter_api_key
# MONGODB_URI=mongodb://admin:admin123@localhost:27017/agent_db?authSource=admin

# Start MongoDB (if using Docker)
docker-compose up -d mongodb

# Start backend server
python server_enhanced.py
# OR
python server.py
```

✅ Backend should now be running at `http://localhost:8000`

### Option B: Backend not available yet

If the backend API server is not ready:
1. The UI will show error messages
2. You can still explore the UI layout and design
3. Wait for backend implementation to be completed

---

## Step 3: Test the Integration

Open `http://localhost:3000` in your browser and try:

### 1. Test Chat (CommandCenter)
- Type: "Get weather for San Francisco"
- Press Enter or click Execute
- Watch workflow steps animate
- See results display

### 2. Test Tool Marketplace
- Click "Marketplace" tab
- See all available tools
- Try searching for "weather" or "crypto"
- Click on a tool to see details

### 3. Test MCP Forge
- Click "MCP Forge" tab
- Enter a URL: `https://api.openweathermap.org/docs`
- Click "Generate Tool"
- Watch real-time code generation

### 4. Test Live Discovery
- Watch the left sidebar (or top on mobile)
- See real-time events stream in
- Events from Firecrawl, MCP, Agent, System

### 5. Test Action Center
- Check the right sidebar (or Action Center tab)
- See recent actions
- Click refresh to update

### 6. Test Audit Trail
- Click "Audit Trail" tab
- See verified tools with trust scores
- View security scan results

---

## Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection fails
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check CORS configuration in backend
4. Check browser console for errors

### Tools not loading
1. Verify backend has tools in database
2. Check MongoDB is running
3. Check backend logs for errors

### SSE (Live Discovery) not working
1. Check browser supports EventSource (all modern browsers do)
2. Verify `/api/discovery/stream` endpoint exists in backend
3. Check browser console for errors
4. Try refreshing the page

---

## Environment Variables

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=2.0.0
```

### Backend (`dev.env`)
```bash
# Required
VOYAGE_API_KEY=your_voyage_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional (has defaults)
MONGODB_URI=mongodb://admin:admin123@localhost:27017/agent_db?authSource=admin
```

---

## API Keys Required

### 1. Voyage AI (for embeddings)
- Sign up: https://www.voyageai.com/
- Get API key from dashboard
- Free tier available

### 2. Firecrawl (for web scraping)
- Sign up: https://firecrawl.dev/
- Get API key from dashboard
- Free tier available

### 3. OpenRouter (for LLM access)
- Sign up: https://openrouter.ai/
- Get API key from dashboard
- Pay-as-you-go pricing

---

## Quick Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter

# Backend
python server_enhanced.py    # Start enhanced API server
python server.py             # Start original API server

# MongoDB (Docker)
docker-compose up -d mongodb     # Start MongoDB
docker-compose down              # Stop all services
docker-compose logs mongodb      # View MongoDB logs
```

---

## Next Steps

1. ✅ **Read Documentation:** Check `IMPLEMENTATION_SUMMARY.md` for detailed integration info
2. ✅ **Explore Components:** Navigate through all 6 tabs in the UI
3. ✅ **Test API Endpoints:** Use the API tab to see available endpoints
4. ✅ **Add Sample Tools:** Populate the database with sample tools
5. ✅ **Try Tool Generation:** Generate a tool from an API docs URL

---

## Sample API Docs URLs for Testing

Try these in MCP Forge:
- OpenWeatherMap: `https://api.openweathermap.org/docs`
- GitHub API: `https://docs.github.com/rest`
- Stripe API: `https://stripe.com/docs/api`

---

## Status Check

Verify everything is working:

```bash
# Check frontend
curl http://localhost:3000

# Check backend health
curl http://localhost:8000/health

# Check tools endpoint
curl http://localhost:8000/tools

# Check discovery stream (should hang waiting for events)
curl -N http://localhost:8000/api/discovery/stream
```

---

## Getting Help

- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **API Reference:** `API_DOCUMENTATION.md`
- **Integration Guide:** `UI_INTEGRATION_GUIDE.md`
- **Backend Setup:** `IMPLEMENTATION_GUIDE.md`

---

Happy building! 🎉
