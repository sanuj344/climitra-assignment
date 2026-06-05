from app.database import SessionLocal, engine
from app.models import User, RoleEnum, Base
from app.security import get_password_hash

def seed_users():
    db = SessionLocal()
    
    users = [
        {"email": "admin@climitra.local", "password": "Admin123!", "role": RoleEnum.admin},
        {"email": "reviewer@climitra.local", "password": "Reviewer123!", "role": RoleEnum.reviewer},
        {"email": "operator@climitra.local", "password": "Operator123!", "role": RoleEnum.operator},
    ]
    
    for u in users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"]
            )
            db.add(new_user)
    
    db.commit()
    db.close()
    print("Seed users created successfully.")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_users()
