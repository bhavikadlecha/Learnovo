
import os
import requests
import json
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Topic, UserProgress, StudyPlan, RoadmapTopic, UserRoadmap  # ✅ Add UserRoadmap
from .serializers import StudyPlanSerializer, UserRoadmapSerializer
from django.contrib.auth import get_user_model
from django.test.client import RequestFactory

User = get_user_model()  # This will get the CustomUser model

load_dotenv("key.env")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def call_groq_api_for_roadmap(topics_list, total_hours=None):
    """Shared function to call GROQ API and generate roadmap"""
    
    # Refined prompt for DAG with multiple parents
    prompt = f"""
You are a study planning assistant. Given the input topics: {", ".join(topics_list)}, generate a single unified Directed Acyclic Graph (DAG) representing their complete logical dependency roadmap.

Rules:
- DAG: each topic node can have multiple parents in its "prerequisites".
- Include missing prerequisite topics to ensure all input topics are connected.
- Merge shared prerequisites, do NOT duplicate topic names.
- Every node has:
  - "id" (unique hierarchical like 1, 1.1, 2, etc.)
  - "topic" (short name)
  - "estimated_time_hours" (float)
  - "prerequisites" (list of node IDs — can have >1)
  - optional "subtopics" (children in hierarchy)
- Output ONLY valid JSON. No explanation or markdown.

Example:
{{
  "main_topics": {topics_list},
  "roadmap": [
    {{
      "id": "1",
      "topic": "Tree",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "DFS",
          "estimated_time_hours": 3,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.2",
          "topic": "BFS",
          "estimated_time_hours": 3,
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
        "max_tokens": 3000
    }

    try:
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        data = res.json()

        if "choices" not in data or not data["choices"]:
            return {"error": "Invalid API response", "details": data}

        raw_output = data["choices"][0]["message"]["content"].strip()

        # Remove markdown JSON fences if present
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("```").replace("json", "", 1).strip()

        # Clean up JSON format issues
        import re
        
        # Simple and reliable fix: replace all single quotes with double quotes
        # This handles the array format issue: ['item'] becomes ["item"]
        raw_output = raw_output.replace("'", '"')

        try:
            roadmap_data = json.loads(raw_output)
        except json.JSONDecodeError as e:
            return {"error": "Failed to parse JSON", "raw_output": raw_output, "json_error": str(e)}

        # Deduplicate nodes by topic name (case-insensitive)
        def dedupe_nodes(nodes, seen):
            unique = []
            for n in nodes:
                key = n["topic"].strip().lower()
                if key in seen:
                    continue
                seen.add(key)
                if "subtopics" in n:
                    n["subtopics"] = dedupe_nodes(n["subtopics"], seen)
                unique.append(n)
            return unique

        roadmap_data["roadmap"] = dedupe_nodes(roadmap_data["roadmap"], set())

        # Optional: scale estimated_time_hours based on total_hours provided
        if total_hours:
            try:
                total_hours = float(total_hours)
                current_total = sum(item.get("estimated_time_hours", 0) for item in roadmap_data["roadmap"])
                if current_total > 0:
                    scale = total_hours / current_total
                    def scale_hours(items):
                        for item in items:
                            item["estimated_time_hours"] = round(item["estimated_time_hours"] * scale, 2)
                            if "subtopics" in item:
                                scale_hours(item["subtopics"])
                        return items
                    roadmap_data["roadmap"] = scale_hours(roadmap_data["roadmap"])
            except (ValueError, TypeError):
                pass  # Keep original hours if scaling fails

        return roadmap_data

    except Exception as e:
        return {"error": f"GROQ API error: {str(e)}"}


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
    topics_param = request.GET.get("topics")  # Comma-separated topics
    total_hours = request.GET.get("time")
    user_id = request.GET.get("user_id")

    if not topics_param:
        return Response({"error": "No topics provided"}, status=400)

    topics_list = [t.strip() for t in topics_param.split(",") if t.strip()]

    # Refined prompt for DAG with multiple parents
    prompt = f"""
You are a study planning assistant. Given the input topics: {", ".join(topics_list)}, generate a single unified Directed Acyclic Graph (DAG) representing their complete logical dependency roadmap.

Rules:
- DAG: each topic node can have multiple parents in its "prerequisites".
- Include missing prerequisite topics to ensure all input topics are connected.
- Merge shared prerequisites, do NOT duplicate topic names.
- Every node has:
  - "id" (unique hierarchical like 1, 1.1, 2, etc.)
  - "topic" (short name)
  - "estimated_time_hours" (float)
  - "prerequisites" (list of node IDs — can have >1)
  - optional "subtopics" (children in hierarchy)
- Output ONLY valid JSON. No explanation or markdown.

Example:
{{
  "main_topics": {topics_list},
  "roadmap": [
    {{
      "id": "1",
      "topic": "Tree",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "DFS",
          "estimated_time_hours": 3,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.2",
          "topic": "BFS",
          "estimated_time_hours": 3,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.3",
          "topic": "Binary Tree",
          "estimated_time_hours": 4,
          "prerequisites": ["1"]
        }},
        {{
          "id": "1.4",
          "topic": "Queue",
          "estimated_time_hours": 2,
          "prerequisites": ["1"],
          "subtopics": [
            {{
              "id": "1.4.1",
              "topic": "Priority Queue",
              "estimated_time_hours": 3,
              "prerequisites": ["1.4"]
            }}
          ]
        }}
      ]
    }},
    {{
      "id": "2",
      "topic": "Backtracking",
      "estimated_time_hours": 4,
      "prerequisites": ["1.1", "1.2"]
    }},
    {{
      "id": "3",
      "topic": "Greedy Approach",
      "estimated_time_hours": 4,
      "prerequisites": ["1.1", "1.2"]
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
        "temperature": 0.3,  # Low for consistency
        "max_tokens": 3000
    }

    try:
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        data = res.json()

        if "choices" not in data or not data["choices"]:
            return Response({"error": "Invalid API response", "details": data}, status=500)

        raw_output = data["choices"][0]["message"]["content"].strip()

        # Remove markdown JSON fences if present
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("```").replace("json", "", 1).strip()


        try:
            roadmap_data = json.loads(raw_output)
        except json.JSONDecodeError:
            return Response({"error": "Failed to parse JSON", "raw_output": raw_output}, status=500)

        # Deduplicate nodes by topic name (case-insensitive)
        def dedupe_nodes(nodes, seen):
            unique = []
            for n in nodes:
                key = n["topic"].strip().lower()
                if key in seen:
                    continue
                seen.add(key)
                if "subtopics" in n:
                    n["subtopics"] = dedupe_nodes(n["subtopics"], seen)
                unique.append(n)
            return unique

        roadmap_data["roadmap"] = dedupe_nodes(roadmap_data["roadmap"], set())

        # Optional: scale estimated_time_hours based on total_hours provided
        if total_hours:
            try:
                total_hours = float(total_hours)

                def sum_hours(items):
                    total = 0
                    for i in items:
                        total += i.get("estimated_time_hours", 0)
                        if "subtopics" in i:
                            total += sum_hours(i["subtopics"])
                    return total

                def scale_hours(items, scale):
                    for i in items:
                        if "estimated_time_hours" in i:
                            i["estimated_time_hours"] = round(i["estimated_time_hours"] * scale, 2)
                        if "subtopics" in i:
                            scale_hours(i["subtopics"], scale)
                    return items

                actual_total = sum_hours(roadmap_data["roadmap"])
                if actual_total > 0:
                    scale = total_hours / actual_total
                    roadmap_data["roadmap"] = scale_hours(roadmap_data["roadmap"], scale)

            except Exception as e:
                print("Scaling error:", e)

        # Save to DB
        for topic_name in topics_list:
            Topic.objects.get_or_create(name=topic_name, defaults={"subject": "General"})

        def save_nodes(nodes, parent_subject):
            for n in nodes:
                topic_obj, _ = Topic.objects.get_or_create(
                    name=n["topic"],
                    defaults={"subject": parent_subject, "estimated_time": n.get("estimated_time_hours", 0)}
                )
                if user_id:
                    UserProgress.objects.get_or_create(
                        user_id=user_id,
                        topic=topic_obj,
                        defaults={"time_spent": 0, "target_time": n.get("estimated_time_hours", 0), "completed": False}
                    )
                if "subtopics" in n:
                    save_nodes(n["subtopics"], parent_subject)

        save_nodes(roadmap_data["roadmap"], "General")

        return Response(roadmap_data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def create_study_plan(request):
    print("=" * 50)
    print("🚀 create_study_plan CALLED! (LATEST VERSION)")
    print("=" * 50)
    print("🔍 create_study_plan called with data:", request.data)
    
    # THE SOLUTION: Use direct localStorage approach
    # Since the frontend is using localStorage and we know that works reliably,
    # let's ensure the backend returns the data in the correct format for frontend storage
    
    serializer = StudyPlanSerializer(data=request.data)
    if serializer.is_valid():
        default_user = get_default_user()
        plan = serializer.save(user=default_user)

        topic_name = serializer.data.get("main_topic")
        available_time = serializer.data.get("available_time")
        
        print(f"🔍 Processing: topic='{topic_name}', time={available_time}")

        # Try to generate roadmap via GROQ API (direct call to shared function)
        try:
            print("🔍 Attempting to call GROQ API directly...")
            
            topics_list = [t.strip() for t in topic_name.split(",") if t.strip()]
            roadmap_result = call_groq_api_for_roadmap(topics_list, available_time)
            
            if "error" in roadmap_result:
                print(f"🔍 GROQ API error: {roadmap_result['error']}, using fallback roadmap")
                roadmap_data = []
            else:
                roadmap_data = roadmap_result.get("roadmap", [])
                print(f"🔍 GROQ API returned {len(roadmap_data)} main topics")
                
                # Count subtopics
                total_subtopics = 0
                for item in roadmap_data:
                    if isinstance(item, dict) and 'subtopics' in item:
                        total_subtopics += len(item.get('subtopics', []))
                print(f"🔍 Total subtopics found: {total_subtopics}")
        except Exception as e:
            print(f"🔍 Error calling GROQ API: {e}")
            roadmap_data = []
                
        except Exception as e:
            print(f"🔍 Error generating roadmap: {e}")
            roadmap_data = []

        # Create fallback roadmap if API failed
        if not roadmap_data:
            print("Creating fallback roadmap")
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

        # Save roadmap topics to DB (keep existing RoadmapTopic structure for compatibility)
        def flatten_and_save_topics(items, parent_plan):
            """Recursively flatten and save all topics and subtopics"""
            for item in items:
                topic = item.get("topic", "Unknown Topic")
                hours = item.get("estimated_time_hours", 0)
                
                RoadmapTopic.objects.create(
                    study_plan=parent_plan,
                    title=topic,
                    description=f"Estimated time: {hours} hours"
                )
                
                # Recursively save subtopics
                if "subtopics" in item and isinstance(item["subtopics"], list):
                    flatten_and_save_topics(item["subtopics"], parent_plan)
        
        flatten_and_save_topics(roadmap_data, plan)
        
        # ALSO save complete nested structure to UserRoadmap for frontend compatibility
        user_roadmap_data = {
            'title': f"Study Plan: {topic_name}",
            'description': f"Generated study plan for {topic_name} ({available_time} hours)",
            'subject': topic_name,
            'proficiency': 'Intermediate',  # Default
            'weekly_hours': max(1, int(available_time) // 4) if available_time else 10,
            'roadmap_data': {"roadmap": roadmap_data},  # Store complete nested structure
            'user': default_user
        }
        
        user_roadmap_serializer = UserRoadmapSerializer(data=user_roadmap_data)
        if user_roadmap_serializer.is_valid():
            user_roadmap = user_roadmap_serializer.save()
            print(f"✅ Created UserRoadmap ID: {user_roadmap.id} with nested data")
        else:
            print(f"❌ UserRoadmap creation failed: {user_roadmap_serializer.errors}")

        # Prepare response with complete nested structure
        response_data = {
            "main_topic": topic_name,
            "roadmap": roadmap_data,  # Full nested structure for frontend
            "roadmap_data": {"roadmap": roadmap_data}  # Alternative key for compatibility
        }

        return Response({
            "plan": serializer.data,
            "roadmap": response_data
        }, status=status.HTTP_201_CREATED)
    else:
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
            "max_tokens": 3000  # Increased for multi-topic responses
        }

        # Call GROQ API
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        data = res.json()

        if "choices" not in data or not data["choices"]:
            return Response({"error": "Invalid API response", "details": data}, status=500)

        raw_output = data["choices"][0]["message"]["content"]
        
        # Remove markdown code blocks if present
        if raw_output.strip().startswith("```json"):
            raw_output = raw_output.strip()[7:]  # Remove ```json
        if raw_output.strip().endswith("```"):
            raw_output = raw_output.strip()[:-3]  # Remove ```
        raw_output = raw_output.strip()

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


@api_view(['DELETE'])
def delete_user_roadmap(request, roadmap_id):
    """Delete a user roadmap by ID"""
    try:
        roadmap = UserRoadmap.objects.get(id=roadmap_id)
        roadmap.delete()
        return Response({"message": "Roadmap deleted successfully"}, status=204)
    except UserRoadmap.DoesNotExist:
        return Response({"error": "Roadmap not found"}, status=404)