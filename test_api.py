import requests
import json

# Test the signup endpoint
def test_signup():
    url = "http://localhost:8000/api/users/register/"
    data = {
        "username": "newuser2025",
        "email": "newuser2025@example.com",
        "first_name": "New",
        "last_name": "User", 
        "password": "testpass123",
        "confirm_password": "testpass123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Signup Status Code: {response.status_code}")
        print(f"Signup Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Signup Error: {e}")
        return False

# Test the login endpoint
def test_login():
    url = "http://localhost:8000/api/users/login/"
    data = {
        "identifier": "newuser2025@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Login Status Code: {response.status_code}")
        print(f"Login Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Login Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing API endpoints...")
    
    # Test signup
    print("\n1. Testing Signup:")
    signup_success = test_signup()
    
    # Test login
    print("\n2. Testing Login:")
    login_success = test_login()
    
    print(f"\n=== Results ===")
    print(f"Signup: {'✅ PASS' if signup_success else '❌ FAIL'}")
    print(f"Login: {'✅ PASS' if login_success else '❌ FAIL'}")
