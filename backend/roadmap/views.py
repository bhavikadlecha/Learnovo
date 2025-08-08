
import os
import requests
import json
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Topic, UserProgress, StudyPlan, RoadmapTopic, UserRoadmap  # ✅ Add UserRoadmap
from .serializers import StudyPlanSerializer, UserRoadmapSerializer
from django.contrib.auth.models import User
from django.test.client import RequestFactory

load_dotenv("key.env")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def get_default_user():
    user, created = User.objects.get_or_create(
        username="BHAVI",
        defaults={"email": "chikukadlecha@gmail.com"}
    )
    if created:
        user.set_password("chiku304")  # ✅ Hash password
    if not user.is_superuser:
        user.is_superuser = True
    user.save()
    return user



@api_view(['GET'])
def generate_roadmap(request):
    topic_name = request.GET.get("topic")
    total_hours = request.GET.get("time")
    user_id = request.GET.get("user_id")

    if not topic_name:
        return Response({"error": "No topic provided"}, status=400)

    prompt = f"""
You are a study planning assistant. Generate a hierarchical roadmap for the topic '{topic_name}' with clear logical dependencies between topics and subtopics.

Output strictly valid JSON in this format:
{{
  "main_topic": "{topic_name}",
  "roadmap": [
    {{
      "id": "1",
      "topic": "Main Concept A",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "Sub A1",
          "estimated_time_hours": 2,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.2",
          "topic": "Sub A2",
          "estimated_time_hours": 2,
          "prerequisites": ["1.1"]
        }}
      ]
    }},
    {{
      "id": "2",
      "topic": "Main Concept B",
      "estimated_time_hours": 3,
      "prerequisites": ["1.2"]
    }}
  ]
}}
Only return JSON. No explanation.
"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        data = res.json()

        if "choices" not in data or not data["choices"]:
            return Response({"error": "Invalid API response", "details": data}, status=500)

        raw_output = data["choices"][0]["message"]["content"]

        try:
            roadmap_data = json.loads(raw_output)
        except json.JSONDecodeError:
            return Response({"error": "Failed to parse JSON from API", "raw_output": raw_output}, status=500)

        # Optional: scale durations
        if total_hours:
            try:
                total_hours = float(total_hours)

                def sum_hours(items):
                    total = 0
                    for item in items:
                        total += item.get("estimated_time_hours", 0)
                        if "subtopics" in item:
                            total += sum_hours(item["subtopics"])
                    return total

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
            except:
                pass

        # Save roadmap
        main_topic, _ = Topic.objects.get_or_create(name=topic_name, defaults={"subject": "General"})

        def save_topics(items, parent_subject):
            for item in items:
                topic_name = item["topic"]
                est_time = item.get("estimated_time_hours", 0)
                topic_obj, _ = Topic.objects.get_or_create(name=topic_name, defaults={"subject": parent_subject, "estimated_time": est_time})
                if user_id:
                    UserProgress.objects.get_or_create(
                        user_id=user_id,
                        topic=topic_obj,
                        defaults={"time_spent": 0, "target_time": est_time, "completed": False}
                    )
                if "subtopics" in item:
                    save_topics(item["subtopics"], parent_subject)

        save_topics(roadmap_data["roadmap"], topic_name)

        return Response(roadmap_data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
        return Response(roadmap_data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def create_study_plan(request):
    serializer = StudyPlanSerializer(data=request.data)
    if serializer.is_valid():
        default_user = get_default_user()
        plan = serializer.save(user=default_user)

        topic_name = serializer.data.get("main_topic")
        available_time = serializer.data.get("available_time")

        factory = RequestFactory()
        roadmap_request = factory.get(
            '/roadmap/generate_roadmap/',
            {'topic': topic_name, 'time': available_time}
        )
        roadmap_request.user = default_user
        roadmap_response = generate_roadmap(roadmap_request)

        roadmap_data = roadmap_response.data.get("roadmap", [])

        # ✅ Save roadmap topics to DB
        def save_roadmap_items(items, plan, id_map={}):
            for item in items:
                topic = item["topic"]
                hours = item.get("estimated_time_hours", 0)
                prerequisites = item.get("prerequisites", [])

                node = RoadmapTopic.objects.create(
                    plan=plan,
                    topic=topic,
                    estimated_time_hours=hours
                )
                id_map[item["id"]] = node
                node._prereq_ids = prerequisites

                if "subtopics" in item:
                    save_roadmap_items(item["subtopics"], plan, id_map)
            return id_map

        id_map = save_roadmap_items(roadmap_data, plan)

        # ✅ Link prerequisites
        for node in id_map.values():
            if hasattr(node, "_prereq_ids"):
                for pid in node._prereq_ids:
                    prereq = id_map.get(pid)
                    if prereq:
                        node.prerequisites.add(prereq)

        return Response({
            "plan": serializer.data,
            "roadmap": roadmap_response.data
        }, status=status.HTTP_201_CREATED)

        print("❌ Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_study_plans(request):
    user = get_default_user()
    plans = StudyPlan.objects.filter(user=user)
    serializer = StudyPlanSerializer(plans, many=True)
    return Response(serializer.data)


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
    
    # Predefined popular roadmap topics
    roadmap_cards = [
        {
            "id": 1,
            "title": "Web Development",
            "description": "Learn HTML, CSS, JavaScript, and modern frameworks like React, Vue, or Angular",
            "category": "Programming",
            "difficulty": "Beginner",
            "estimated_hours": 120,
            "icon": "🌐",
            "color": "bg-blue-500"
        },
        {
            "id": 2,
            "title": "Data Science",
            "description": "Master Python, statistics, machine learning, and data visualization",
            "category": "Data",
            "difficulty": "Intermediate",
            "estimated_hours": 200,
            "icon": "📊",
            "color": "bg-green-500"
        },
        {
            "id": 3,
            "title": "Mobile App Development",
            "description": "Build native and cross-platform mobile apps with React Native or Flutter",
            "category": "Programming",
            "difficulty": "Intermediate",
            "estimated_hours": 150,
            "icon": "📱",
            "color": "bg-purple-500"
        },
        {
            "id": 4,
            "title": "Machine Learning",
            "description": "Deep dive into algorithms, neural networks, and AI model development",
            "category": "AI/ML",
            "difficulty": "Advanced",
            "estimated_hours": 300,
            "icon": "🤖",
            "color": "bg-red-500"
        },
        {
            "id": 5,
            "title": "DevOps Engineering",
            "description": "Learn Docker, Kubernetes, CI/CD, and cloud infrastructure management",
            "category": "Infrastructure",
            "difficulty": "Advanced",
            "estimated_hours": 180,
            "icon": "⚙️",
            "color": "bg-yellow-500"
        },
        {
            "id": 6,
            "title": "Cybersecurity",
            "description": "Understand security fundamentals, ethical hacking, and network protection",
            "category": "Security",
            "difficulty": "Intermediate",
            "estimated_hours": 160,
            "icon": "🔒",
            "color": "bg-indigo-500"
        },
        {
            "id": 7,
            "title": "Cloud Computing",
            "description": "Master AWS, Azure, or Google Cloud services and architecture",
            "category": "Infrastructure",
            "difficulty": "Intermediate",
            "estimated_hours": 140,
            "icon": "☁️",
            "color": "bg-cyan-500"
        },
        {
            "id": 8,
            "title": "UI/UX Design",
            "description": "Learn design principles, user research, and prototyping tools",
            "category": "Design",
            "difficulty": "Beginner",
            "estimated_hours": 100,
            "icon": "🎨",
            "color": "bg-pink-500"
        }
    ]
    
    return Response({"roadmap_cards": roadmap_cards})


@api_view(['POST'])
def create_roadmap_from_form(request):
    """Create a roadmap from form submission data"""
    try:
        # Extract form data
        subject = request.data.get('subject')
        topic = request.data.get('topic')
        proficiency = request.data.get('proficiency')
        weekly_hours = int(request.data.get('weeklyHours', 10))
        deadline = request.data.get('deadline')
        user_id = request.data.get('user_id')

        if not topic:
            return Response({"error": "Topic is required"}, status=400)

        # Calculate total hours based on weekly hours and deadline
        total_hours = weekly_hours * 4  # Default to 4 weeks if no deadline
        if deadline:
            from datetime import datetime, date
            try:
                deadline_date = datetime.strptime(deadline, '%Y-%m-%d').date()
                today = date.today()
                weeks_available = max(1, (deadline_date - today).days // 7)
                total_hours = weekly_hours * weeks_available
            except:
                pass

        # Generate roadmap using existing logic
        prompt = f"""
You are a study planning assistant. Generate a hierarchical roadmap for the topic '{topic}' suitable for {proficiency} level learners with clear logical dependencies between topics and subtopics.

Consider:
- Proficiency level: {proficiency}
- Subject area: {subject}
- Available weekly hours: {weekly_hours}
- Target total hours: {total_hours}

Output strictly valid JSON in this format:
{{
  "main_topic": "{topic}",
  "roadmap": [
    {{
      "id": "1",
      "topic": "Main Concept A",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "Sub A1",
          "estimated_time_hours": 2,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.2",
          "topic": "Sub A2",
          "estimated_time_hours": 2,
          "prerequisites": ["1.1"]
        }}
      ]
    }},
    {{
      "id": "2",
      "topic": "Main Concept B",
      "estimated_time_hours": 3,
      "prerequisites": ["1.2"]
    }}
  ]
}}
Only return JSON. No explanation.
"""

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 1500
        }

        # Call GROQ API
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        data = res.json()

        if "choices" not in data or not data["choices"]:
            return Response({"error": "Invalid API response", "details": data}, status=500)

        raw_output = data["choices"][0]["message"]["content"]

        try:
            roadmap_data = json.loads(raw_output)
        except json.JSONDecodeError:
            return Response({"error": "Failed to parse JSON from API", "raw_output": raw_output}, status=500)

        # Scale hours to match target
        if total_hours:
            def sum_hours(items):
                total = 0
                for item in items:
                    total += item.get("estimated_time_hours", 0)
                    if "subtopics" in item:
                        total += sum_hours(item["subtopics"])
                return total

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

        # Save to UserRoadmap model
        user_roadmap_data = {
            'title': topic,
            'description': f"Generated roadmap for {topic} ({proficiency} level)",
            'subject': subject or 'General',
            'proficiency': proficiency,
            'weekly_hours': weekly_hours,
            'deadline': deadline if deadline else None,
            'roadmap_data': roadmap_data,
            'user_id': user_id
        }

        serializer = UserRoadmapSerializer(data=user_roadmap_data)
        if serializer.is_valid():
            user_roadmap = serializer.save()
            return Response({
                "success": True,
                "roadmap_id": user_roadmap.id,
                "roadmap": roadmap_data,
                "message": f"Roadmap for '{topic}' created successfully!"
            }, status=201)
        else:
            return Response({"error": "Failed to save roadmap", "details": serializer.errors}, status=400)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_user_roadmaps(request):
    """Get all roadmaps created by users"""
    user_id = request.GET.get('user_id')
    
    if user_id:
        roadmaps = UserRoadmap.objects.filter(user_id=user_id)
    else:
        roadmaps = UserRoadmap.objects.all()
    
    serializer = UserRoadmapSerializer(roadmaps, many=True)
    return Response({"roadmaps": serializer.data})


@api_view(['GET'])
def get_roadmap_detail(request, roadmap_id):
    """Get detailed roadmap by ID"""
    try:
        roadmap = UserRoadmap.objects.get(id=roadmap_id)
        serializer = UserRoadmapSerializer(roadmap)
        return Response(serializer.data)
    except UserRoadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=404)