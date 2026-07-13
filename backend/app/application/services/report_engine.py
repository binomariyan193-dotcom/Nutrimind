import io
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.infrastructure.database.models import Profile, Meal, Nutrition, DetectedFood
from app.application.services.health_analysis import HealthAnalysisEngine

class ReportEngineService:
    
    @staticmethod
    def generate_pdf_report(db: Session, user_id: str) -> io.BytesIO:
        """
        Aggregates user data and builds a PDF report using ReportLab.
        Returns the PDF as a BytesIO buffer.
        """
        # --- 1. Data Aggregation ---
        today = datetime.now()
        start_of_week = today - timedelta(days=7)
        
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        weight = profile.weight_kg if profile else 0
        height = profile.height_cm if profile else 0
        bmi = round(weight / ((height/100)**2), 1) if height > 0 else 0
        
        baselines = HealthAnalysisEngine.calculate_baselines(profile) if profile else {}
        target_calories = baselines.get("tdee", 2000)
        
        # Recent Meals (last 7 days)
        meals = db.query(Meal).filter(
            Meal.user_id == user_id, 
            Meal.timestamp >= start_of_week
        ).order_by(Meal.timestamp.desc()).all()
        
        total_cals = 0
        total_pro = 0
        table_data = [["Date", "Type", "Main Food", "Calories", "Protein (g)"]]
        
        for m in meals:
            # Get Nutrition
            nut = db.query(Nutrition).filter(Nutrition.meal_id == m.id).first()
            cal = round(nut.calories) if nut else 0
            pro = round(nut.protein_g) if nut else 0
            
            total_cals += cal
            total_pro += pro
            
            # Get main food
            foods = db.query(DetectedFood).filter(DetectedFood.meal_id == m.id).all()
            food_name = foods[0].food_name if foods else "Unknown Meal"
            
            table_data.append([
                m.timestamp.strftime("%Y-%m-%d"),
                m.meal_type.capitalize() if m.meal_type else "-",
                food_name,
                str(cal),
                str(pro)
            ])
            
        avg_daily_cals = round(total_cals / 7) if meals else 0
        
        # --- 2. PDF Generation ---
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=18)
        styles = getSampleStyleSheet()
        
        title_style = styles['Heading1']
        title_style.textColor = colors.HexColor("#10b981") # Emerald 500
        
        h2_style = styles['Heading2']
        h2_style.textColor = colors.HexColor("#334155")
        
        normal_style = styles['Normal']
        
        elements = []
        
        # Header
        elements.append(Paragraph("NutriMind AI - Health & Nutrition Report", title_style))
        elements.append(Paragraph(f"Generated on: {today.strftime('%Y-%m-%d %H:%M')}", normal_style))
        elements.append(Spacer(1, 20))
        
        # Profile Section
        elements.append(Paragraph("1. Health Profile Overview", h2_style))
        profile_text = f"<b>Weight:</b> {weight} kg<br/><b>Height:</b> {height} cm<br/><b>BMI:</b> {bmi}<br/><b>Target Daily Calories:</b> {target_calories} kcal"
        elements.append(Paragraph(profile_text, normal_style))
        elements.append(Spacer(1, 20))
        
        # Weekly Summary Section
        elements.append(Paragraph("2. Weekly Nutrition Summary", h2_style))
        summary_text = f"Over the last 7 days, your average daily intake was <b>{avg_daily_cals} kcal</b>.<br/>"
        if avg_daily_cals > target_calories:
            summary_text += "You are currently trending above your maintenance calories. Consider slightly reducing portion sizes to align with weight loss goals."
        else:
            summary_text += "Great job! You are maintaining a healthy caloric balance in line with your targets."
        elements.append(Paragraph(summary_text, normal_style))
        elements.append(Spacer(1, 20))
        
        # History Table
        elements.append(Paragraph("3. Detailed Meal Log (Last 7 Days)", h2_style))
        
        if len(table_data) > 1:
            t = Table(table_data, colWidths=[80, 80, 200, 70, 70])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#10b981")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0"))
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("No meals logged in the last 7 days.", normal_style))
            
        elements.append(Spacer(1, 20))
        
        # AI Recommendations
        elements.append(Paragraph("4. AI Recommendations", h2_style))
        rec_text = "Keep prioritizing lean proteins (chicken, fish, tofu) and complex carbohydrates (sweet potatoes, oats). Ensure you are drinking at least 2.5L of water daily. Since you are tracking BMI and nutrition closely, try to maintain a consistent sleep schedule to aid recovery and metabolic health."
        elements.append(Paragraph(rec_text, normal_style))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
