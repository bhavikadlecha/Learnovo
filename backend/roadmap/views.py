import json
import re
import requests
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.test import RequestFactory
from .models import StudyPlan, RoadmapTopic, UserRoadmap, Topic, UserProgress
from .serializers import StudyPlanSerializer, UserRoadmapSerializer
from django.contrib.auth import get_user_model
from django.conf import settings

# Get GROQ API key from settings or environment
GROQ_API_KEY = getattr(settings, 'GROQ_API_KEY', os.environ.get('GROQ_API_KEY'))

# Get the custom user model
User = get_user_model()

# ===== Fallback function if AI fails =====
def get_fallback_roadmap(topics):
    return {
        "roadmaps": [
            {
                "id": "1",
                "topic": "Introduction",
                "estimated_time_hours": 0.5,
                "prerequisites": [],
                "subtopics": [
                    {
                        "id": "1.1",
                        "topic": f"Overview of {', '.join(topics)}",
                        "estimated_time_hours": 0.25,
                        "prerequisites": ["1"]
                    }
                ]
            }
        ]
    }

# ===== Extract JSON from any messy model output =====
def extract_json(text):
    try:
        match = re.search(r"\{[\s\S]*\}$", text.strip())
        if match:
            return json.loads(match.group(0))
    except json.JSONDecodeError:
        pass
    return None

def generate_roadmap_with_groq(topics, total_hours=None):
    import json, re, requests

    if isinstance(topics, str):
        topics = [topics]

    topic_str = ", ".join(topics)

    prompt = f"""
You are a study planning assistant.
Generate a hierarchical, interdependent study roadmap covering ALL of these topics: {topic_str}.
- All topics MUST be connected logically with prerequisites and follow-ups.
- Include any additional prerequisite topics needed to connect them into a single coherent learning path.
- No redundancy in topics.
- Output ONLY valid JSON, with no explanations, no markdown, no text outside the JSON object.
- JSON format:
{{
  "main_topics": {topics},
  "roadmap": [
    {{
      "id": "1",
      "topic": "Main Concept",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "Sub Concept",
          "estimated_time_hours": 2,
          "prerequisites": ["1"]
        }}
      ]
    }}
  ]
}}
"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 4000  # Increased to avoid truncation
    }

    def request_and_parse():
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        if res.status_code != 200:
            raise ValueError(f"Groq API error {res.status_code}: {res.text}")

        data = res.json()
        raw_output = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Remove markdown fences
        raw_output = re.sub(r"^```[a-zA-Z]*\n?", "", raw_output.strip())
        raw_output = re.sub(r"\n?```$", "", raw_output.strip())

        # Remove any explanation before JSON
        first_brace = raw_output.find("{")
        if first_brace != -1:
            raw_output = raw_output[first_brace:]

        return json.loads(raw_output)

    try:
        roadmap_data = request_and_parse()
    except json.JSONDecodeError:
        print("Warning: JSON was incomplete — retrying once...")
        roadmap_data = request_and_parse()

    # Scale durations if total_hours provided
    if total_hours and "roadmap" in roadmap_data:
        try:
            total_hours = float(total_hours)

            def sum_hours(items):
                return sum(
                    item.get("estimated_time_hours", 0) +
                    sum_hours(item.get("subtopics", []))
                    for item in items
                )

            actual_total = sum_hours(roadmap_data["roadmap"])
            if actual_total > 0:
                scale = total_hours / actual_total

                def scale_hours(items):
                    for item in items:
                        if "estimated_time_hours" in item:
                            item["estimated_time_hours"] = round(item["estimated_time_hours"] * scale, 2)
                        if "subtopics" in item:
                            scale_hours(item["subtopics"])
                    return items

                roadmap_data["roadmap"] = scale_hours(roadmap_data["roadmap"])
        except Exception as e:
            print(f"Warning: Failed to scale hours: {e}")

    return roadmap_data


# ===== Main view =====
@csrf_exempt
def generate_roadmap(request):
    if request.method == "POST":
        try:
            body = json.loads(request.body)
            topics = body.get("topics", [])

            # Strictly try Groq first
            roadmap_data = generate_roadmap_with_groq(topics)

            # Only fallback if API fully fails or JSON invalid
            if not roadmap_data:
                roadmap_data = get_fallback_roadmap(topics)

            return JsonResponse(roadmap_data, safe=False)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON input"}, status=400)

    return JsonResponse({"error": "Only POST method allowed"}, status=405)


# ===== Helper function to get default user =====
def get_default_user():
    """Get or create a default user for development purposes"""
    try:
        return User.objects.get(username='default_user')
    except User.DoesNotExist:
        return User.objects.create_user(
            username='default_user',
            email='default@example.com',
            password='defaultpass123'
        )


@api_view(['POST'])
def create_study_plan(request):
    print("Received data:", request.data)
    serializer = StudyPlanSerializer(data=request.data)
    if serializer.is_valid():
        default_user = get_default_user()
        plan = serializer.save(user=default_user)

        topic_name = serializer.data.get("main_topic")
        available_time = serializer.data.get("available_time")

        roadmap_data = []

        # Try to generate roadmap via GROQ API directly
        try:
            print(f"Attempting to generate roadmap for topic(s): {topic_name}")

            # Call Groq API directly instead of internal request
            roadmap_data = generate_roadmap_with_groq(
                topics=[topic_name],
                total_hours=available_time
            )

            if not roadmap_data or "roadmap" not in roadmap_data:
                raise ValueError("Invalid roadmap JSON from Groq")

            roadmap_data = roadmap_data["roadmap"]

            print(f"Extracted roadmap data: {len(roadmap_data)} items")
            if roadmap_data:
                print(f"First item structure: {roadmap_data[0]}")

        except Exception as e:
            print(f"Error generating roadmap: {e}")
            roadmap_data = []

        # Fallback roadmap if Groq failed
        if not roadmap_data:
            print("Warning: Using fallback roadmap")
            hours_per_topic = max(1, int(available_time) // 4) if available_time else 5
            roadmap_data = [
                {
                    "id": "1",
                    "topic": f"Introduction to {topic_name}",
                    "estimated_time_hours": hours_per_topic
                },
                {
                    "id": "2",
                    "topic": f"Fundamentals of {topic_name}",
                    "estimated_time_hours": hours_per_topic
                },
                {
                    "id": "3",
                    "topic": f"Advanced {topic_name}",
                    "estimated_time_hours": hours_per_topic
                },
                {
                    "id": "4",
                    "topic": f"Practice and Projects in {topic_name}",
                    "estimated_time_hours": hours_per_topic
                }
            ]

        # Save complete roadmap
        user_roadmap = UserRoadmap.objects.create(
            user=default_user,
            title=f"{topic_name} - Study Plan",
            subject=topic_name,
            roadmap_data={'roadmap': roadmap_data}
        )

        # Save flattened version for progress tracking
        def flatten_roadmap_for_db(items, plan_ref):
            for item in items:
                RoadmapTopic.objects.create(
                    study_plan=plan_ref,
                    title=item.get("topic", "Unknown Topic"),
                    description=f"Estimated time: {item.get('estimated_time_hours', 0)} hours (ID: {item.get('id', '')})"
                )
                if 'subtopics' in item and item['subtopics']:
                    flatten_roadmap_for_db(item['subtopics'], plan_ref)

        flatten_roadmap_for_db(roadmap_data, plan)

        print(f"Saved roadmap: {len(roadmap_data)} main topics with nested subtopics")
        print(f"UserRoadmap ID: {user_roadmap.id}")

        return Response({
            "plan": serializer.data,
            "roadmap": {
                "main_topic": topic_name,
                "roadmap": roadmap_data,
                "user_roadmap_id": user_roadmap.id
            }
        }, status=status.HTTP_201_CREATED)

    print("Error: Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def user_study_plans(request):
    user = get_default_user()
    plans = StudyPlan.objects.filter(user=user)
    
    # Enhance plans with complete roadmap data from UserRoadmap
    enhanced_plans = []
    for plan in plans:
        plan_data = StudyPlanSerializer(plan).data
        
        # Try to find associated UserRoadmap with complete nested data
        try:
            user_roadmap = UserRoadmap.objects.filter(
                user=user,
                title__icontains=plan.main_topic
            ).first()
            
            if user_roadmap and user_roadmap.roadmap_data:
                # Use complete nested roadmap from UserRoadmap
                plan_data['roadmaps'] = user_roadmap.roadmap_data.get('roadmap', [])
                plan_data['roadmap_data'] = user_roadmap.roadmap_data
                print(f"Enhanced plan '{plan.main_topic}' with complete roadmap data ({len(plan_data['roadmaps'])} items)")
            else:
                # Fallback to basic roadmap from RoadmapTopic (main topics only)
                print(f"Warning: Using fallback roadmap for '{plan.main_topic}' (no UserRoadmap found)")
                
        except Exception as e:
            print(f"Error enhancing plan '{plan.main_topic}': {e}")
            
        enhanced_plans.append(plan_data)
    
    print(f"Returning {len(enhanced_plans)} enhanced study plans")
    return Response(enhanced_plans)


@api_view(['GET'])
def get_studyplan_detail(request, pk):
    user = get_default_user()
    try:
        plan = StudyPlan.objects.get(pk=pk, user=user)
        serializer = StudyPlanSerializer(plan)
        return Response(serializer.data)
    except StudyPlan.DoesNotExist:
        return Response({'error': 'StudyPlan not found'}, status=404)


@api_view(['DELETE'])
def delete_study_plan(request, pk):
    user = get_default_user()
    try:
        plan = StudyPlan.objects.get(pk=pk, user=user)
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except StudyPlan.DoesNotExist:
        return Response({'error': 'StudyPlan not found'}, status=404)


@api_view(['GET'])
def get_roadmap_cards(request):
    """Get available roadmap topics/cards for users to choose from"""
    
    cards = [
        {
            "id": 1,
            "title": "Web Development Fundamentals",
            "description": "Learn HTML, CSS, JavaScript basics",
            "difficulty": "Beginner",
            "estimated_time": "40-60 hours",
            "topics": ["HTML", "CSS", "JavaScript"]
        },
        {
            "id": 2,
            "title": "Data Structures & Algorithms",
            "description": "Master fundamental CS concepts",
            "difficulty": "Intermediate",
            "estimated_time": "80-120 hours",
            "topics": ["Arrays", "Trees", "Graphs", "Sorting"]
        },
        {
            "id": 3,
            "title": "Machine Learning Basics",
            "description": "Introduction to ML concepts and Python",
            "difficulty": "Intermediate",
            "estimated_time": "60-80 hours",
            "topics": ["Python", "NumPy", "Scikit-learn", "Linear Regression"]
        }
    ]
    
    return Response(cards)


@api_view(['POST'])
def create_roadmap_from_form(request):
    """Create a custom roadmap from form data"""
    try:
        data = request.data
        
        # Create UserRoadmap with form data
        user_roadmap = UserRoadmap.objects.create(
            user=get_default_user(),
            title=data.get('title', 'Custom Roadmap'),
            description=data.get('description', ''),
            subject=data.get('subject', 'General'),
            proficiency=data.get('proficiency', 'Beginner'),
            weekly_hours=data.get('weekly_hours', 10),
            deadline=data.get('deadline'),
            roadmap_data=data.get('roadmap_data', {})
        )
        
        serializer = UserRoadmapSerializer(user_roadmap)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_user_roadmaps(request):
    """Get all user roadmaps"""
    user = get_default_user()
    roadmaps = UserRoadmap.objects.filter(user=user)
    serializer = UserRoadmapSerializer(roadmaps, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_user_roadmap(request, roadmap_id):
    """Delete a user roadmap"""
    user = get_default_user()
    try:
        roadmap = UserRoadmap.objects.get(id=roadmap_id, user=user)
        roadmap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except UserRoadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found'}, status=404)


@api_view(['GET'])
def get_roadmap_detail(request, roadmap_id):
    """Get detailed roadmap data"""
    user = get_default_user()
    try:
        roadmap = UserRoadmap.objects.get(id=roadmap_id, user=user)
        serializer = UserRoadmapSerializer(roadmap)
        return Response(serializer.data)
    except UserRoadmap.DoesNotExist:
        return Response({'error': 'Roadmap not found'}, status=404)
