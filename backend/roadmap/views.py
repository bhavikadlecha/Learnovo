
import os
import requests
import json
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Topic, UserProgress, StudyPlan, RoadmapTopic  # ✅ Add RoadmapTopic
from .serializers import StudyPlanSerializer
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
    default_user = get_default_user()
    print("🔐 Using default user:", default_user.username)

    topic_name = request.GET.get("topic")
    total_hours = request.GET.get("time")

    if not topic_name:
        return Response({"error": "No topic provided"}, status=400)

    prompt = f"""You are a study planning assistant. Generate a hierarchical roadmap for the topic '{topic_name}' with clear logical dependencies between topics and subtopics.

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
}} Only return JSON. No explanation."""

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
            return Response({"error": "Failed to parse JSON", "raw_output": raw_output}, status=500)

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

        main_topic, _ = Topic.objects.get_or_create(name=topic_name, defaults={"subject": "General"})

        def save_topics(items, parent_subject):
            for item in items:
                topic_name = item["topic"]
                est_time = item.get("estimated_time_hours", 0)
                topic_obj, _ = Topic.objects.get_or_create(
                    name=topic_name,
                    defaults={"subject": parent_subject, "estimated_time": est_time}
                )
                UserProgress.objects.get_or_create(
                    user=default_user,
                    topic=topic_obj,
                    defaults={"time_spent": 0, "target_time": est_time, "completed": False}
                )
                if "subtopics" in item:
                    save_topics(item["subtopics"], parent_subject)

        save_topics(roadmap_data["roadmap"], topic_name)
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