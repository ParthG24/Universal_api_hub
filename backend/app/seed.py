import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import Admin, Connector, InputField, RequestLog
from app.core.config import settings
from app.core.security import get_password_hash, hash_api_key

DEMO_CARD_SCANNER_KEY = "uah_card_demo_key_2026_xyz987"
DEMO_REWRITER_KEY = "uah_rewrite_demo_key_2026_abc123"


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

        # 2. Seed Connector A: Business Card Scanner
        card_scanner = db.query(Connector).filter(Connector.slug == "card-scanner").first()
        if not card_scanner:
            card_scanner = Connector(
                slug="card-scanner",
                name="Business Card Scanner",
                description="Extracts structured contact info (name, company, phone, email, website) from business card photos.",
                provider="gemini",
                model="gemini-1.5-flash",
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

        # 3. Seed Connector B: Content Rewriter
        rewriter = db.query(Connector).filter(Connector.slug == "content-rewriter").first()
        if not rewriter:
            rewriter = Connector(
                slug="content-rewriter",
                name="Content Rewriter",
                description="Rewrites articles, marketing copy, or technical notes into targeted tones and word counts.",
                provider="groq",
                model="llama-3.3-70b-versatile",
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

        # 4. Seed initial sample logs for immediate dashboard metrics
        db.flush()
        sample_logs_count = db.query(RequestLog).count()
        if sample_logs_count == 0 and card_scanner and rewriter:
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
                model="gemini-1.5-flash",
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
                estimated_cost=0.000205,
                provider="groq",
                model="llama-3.3-70b-versatile",
                request_preview='{"text": "We are releasing our new vector database today.", "tone": "exciting", "word_count": 50}',
                response_preview='{"rewritten_text": "Thrilled to unveil our lightning-fast vector database today! Engineered for next-gen AI applications with ultra-low latency.", "word_count": 18}',
            ))
            print("[Seed] Created initial demonstration request logs")

        db.commit()
        print("\n=== Seeding Completed Successfully! ===")
        print(f"Admin Credentials: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}")
        print(f"Card Scanner Demo Key: {DEMO_CARD_SCANNER_KEY}")
        print(f"Content Rewriter Demo Key: {DEMO_REWRITER_KEY}")
    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
