#!/usr/bin/env python3

import os
from dotenv import load_dotenv

print("🔍 Environment Variable Debug:")

# Check current environment
current_key = os.getenv("GROQ_API_KEY")
print(f"Current ENV GROQ_API_KEY: {current_key[:20] if current_key else 'None'}...{current_key[-10:] if current_key else ''}")

# Load from file directly
load_dotenv(os.path.join('backend', 'key.env'))
loaded_key = os.getenv("GROQ_API_KEY")
print(f"After load_dotenv: {loaded_key[:20] if loaded_key else 'None'}...{loaded_key[-10:] if loaded_key else ''}")

# Read file directly
try:
    with open(os.path.join('backend', 'key.env'), 'r') as f:
        content = f.read()
    
    for line in content.split('\n'):
        if line.startswith('GROQ_API_KEY='):
            file_key = line.split('=', 1)[1]
            print(f"From file directly: {file_key[:20]}...{file_key[-10:]}")
            
            if current_key != file_key:
                print("⚠️ MISMATCH: Environment variable doesn't match file!")
            else:
                print("✅ Environment variable matches file")
            break
except Exception as e:
    print(f"Error reading file: {e}")

print(f"\nAll environment variables with 'GROQ':")
for key, value in os.environ.items():
    if 'GROQ' in key.upper():
        print(f"  {key}: {value[:20]}...{value[-10:] if len(value) > 30 else value}")
