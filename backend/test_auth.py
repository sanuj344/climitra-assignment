import urllib.request
import json

def test_login_and_stats():
    # Login
    req = urllib.request.Request(
        "http://localhost:8000/api/auth/login",
        data=json.dumps({"email": "admin@climitra.local", "password": "Admin123!"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            token = data["access_token"]
            print("Token retrieved successfully")
    except urllib.error.HTTPError as e:
        print("Login failed:", e.code, e.read().decode())
        return

    # Get stats
    req = urllib.request.Request(
        "http://localhost:8000/api/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            print("Stats status:", res.getcode())
    except urllib.error.HTTPError as e:
        print("Stats failed:", e.code, e.read().decode())

if __name__ == "__main__":
    test_login_and_stats()
