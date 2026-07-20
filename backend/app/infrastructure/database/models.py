import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, DECIMAL, Date, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    medical_history = relationship("MedicalHistory", back_populates="user", cascade="all, delete-orphan")
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    meal_history = relationship("MealHistory", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytic", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = 'profiles'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    dob = Column(Date)
    gender = Column(String(50))
    height_cm = Column(DECIMAL(5, 2))
    weight_kg = Column(DECIMAL(5, 2))
    activity_level = Column(String(50))
    dietary_preferences = Column(JSONB)
    health_goal = Column(String(100))
    exercise_frequency = Column(String(50))
    sleep_hours = Column(DECIMAL(4, 2))
    water_intake_liters = Column(DECIMAL(4, 2))
    
    # Gamification
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_goal_hit_date = Column(Date)
    badges = Column(JSONB, default=[])

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class MedicalHistory(Base):
    __tablename__ = 'medical_history'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    allergies = Column(JSONB)
    conditions = Column(JSONB)
    medications = Column(JSONB)
    family_history = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="medical_history")

class Meal(Base):
    __tablename__ = 'meals'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    meal_type = Column(String(50), nullable=False)
    description = Column(Text)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="meals")
    images = relationship("MealImage", back_populates="meal", cascade="all, delete-orphan")
    nutrition = relationship("Nutrition", back_populates="meal", uselist=False, cascade="all, delete-orphan")

class MealImage(Base):
    __tablename__ = 'meal_images'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_id = Column(UUID(as_uuid=True), ForeignKey('meals.id', ondelete='CASCADE'), nullable=False)
    image_url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    meal = relationship("Meal", back_populates="images")
    detected_foods = relationship("DetectedFood", back_populates="meal_image", cascade="all, delete-orphan")

class DetectedFood(Base):
    __tablename__ = 'detected_foods'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_image_id = Column(UUID(as_uuid=True), ForeignKey('meal_images.id', ondelete='CASCADE'), nullable=False)
    food_name = Column(String(255), nullable=False)
    confidence_score = Column(DECIMAL(4, 3))
    bounding_box = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    meal_image = relationship("MealImage", back_populates="detected_foods")

class Nutrition(Base):
    __tablename__ = 'nutrition'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_id = Column(UUID(as_uuid=True), ForeignKey('meals.id', ondelete='CASCADE'), unique=True, nullable=False)
    calories = Column(DECIMAL(8, 2))
    protein_g = Column(DECIMAL(8, 2))
    carbs_g = Column(DECIMAL(8, 2))
    fat_g = Column(DECIMAL(8, 2))
    fiber_g = Column(DECIMAL(8, 2))
    sugar_g = Column(DECIMAL(8, 2))
    sodium_mg = Column(DECIMAL(8, 2))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    meal = relationship("Meal", back_populates="nutrition")

class Recommendation(Base):
    __tablename__ = 'recommendations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    is_applied = Column(Boolean, default=False)
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="recommendations")

class MealHistory(Base):
    __tablename__ = 'meal_history'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)
    total_calories = Column(DECIMAL(8, 2))
    total_protein = Column(DECIMAL(8, 2))
    total_carbs = Column(DECIMAL(8, 2))
    total_fat = Column(DECIMAL(8, 2))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="meal_history")

class Analytic(Base):
    __tablename__ = 'analytics'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)
    adherence_score = Column(DECIMAL(5, 2))
    health_score = Column(DECIMAL(5, 2))
    metrics = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="analytics")

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50))
    title = Column(String(255))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")

class Report(Base):
    __tablename__ = 'reports'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    report_type = Column(String(50))
    report_url = Column(Text)
    date_range_start = Column(Date)
    date_range_end = Column(Date)
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="reports")
