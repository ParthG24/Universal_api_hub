import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import Admin, Connector, InputField, RequestLog
from app.core.config import settings
from app.core.security import get_password_hash, hash_api_key

DEMO_CARD_SCANNER_KEY = "uah_card_demo_key_2026_xyz987"
DEMO_REWRITER_KEY = "uah_rewrite_demo_key_2026_abc123"
DEMO_SENTIMENT_KEY = "uah_sentiment_demo_key_2026_sen456"


def seed_database():
    """Seeds default admin, mandatory demo connectors, and initial sample logs."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Admin
        admin = db.query(Admin).filter(Admin.email == settings.ADMIN_EMAIL.lower()).first()
        if not admin:
            admin = Admin(
                email=settings.ADMIN_EMAIL.lower(),
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                created_at=datetime.datetime.utcnow(),
            )
            db.add(admin)
            print(f"[Seed] Created admin: {settings.ADMIN_EMAIL}")
        else:
            print(f"[Seed] Admin already exists: {admin.email}")

        # 2. Seed Connector A: Business Card Scanner (Gemini 3.8 Flash - Latest 2026 Multimodal Flagship)
        card_scanner = db.query(Connector).filter(Connector.slug == "card-scanner").first()
        if not card_scanner:
            card_scanner = Connector(
                slug="card-scanner",
                name="Business Card Scanner",
                description="Extracts structured contact info (name, company, phone, email, website) from business card photos.",
                provider="gemini",
                model="gemini-3.8-flash",
                system_prompt=(
                    "You are a business card extraction system. "
                    "Extract the person's name, company, designation, phone, email and website from the supplied image. "
                    "Return only valid JSON matching the configured output structure. "
                    "If a field is not present on the card, return an empty string for it."
                ),
                output_schema={
                    "name": "string",
                    "company": "string",
                    "designation": "string",
                    "phone": "string",
                    "email": "string",
                    "website": "string",
                },
                status="active",
                api_key_hash=hash_api_key(DEMO_CARD_SCANNER_KEY),
            )
            db.add(card_scanner)
            db.flush()

            # Input field: image (required)
            img_field = InputField(
                connector_id=card_scanner.id,
                name="image",
                field_type="image",
                required=True,
                description="Photo or scanned image of the business card (.png, .jpg, .webp).",
                validation_rules={"allowed_mime_types": ["image/png", "image/jpeg", "image/jpg", "image/webp"], "max_size_bytes": 5242880},
                order=0,
            )
            db.add(img_field)
            print("[Seed] Created Connector A: Business Card Scanner")
        else:
            if card_scanner.model in ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash"]:
                card_scanner.model = "gemini-3.8-flash"
                db.add(card_scanner)
                print("[Seed] Upgraded card-scanner model to gemini-3.8-flash")

        # 3. Seed Connector B: Content Rewriter (Groq Llama 3.1 8B Instant - 100% Free Tier Guaranteed)
        rewriter = db.query(Connector).filter(Connector.slug == "content-rewriter").first()
        if not rewriter:
            rewriter = Connector(
                slug="content-rewriter",
                name="Content Rewriter",
                description="Rewrites articles, marketing copy, or technical notes into targeted tones and word counts.",
                provider="groq",
                model="llama-3.1-8b-instant",
                system_prompt=(
                    "You are a content rewriting assistant. "
                    "Rewrite the supplied text in the requested tone, keeping the original meaning intact. "
                    "If a target word count is given, aim close to it. "
                    "Return only valid JSON matching the configured output structure."
                ),
                output_schema={
                    "rewritten_text": "string",
                    "word_count": "number",
                },
                status="active",
                api_key_hash=hash_api_key(DEMO_REWRITER_KEY),
            )
            db.add(rewriter)
            db.flush()

            # Input fields: text (required), tone (optional), word_count (optional)
            db.add(InputField(
                connector_id=rewriter.id,
                name="text",
                field_type="text",
                required=True,
                description="Source text to be rewritten.",
                validation_rules={"min_length": 5, "max_length": 20000},
                order=0,
            ))
            db.add(InputField(
                connector_id=rewriter.id,
                name="tone",
                field_type="text",
                required=False,
                default_value="professional",
                description="Desired tone of voice (e.g. professional, playful, concise, persuasive).",
                validation_rules={"max_length": 50},
                order=1,
            ))
            db.add(InputField(
                connector_id=rewriter.id,
                name="word_count",
                field_type="number",
                required=False,
                description="Target output word count.",
                validation_rules={"min": 10, "max": 5000},
                order=2,
            ))
            print("[Seed] Created Connector B: Content Rewriter")
        else:
            if rewriter.model in ["llama-3.3-70b-versatile", "llama3-70b-8192"]:
                rewriter.model = "llama-3.1-8b-instant"
                db.add(rewriter)
                print("[Seed] Upgraded content-rewriter model to llama-3.1-8b-instant")

        # 4. Seed Connector C: Sentiment Analyzer (Groq Llama 3.1 8B Instant - Free Tier)
        sentiment = db.query(Connector).filter(Connector.slug == "sentiment-analyzer").first()
        if not sentiment:
            sentiment = Connector(
                slug="sentiment-analyzer",
                name="Sentiment Analyzer",
                description="Analyzes customer feedback, reviews, and messages for sentiment polarity, confidence score, emotional tone, and key drivers.",
                provider="groq",
                model="llama-3.1-8b-instant",
                system_prompt=(
                    "You are an expert customer feedback and sentiment analyzer. "
                    "Analyze the provided text carefully and return a JSON object with: "
                    "\"sentiment\" (strictly 'positive', 'negative', or 'neutral'), "
                    "\"score\" (number from -1.0 to 1.0), "
                    "\"emotional_tone\" (e.g. 'enthusiastic', 'frustrated', 'satisfied', 'objective'), "
                    "\"key_drivers\" (array of 1 to 4 bullet strings explaining the primary factors), "
                    "\"summary\" (one concise sentence summarizing overall sentiment). "
                    "Return ONLY valid JSON matching the configured output structure."
                ),
                output_schema={
                    "sentiment": "string",
                    "score": "number",
                    "emotional_tone": "string",
                    "key_drivers": "array",
                    "summary": "string",
                },
                status="active",
                api_key_hash=hash_api_key(DEMO_SENTIMENT_KEY),
            )
            db.add(sentiment)
            db.flush()

            # Input fields: text (required), domain (optional)
            db.add(InputField(
                connector_id=sentiment.id,
                name="text",
                field_type="text",
                required=True,
                description="Source text, customer review, or message to analyze.",
                validation_rules={"min_length": 3, "max_length": 15000},
                order=0,
            ))
            db.add(InputField(
                connector_id=sentiment.id,
                name="domain",
                field_type="text",
                required=False,
                default_value="general",
                description="Context domain (e.g., customer_support, product_review, social_media).",
                validation_rules={"max_length": 50},
                order=1,
            ))
            print("[Seed] Created Connector C: Sentiment Analyzer")
        # 5. Migrate any existing database connectors using decommissioned or retired models
        DECOMMISSIONED_GROQ = {
            "gemma2-9b-it", "gemma-7b-it", "mixtral-8x7b-32768",
            "llama3-8b-8192", "llama3-70b-8192", "llama-3.3-70b-versatile",
            "llama-3.2-1b-preview", "llama-3.2-3b-preview",
            "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"
        }
        all_groq_connectors = db.query(Connector).filter(Connector.provider == "groq").all()
        for gc in all_groq_connectors:
            if gc.model in DECOMMISSIONED_GROQ or any(d in gc.model.lower() for d in ["gemma", "mixtral", "llama3-", "preview"]):
                old_m = gc.model
                gc.model = "llama-3.1-8b-instant"
                db.add(gc)
                print(f"[Seed] Upgraded Groq connector '{gc.slug}' model from {old_m} to llama-3.1-8b-instant")

        RETIRED_GEMINI = {
            "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash",
            "gemini-1.5-flash-8b", "gemini-1.5-flash-latest", "gemini-1.5-pro",
            "gemini-2.5-flash", "gemini-2.5-pro"
        }
        all_gemini_connectors = db.query(Connector).filter(Connector.provider == "gemini").all()
        for gmc in all_gemini_connectors:
            if gmc.model in RETIRED_GEMINI:
                old_m = gmc.model
                gmc.model = "gemini-3.8-flash"
                db.add(gmc)
                print(f"[Seed] Upgraded Gemini connector '{gmc.slug}' model from {old_m} to gemini-3.8-flash")

        # 6. Seed initial sample logs for immediate dashboard metrics
        db.flush()
        sample_logs_count = db.query(RequestLog).count()
        if sample_logs_count == 0 and card_scanner and rewriter and sentiment:
            now = datetime.datetime.utcnow()
            db.add(RequestLog(
                connector_id=card_scanner.id,
                status="success",
                request_timestamp=now - datetime.timedelta(hours=2),
                response_time_ms=640.2,
                input_tokens=850,
                output_tokens=94,
                total_tokens=944,
                estimated_cost=0.000092,
                provider="gemini",
                model="gemini-3.8-flash",
                request_preview='{"image": "[Image: alex_morgan_card.jpg (240182 bytes)]"}',
                response_preview='{"name": "Alex Morgan", "company": "Apex Dynamics", "designation": "VP Engineering", "phone": "+1-555-0192", "email": "alex@apexdynamics.io", "website": "https://apexdynamics.io"}',
            ))
            db.add(RequestLog(
                connector_id=rewriter.id,
                status="success",
                request_timestamp=now - datetime.timedelta(hours=1),
                response_time_ms=210.5,
                input_tokens=180,
                output_tokens=125,
                total_tokens=305,
                estimated_cost=0.000019,
                provider="groq",
                model="llama-3.1-8b-instant",
                request_preview='{"text": "We are releasing our new vector database today.", "tone": "exciting", "word_count": 50}',
                response_preview='{"rewritten_text": "Thrilled to unveil our lightning-fast vector database today! Engineered for next-gen AI applications with ultra-low latency.", "word_count": 18}',
            ))
            db.add(RequestLog(
                connector_id=sentiment.id,
                status="success",
                request_timestamp=now - datetime.timedelta(minutes=25),
                response_time_ms=182.4,
                input_tokens=140,
                output_tokens=85,
                total_tokens=225,
                estimated_cost=0.000014,
                provider="groq",
                model="llama-3.1-8b-instant",
                request_preview='{"text": "The customer support team resolved my issue in under 5 minutes. The platform is incredibly fast and dependable!", "domain": "customer_support"}',
                response_preview='{"sentiment": "positive", "score": 0.94, "emotional_tone": "delighted", "key_drivers": ["5-minute resolution", "dependable platform"], "summary": "Customer expressed high satisfaction with responsiveness and platform reliability."}',
            ))
            print("[Seed] Created initial demonstration request logs")

        db.commit()
        print("\n=== Seeding Completed Successfully! ===")
        print(f"Admin Credentials: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
        print(f"Card Scanner Demo Key: {DEMO_CARD_SCANNER_KEY}")
        print(f"Content Rewriter Demo Key: {DEMO_REWRITER_KEY}")
        print(f"Sentiment Analyzer Demo Key: {DEMO_SENTIMENT_KEY}")
    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
