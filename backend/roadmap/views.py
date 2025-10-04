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
def get_fallback_roadmap(topics, purpose="General"):
    """Generate a purpose-aware fallback roadmap with proper subtopics"""
    if isinstance(topics, str):
        topics = [topics]
    
    main_topic = topics[0] if topics else "Learning Topic"
    
    # Generate purpose-specific fallback roadmaps
    roadmap_items = []
    
    if "academic" in purpose.lower() or "exam" in purpose.lower():
        # Maximum depth for academic purposes
        base_topics = [
            {
                "name": f"Foundation Theory in {main_topic}",
                "subtopics": ["Core Definitions and Terminology", "Mathematical Foundations", "Theoretical Framework", "Historical Development", "Key Principles", "Literature Review", "Research Methodology"]
            },
            {
                "name": f"Analytical Methods in {main_topic}",
                "subtopics": ["Problem Solving Techniques", "Derivations and Proofs", "Mathematical Analysis", "Case Studies", "Research Methods", "Data Analysis", "Statistical Methods"]
            },
            {
                "name": f"Advanced Theoretical Concepts in {main_topic}",
                "subtopics": ["Complex Applications", "Advanced Theory", "Mathematical Models", "Current Research", "Interdisciplinary Connections", "Computational Methods"]
            },
            {
                "name": f"Research and Analysis in {main_topic}",
                "subtopics": ["Independent Research", "Thesis Preparation", "Academic Writing", "Peer Review Process", "Conference Presentations", "Publication Methods"]
            },
            {
                "name": f"Specialized Applications in {main_topic}",
                "subtopics": ["Industry Applications", "Cross-disciplinary Studies", "Innovation and Development", "Future Research Directions", "Ethical Considerations"]
            },
            {
                "name": f"Assessment and Evaluation in {main_topic}",
                "subtopics": ["Practice Problems", "Mock Examinations", "Revision Strategies", "Performance Analysis", "Self-Assessment", "Peer Evaluation"]
            }
        ]
    elif "job" in purpose.lower() or "career" in purpose.lower() or "interview" in purpose.lower():
        # High depth for job preparation
        base_topics = [
            {
                "name": f"Industry Fundamentals of {main_topic}",
                "subtopics": ["Market Overview", "Industry Standards", "Key Players", "Current Trends", "Salary Expectations", "Growth Opportunities"]
            },
            {
                "name": f"Core Technical Skills in {main_topic}",
                "subtopics": ["Essential Technologies", "Tool Proficiency", "Best Practices", "Code Quality", "Testing Methods", "Documentation"]
            },
            {
                "name": f"Practical Application and Projects in {main_topic}",
                "subtopics": ["Real-world Projects", "Portfolio Development", "GitHub Contributions", "Open Source Participation", "Problem Solving"]
            },
            {
                "name": f"Interview Preparation for {main_topic}",
                "subtopics": ["Technical Questions", "Coding Challenges", "System Design", "Behavioral Questions", "Mock Interviews", "Resume Optimization"]
            },
            {
                "name": f"Professional Skills in {main_topic}",
                "subtopics": ["Project Management", "Team Collaboration", "Client Communication", "Agile Methodologies", "Leadership Skills"]
            },
            {
                "name": f"Career Development in {main_topic}",
                "subtopics": ["Networking Strategies", "Personal Branding", "Continuous Learning", "Industry Certifications", "Mentorship", "Career Planning"]
            }
        ]
    elif "skill" in purpose.lower():
        # Medium-high depth for skill development
        base_topics = [
            {
                "name": f"Getting Started with {main_topic}",
                "subtopics": ["Environment Setup", "Essential Tools", "First Steps", "Quick Wins", "Basic Concepts"]
            },
            {
                "name": f"Building Core Skills in {main_topic}",
                "subtopics": ["Practice Exercises", "Mini Projects", "Skill Building", "Common Challenges", "Problem Solving"]
            },
            {
                "name": f"Intermediate Applications of {main_topic}",
                "subtopics": ["Real-world Scenarios", "Integration Techniques", "Performance Optimization", "Best Practices", "Troubleshooting"]
            },
            {
                "name": f"Advanced Mastery of {main_topic}",
                "subtopics": ["Advanced Techniques", "Complex Projects", "Innovation", "Creative Applications", "Expert Tips"]
            },
            {
                "name": f"Professional Application of {main_topic}",
                "subtopics": ["Portfolio Building", "Community Engagement", "Teaching Others", "Continuous Improvement", "Industry Standards"]
            }
        ]
    elif "personal" in purpose.lower():
        # Medium depth for personal learning
        base_topics = [
            {
                "name": f"Introduction to {main_topic}",
                "subtopics": ["What is it?", "Why Learn It?", "Getting Started", "Fun Facts"]
            },
            {
                "name": f"Exploring {main_topic}",
                "subtopics": ["Key Concepts", "Interesting Applications", "Creative Projects", "Personal Relevance"]
            },
            {
                "name": f"Practicing {main_topic}",
                "subtopics": ["Hands-on Exercises", "Fun Challenges", "Personal Projects", "Experimentation"]
            },
            {
                "name": f"Mastering {main_topic}",
                "subtopics": ["Advanced Concepts", "Creative Applications", "Sharing Knowledge", "Continued Learning"]
            }
        ]
    else:
        # Default general purpose
        base_topics = [
            {
                "name": f"Introduction to {main_topic}",
                "subtopics": ["Overview", "Key Concepts", "Getting Started", "Basic Terminology"]
            },
            {
                "name": f"Core Concepts of {main_topic}",
                "subtopics": ["Fundamental Principles", "Important Methods", "Common Applications", "Best Practices"]
            },
            {
                "name": f"Advanced {main_topic}",
                "subtopics": ["Complex Topics", "Advanced Techniques", "Specialized Areas", "Expert Insights"]
            },
            {
                "name": f"Mastery of {main_topic}",
                "subtopics": ["Integration", "Optimization", "Innovation", "Teaching Others"]
            }
        ]
    
    # Determine time allocation based on purpose depth
    if "academic" in purpose.lower():
        main_topic_hours = 8.0
        subtopic_hours = 2.5
    elif "job" in purpose.lower() or "career" in purpose.lower() or "competitive" in purpose.lower():
        main_topic_hours = 6.0
        subtopic_hours = 2.0
    elif "skill" in purpose.lower():
        main_topic_hours = 5.0
        subtopic_hours = 1.5
    else:  # personal or general
        main_topic_hours = 4.0
        subtopic_hours = 1.0
    
    for i, topic_info in enumerate(base_topics, 1):
        subtopic_list = []
        for j, subtopic_name in enumerate(topic_info["subtopics"], 1):
            subtopic_list.append({
                "id": f"{i}.{j}",
                "topic": subtopic_name,
                "estimated_time_hours": subtopic_hours,
                "prerequisites": [str(i)]
            })
        
        roadmap_items.append({
            "id": str(i),
            "topic": topic_info["name"],
            "estimated_time_hours": main_topic_hours,
            "prerequisites": [] if i == 1 else [str(i-1)],
            "subtopics": subtopic_list
        })
    
    return {
        "main_topics": topics,
        "roadmap": roadmap_items
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

def generate_roadmap_with_groq(topics, total_hours=None, purpose="General"):
    import json, re, requests

    if isinstance(topics, str):
        topics = [topics]

    topic_str = ", ".join(topics)

    prompt = f"""
You are an expert study planning assistant. Create a UNIQUE, PURPOSE-DRIVEN learning roadmap.

TOPIC: {topic_str}
PURPOSE: {purpose}

🎯 CRITICAL: The roadmap MUST be completely different based on the purpose. Same topic, different purpose = completely different roadmap structure, content, and approach.

🔢 DEPTH REQUIREMENTS BASED ON PURPOSE:

📚 ACADEMICS ({purpose}):  
- **DEPTH**: MAXIMUM (8-12 main topics, 4-8 subtopics each)
- Structure: Semester/Course style with Units, Chapters, Modules, Sub-modules
- Content: Theory-heavy with mathematical derivations, proofs, definitions, formulas
- Subtopics: Literature reviews, research papers, assignments, lab experiments, case studies, theoretical analysis
- Assessment: Quizzes, midterms, finals, thesis preparation, research projects
- Detail Level: Include specific theorems, equations, experimental procedures, citation requirements
- Time Allocation: Longer durations for deep theoretical understanding

🏆 COMPETITIVE EXAM ({purpose}):
- **DEPTH**: HIGH (6-10 main topics, 3-6 subtopics each)  
- Structure: Strategy-based with high-weightage topics first, revision cycles
- Content: Formula-focused, shortcut techniques, pattern recognition, exam tricks
- Subtopics: Previous year analysis, mock tests, time management, speed techniques, formula sheets, error analysis
- Assessment: Practice sets, timed tests, accuracy improvement, weak area identification
- Detail Level: Include specific formulas, shortcut methods, common pitfalls, exam patterns
- Time Allocation: Intensive practice-focused with quick revision cycles

💼 JOB PREPARATION ({purpose}):
- **DEPTH**: HIGH (6-9 main topics, 4-7 subtopics each)
- Structure: Industry-focused with real-world applications, portfolio building
- Content: Interview questions, system design, portfolio projects, industry standards
- Subtopics: Resume building, coding challenges, behavioral interviews, industry trends, salary negotiation, networking
- Assessment: Mock interviews, technical challenges, project demonstrations, portfolio reviews
- Detail Level: Include specific interview questions, coding problems, system design examples, portfolio requirements
- Time Allocation: Balanced between learning and practical application

🛠️ SKILL DEVELOPMENT ({purpose}):
- **DEPTH**: MEDIUM-HIGH (5-8 main topics, 3-5 subtopics each)
- Structure: Project-based learning with hands-on experience, progressive complexity
- Content: Tools, frameworks, practical implementations, best practices
- Subtopics: Tutorials, mini-projects, real-world applications, troubleshooting, advanced techniques
- Assessment: Project completion, skill demonstrations, portfolio building, peer reviews
- Detail Level: Include specific tools, step-by-step guides, common issues, advanced tips
- Time Allocation: Heavy emphasis on hands-on practice and project work

🎓 PERSONAL LEARNING ({purpose}):
- **DEPTH**: MEDIUM (4-7 main topics, 2-4 subtopics each)
- Structure: Self-paced with flexible milestones, interest-driven exploration
- Content: Conceptual understanding with practical applications, fun elements
- Subtopics: Exploration topics, fun projects, personal interests, experimentation, creative applications
- Assessment: Self-reflection, personal projects, knowledge application, sharing with others
- Detail Level: Include interesting facts, creative projects, optional deep-dives, fun challenges
- Time Allocation: Flexible pacing with emphasis on enjoyment and retention

📖 BASIC/OVERVIEW ({purpose}):
- **DEPTH**: LOW-MEDIUM (3-5 main topics, 2-3 subtopics each)
- Structure: Simple progression from basics to intermediate
- Content: Core concepts, essential knowledge, practical basics
- Subtopics: Fundamentals, key concepts, basic applications, getting started guides
- Assessment: Basic exercises, simple projects, knowledge checks
- Detail Level: Focus on essentials, avoid overwhelming detail
- Time Allocation: Quick learning with immediate application

--- ADVANCED GENERATION RULES ---
1. **DEPTH SCALING**: Follow the depth requirements above - Academic needs maximum detail, Personal needs medium depth
2. **NO GENERIC TOPICS**: Every topic must be specific to the subject and purpose
3. **LOGICAL FLOW**: Each topic must naturally lead to the next with clear prerequisites
4. **PURPOSE ALIGNMENT**: Every subtopic must serve the specific purpose
5. **VARIED COMPLEXITY**: Mix foundational, intermediate, and advanced concepts based on purpose depth
6. **REALISTIC TIMING**: Estimate hours based on complexity and purpose requirements
7. **UNIQUE STRUCTURE**: Different purposes should have completely different roadmap structures
8. **DETAIL GRANULARITY**: 
   - Academic: Include specific theories, formulas, research methods, detailed analysis
   - Job/Competitive: Include specific questions, problems, real examples, practical scenarios
   - Skill Development: Include specific tools, step-by-step processes, troubleshooting guides
   - Personal: Include interesting applications, creative projects, optional extensions

--- TOPIC-SPECIFIC INTELLIGENCE ---
Analyze "{topic_str}" and create purpose-specific content:
- For technical topics: Include relevant tools, frameworks, languages
- For academic subjects: Include theoretical foundations, research areas
- For skills: Include practical applications, industry standards
- For exams: Include syllabus-specific content, exam patterns

Output ONLY valid JSON without any markdown, explanations, or extra text:

{{
  "main_topics": {topics},
  "roadmap": [
    {{
      "id": "1",
      "topic": "Specific Topic Name (not generic)",
      "estimated_time_hours": 4,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "Specific Subtopic (purpose-aligned)",
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
        "temperature": 0.7,  # Increased for more creativity and variation
        "max_tokens": 8000,  # Significantly increased for more detailed output
        "top_p": 0.9  # Added for more diverse outputs
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
        print("✅ Successfully generated roadmap using GROQ API")
    except json.JSONDecodeError:
        print("⚠️ Warning: JSON was incomplete — retrying once...")
        try:
            roadmap_data = request_and_parse()
            print("✅ Successfully generated roadmap using GROQ API (retry)")
        except Exception as retry_error:
            print(f"❌ GROQ API failed on retry: {retry_error}")
            print("🔄 Falling back to template roadmap...")
            return get_fallback_roadmap(topics, purpose)
    except Exception as e:
        print(f"❌ GROQ API failed: {e}")
        print("🔄 Falling back to template roadmap...")
        return get_fallback_roadmap(topics, purpose)

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
                purpose = body.get("purpose", "General")
                roadmap_data = get_fallback_roadmap(topics, purpose)

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
        purpose_of_study = serializer.data.get("purpose_of_study", "General")

        roadmap_data = []

        # Try to generate roadmap via GROQ API directly
        try:
            print(f"Attempting to generate roadmap for topic(s): {topic_name} with purpose: {purpose_of_study}")

            # Call Groq API directly instead of internal request
            roadmap_data = generate_roadmap_with_groq(
                topics=[topic_name],
                total_hours=available_time,
                purpose=purpose_of_study
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