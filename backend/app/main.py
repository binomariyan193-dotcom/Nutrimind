import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.presentation.api.routes import auth, profile, meals, nutrition, pipeline, analytics, recommendations, chat, planner, notifications, reports, admin

app = FastAPI(
    title="NutriMind AI API",
    description="Backend API for NutriMind AI - Personalized Nutrition Intelligence Platform",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:5174", # Vite alternate port
    "http://localhost:3000",
]

frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(meals.router)
app.include_router(nutrition.router)
app.include_router(pipeline.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)
app.include_router(chat.router)
app.include_router(planner.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the NutriMind AI API!"}
