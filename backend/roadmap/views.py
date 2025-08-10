
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

        print(f"🔧 Raw GROQ output: {raw_output[:300]}...")

        try:
            # First try to parse as valid JSON
            roadmap_data = json.loads(raw_output)
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parse failed, trying to fix GROQ formatting issues...")
            
            try:
                # Try to fix common GROQ API formatting issues
                import re
                
                # Fix mixed quotes and trailing commas
                fixed_output = raw_output
                
                # Replace Python-style single quotes with JSON double quotes
                # Handle array elements with single quotes
                fixed_output = re.sub(r"'([^']+)'", r'"\1"', fixed_output)
                
                # Fix any trailing commas before closing brackets/braces
                fixed_output = re.sub(r',(\s*[}\]])', r'\1', fixed_output)
                
                # Try parsing the fixed version
                roadmap_data = json.loads(fixed_output)
                print(f"✅ Successfully parsed after fixing formatting")
                
            except (json.JSONDecodeError, Exception) as e2:
                print(f"❌ All JSON parsing attempts failed")
                print(f"❌ Original error: {e}")
                print(f"❌ Fixed attempt error: {e2}")
                return Response({
                    "error": "Failed to parse JSON after multiple attempts", 
                    "raw_output": raw_output[:1000],  # Limit size for response
                    "original_error": str(e),
                    "fixed_error": str(e2)
                }, status=500)

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
    print("Received data:", request.data)
    serializer = StudyPlanSerializer(data=request.data)
    if serializer.is_valid():
        default_user = get_default_user()
        plan = serializer.save(user=default_user)

        topic_name = serializer.data.get("main_topic")
        available_time = serializer.data.get("available_time")

        # Try to generate roadmap via GROQ API
        try:
            factory = RequestFactory()
            roadmap_request = factory.get(
                '/roadmap/generate_roadmap/',
                {'topics': topic_name, 'time': available_time}
            )
            roadmap_request.user = default_user
            roadmap_response = generate_roadmap(roadmap_request)
            
            print(f"📊 GROQ API Response Status: {roadmap_response.status_code}")
            print(f"📊 GROQ API Response Data Keys: {list(roadmap_response.data.keys()) if hasattr(roadmap_response, 'data') else 'No data attr'}")
            
            if roadmap_response.status_code == 200:
                roadmap_data = roadmap_response.data.get("roadmap", [])
                print(f"📊 Extracted roadmap data: {len(roadmap_data)} items")
                print(f"📊 First item structure: {roadmap_data[0] if roadmap_data else 'No items'}")
            else:
                print(f"❌ API failed with status {roadmap_response.status_code}, using fallback roadmap")
                roadmap_data = []
                
        except Exception as e:
            print(f"❌ Error generating roadmap: {e}")
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

        # Save complete roadmap structure to UserRoadmap model (includes nested subtopics)
        user_roadmap = UserRoadmap.objects.create(
            user=default_user,
            title=f"{topic_name} - Study Plan",
            subject=topic_name,
            roadmap_data={'roadmap': roadmap_data}  # Store complete nested structure
        )
        
        # Also save main topics to RoadmapTopic for compatibility (flatten for basic progress tracking)
        def flatten_roadmap_for_db(items, plan_ref):
            """Flatten roadmap to save all items (main + subtopics) to RoadmapTopic"""
            for item in items:
                topic = item.get("topic", "Unknown Topic")
                hours = item.get("estimated_time_hours", 0)
                item_id = item.get("id", "")
                
                RoadmapTopic.objects.create(
                    study_plan=plan_ref,
                    title=topic,
                    description=f"Estimated time: {hours} hours (ID: {item_id})"
                )
                
                # Recursively save subtopics
                if 'subtopics' in item and item['subtopics']:
                    flatten_roadmap_for_db(item['subtopics'], plan_ref)
        
        flatten_roadmap_for_db(roadmap_data, plan)
        
        print(f"✅ Saved complete roadmap: {len(roadmap_data)} main topics with nested subtopics")
        print(f"✅ UserRoadmap ID: {user_roadmap.id}")

        # Prepare response
        response_data = {
            "main_topic": topic_name,
            "roadmap": roadmap_data,
            "user_roadmap_id": user_roadmap.id
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
                print(f"✅ Enhanced plan '{plan.main_topic}' with complete roadmap data ({len(plan_data['roadmaps'])} items)")
            else:
                # Fallback to basic roadmap from RoadmapTopic (main topics only)
                print(f"⚠️ Using fallback roadmap for '{plan.main_topic}' (no UserRoadmap found)")
                
        except Exception as e:
            print(f"❌ Error enhancing plan '{plan.main_topic}': {e}")
            
        enhanced_plans.append(plan_data)
    
    print(f"📊 Returning {len(enhanced_plans)} enhanced study plans")
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