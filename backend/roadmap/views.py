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
    
    if purpose in ['academics', 'research', 'teaching_preparation']:
        # Maximum depth for academic purposes
        base_topics = [
            {
                "name": f"Theoretical Foundations of {main_topic}",
                "subtopics": ["Literature Review Techniques", "Mathematical Foundations", "Theoretical Framework", "Historical Development", "Research Methodology", "Academic Writing", "Citation Methods"]
            },
            {
                "name": f"Research Methodologies in {main_topic}",
                "subtopics": ["Experimental Design", "Data Collection Methods", "Statistical Analysis", "Hypothesis Testing", "Research Ethics", "Peer Review Process", "Publication Standards"]
            },
            {
                "name": f"Advanced Theoretical Analysis in {main_topic}",
                "subtopics": ["Complex Theory Applications", "Mathematical Modeling", "Computational Methods", "Interdisciplinary Connections", "Current Research Trends", "Critical Analysis"]
            },
            {
                "name": f"Academic Assessment and Evaluation in {main_topic}",
                "subtopics": ["Thesis Preparation", "Research Proposal Writing", "Academic Presentations", "Conference Participation", "Scholarly Communication", "Knowledge Synthesis"]
            },
            {
                "name": f"Specialized Research Areas in {main_topic}",
                "subtopics": ["Emerging Research Fields", "Cross-disciplinary Studies", "Innovation Methodologies", "Future Research Directions", "Grant Writing", "Research Collaboration"]
            },
            {
                "name": f"Academic Professional Development in {main_topic}",
                "subtopics": ["Teaching Methodologies", "Curriculum Development", "Student Assessment", "Academic Networking", "Career Planning", "Professional Ethics"]
            }
        ]
    elif purpose in ['competitive_exam']:
        # High depth for competitive exam preparation
        base_topics = [
            {
                "name": f"High-Weightage {main_topic} Topics",
                "subtopics": ["Previous Year Analysis", "Topic-wise Weightage", "Scoring Strategy", "Important Formulas", "Key Concepts", "Memory Techniques", "Quick References"]
            },
            {
                "name": f"Speed Techniques for {main_topic}",
                "subtopics": ["Time-Saving Methods", "Shortcut Formulas", "Pattern Recognition", "Mental Math Tricks", "Elimination Strategies", "Smart Guessing", "Time Management"]
            },
            {
                "name": f"Practice and Mock Tests for {main_topic}",
                "subtopics": ["Sectional Tests", "Full-Length Mocks", "Previous Year Papers", "Speed Building Exercises", "Accuracy Improvement", "Error Analysis", "Performance Tracking"]
            },
            {
                "name": f"Revision Strategy for {main_topic}",
                "subtopics": ["Formula Sheets", "Concept Maps", "Quick Review Notes", "Last-Minute Tips", "Exam Day Strategy", "Stress Management", "Confidence Building"]
            },
            {
                "name": f"Exam-Specific Preparation for {main_topic}",
                "subtopics": ["Exam Pattern Analysis", "Question Type Classification", "Marking Scheme Strategy", "Negative Marking Handling", "Section-wise Planning", "Cut-off Analysis"]
            }
        ]
    elif purpose in ['career_change', 'interview_preparation']:
        # High depth for job preparation
        base_topics = [
            {
                "name": f"{main_topic} Interview Preparation",
                "subtopics": ["Common Interview Questions", "Technical Problem Solving", "Coding Challenges", "System Design Questions", "Behavioral Interviews", "Mock Interview Practice", "Interview Strategy"]
            },
            {
                "name": f"Industry-Standard {main_topic} Skills",
                "subtopics": ["Essential Technologies", "Industry Tools", "Best Practices", "Code Quality Standards", "Testing Methodologies", "Documentation Skills", "Version Control"]
            },
            {
                "name": f"Portfolio Development in {main_topic}",
                "subtopics": ["Project Showcase", "GitHub Profile", "Resume Building", "Cover Letter Writing", "LinkedIn Optimization", "Personal Branding", "Professional Networking"]
            },
            {
                "name": f"Real-world {main_topic} Applications",
                "subtopics": ["Industry Case Studies", "Business Problem Solving", "Client Requirements", "Team Collaboration", "Project Management", "Agile Methodologies", "Professional Communication"]
            },
            {
                "name": f"Career Transition in {main_topic}",
                "subtopics": ["Skills Gap Analysis", "Learning Roadmap", "Networking Strategies", "Salary Negotiation", "Job Search Strategy", "Career Planning", "Continuous Learning"]
            },
            {
                "name": f"Professional Development in {main_topic}",
                "subtopics": ["Industry Certifications", "Conference Participation", "Community Engagement", "Mentorship", "Leadership Skills", "Technical Writing", "Public Speaking"]
            }
        ]
    elif purpose in ['skill_development']:
        # Medium-high depth for skill development
        base_topics = [
            {
                "name": f"Hands-on {main_topic} Fundamentals",
                "subtopics": ["Environment Setup", "Essential Tools", "First Practical Project", "Basic Implementation", "Getting Started Guide", "Common Setup Issues", "Quick Wins"]
            },
            {
                "name": f"Building Core {main_topic} Skills",
                "subtopics": ["Step-by-step Tutorials", "Practice Exercises", "Mini Projects", "Skill Building Challenges", "Common Mistakes", "Troubleshooting Guide", "Best Practices"]
            },
            {
                "name": f"Real-world {main_topic} Applications",
                "subtopics": ["Industry Use Cases", "Practical Scenarios", "Integration Techniques", "Performance Optimization", "Advanced Troubleshooting", "Production Deployment", "Monitoring"]
            },
            {
                "name": f"Advanced {main_topic} Techniques",
                "subtopics": ["Expert-level Skills", "Complex Projects", "Innovation Approaches", "Creative Solutions", "Advanced Tools", "Optimization Strategies", "Professional Tips"]
            },
            {
                "name": f"Professional {main_topic} Portfolio",
                "subtopics": ["Portfolio Projects", "Code Quality", "Documentation", "Testing", "Community Contribution", "Open Source Projects", "Skill Demonstration"]
            }
        ]
    elif purpose in ['personal_interest']:
        # Medium depth for personal learning
        base_topics = [
            {
                "name": f"Discovering {main_topic}",
                "subtopics": ["What makes it fascinating?", "Fun Facts and Trivia", "Getting Started Journey", "Personal Motivation", "Interesting History", "Why People Love It"]
            },
            {
                "name": f"Exploring {main_topic} Creatively",
                "subtopics": ["Creative Applications", "Fun Projects", "Personal Experiments", "Hobby Applications", "Artistic Uses", "Personal Customization", "Unique Approaches"]
            },
            {
                "name": f"Building with {main_topic}",
                "subtopics": ["Personal Projects", "Hobby Applications", "Creative Challenges", "Experimentation", "Learning by Playing", "Trial and Error", "Fun Exercises"]
            },
            {
                "name": f"Mastering {main_topic} for Joy",
                "subtopics": ["Advanced Fun Techniques", "Creative Mastery", "Sharing Your Passion", "Teaching Friends", "Community Participation", "Personal Achievements", "Lifelong Learning"]
            }
        ]
    elif purpose in ['professional_certification']:
        # High depth for certification preparation
        base_topics = [
            {
                "name": f"{main_topic} Certification Overview",
                "subtopics": ["Certification Requirements", "Exam Format", "Study Timeline", "Prerequisites", "Cost Analysis", "Career Benefits", "Preparation Strategy"]
            },
            {
                "name": f"Core {main_topic} Certification Topics",
                "subtopics": ["Official Syllabus", "Key Concepts", "Required Knowledge", "Practical Skills", "Theory Foundation", "Hands-on Labs", "Study Materials"]
            },
            {
                "name": f"{main_topic} Certification Practice",
                "subtopics": ["Practice Exams", "Mock Tests", "Sample Questions", "Time Management", "Exam Techniques", "Study Groups", "Review Sessions"]
            },
            {
                "name": f"{main_topic} Certification Readiness",
                "subtopics": ["Final Review", "Weak Area Focus", "Exam Day Preparation", "Stress Management", "Last-minute Tips", "Result Analysis", "Retake Strategy"]
            }
        ]
    else:
        # Default general purpose (includes 'other' and unknown purposes)
        base_topics = [
            {
                "name": f"Comprehensive Introduction to {main_topic}",
                "subtopics": ["Overview and Context", "Key Concepts", "Getting Started", "Basic Terminology", "Why It Matters", "Common Applications"]
            },
            {
                "name": f"Core Principles of {main_topic}",
                "subtopics": ["Fundamental Principles", "Important Methods", "Essential Skills", "Best Practices", "Common Patterns", "Problem-Solving Approaches"]
            },
            {
                "name": f"Practical Applications of {main_topic}",
                "subtopics": ["Real-world Examples", "Use Cases", "Implementation", "Tools and Resources", "Hands-on Practice", "Project Ideas"]
            },
            {
                "name": f"Advanced Understanding of {main_topic}",
                "subtopics": ["Complex Topics", "Advanced Techniques", "Specialized Areas", "Expert Insights", "Integration Skills", "Continuous Learning"]
            }
        ]
    
    # Determine time allocation based on purpose depth
    if purpose in ['academics', 'research', 'teaching_preparation']:
        main_topic_hours = 8.0
        subtopic_hours = 2.5
    elif purpose in ['competitive_exam', 'career_change', 'interview_preparation', 'professional_certification']:
        main_topic_hours = 6.0
        subtopic_hours = 2.0
    elif purpose in ['skill_development']:
        main_topic_hours = 5.0
        subtopic_hours = 1.5
    else:  # personal_interest, other, or unknown
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

    # Check if API key is configured
    if not GROQ_API_KEY:
        print("❌ GROQ API key not configured. Using fallback roadmap.")
        return get_fallback_roadmap(topics, purpose)
    
    if len(GROQ_API_KEY) < 10:  # Basic validation
        print("❌ GROQ API key appears invalid. Using fallback roadmap.")
        return get_fallback_roadmap(topics, purpose)

    if isinstance(topics, str):
        topics = [topics]

    topic_str = ", ".join(topics)
    
    print(f"🎯 Generating AI roadmap for: {topic_str} (Purpose: {purpose})")

    # Map purpose values to detailed specifications
    purpose_configs = {
        'academics': {
            'name': 'ACADEMICS',
            'depth': 'MAXIMUM (8-12 main topics, 4-8 subtopics each)',
            'structure': 'Semester/Course style with Units, Chapters, Modules, Sub-modules',
            'content_focus': 'Theory-heavy with mathematical derivations, proofs, definitions, formulas, research methodology',
            'specific_elements': 'Literature reviews, research papers, assignments, lab experiments, case studies, theoretical analysis, citations',
            'assessment': 'Quizzes, midterms, finals, thesis preparation, research projects, peer reviews',
            'time_style': 'Longer durations for deep theoretical understanding and research',
            'unique_approach': 'Academic rigor with emphasis on understanding WHY things work, not just HOW'
        },
        'competitive_exam': {
            'name': 'COMPETITIVE EXAM',
            'depth': 'HIGH (6-10 main topics, 3-6 subtopics each)',
            'structure': 'Strategy-based with high-weightage topics first, multiple revision cycles, timed practice',
            'content_focus': 'Formula-focused, shortcut techniques, pattern recognition, exam tricks, speed optimization',
            'specific_elements': 'Previous year analysis, mock tests, time management, speed techniques, formula sheets, error analysis, weak areas',
            'assessment': 'Practice sets, timed tests, accuracy improvement, rank analysis, performance tracking',
            'time_style': 'Intensive practice-focused with quick revision cycles and exam simulation',
            'unique_approach': 'Winning strategy focused on maximum marks in minimum time with consistent accuracy'
        },
        'skill_development': {
            'name': 'SKILL DEVELOPMENT',
            'depth': 'MEDIUM-HIGH (5-8 main topics, 3-5 subtopics each)',
            'structure': 'Project-based learning with hands-on experience, progressive complexity, real-world applications',
            'content_focus': 'Tools, frameworks, practical implementations, best practices, industry standards',
            'specific_elements': 'Tutorials, mini-projects, real-world applications, troubleshooting, advanced techniques, portfolio pieces',
            'assessment': 'Project completion, skill demonstrations, portfolio building, peer code reviews',
            'time_style': 'Heavy emphasis on hands-on practice and project work with iterative improvement',
            'unique_approach': 'Learning by doing with immediate practical application and tangible outcomes'
        },
        'career_change': {
            'name': 'CAREER TRANSITION',
            'depth': 'HIGH (6-9 main topics, 4-7 subtopics each)',
            'structure': 'Industry-focused with real-world applications, portfolio building, networking preparation',
            'content_focus': 'Interview questions, system design, portfolio projects, industry trends, transition strategies',
            'specific_elements': 'Resume building, coding challenges, behavioral interviews, salary negotiation, networking, job search',
            'assessment': 'Mock interviews, technical challenges, project demonstrations, portfolio reviews, industry readiness',
            'time_style': 'Balanced between learning and practical application with job-market focus',
            'unique_approach': 'Career-oriented learning with emphasis on employability and industry expectations'
        },
        'personal_interest': {
            'name': 'PERSONAL EXPLORATION',
            'depth': 'MEDIUM (4-7 main topics, 2-4 subtopics each)',
            'structure': 'Self-paced with flexible milestones, interest-driven exploration, fun discoveries',
            'content_focus': 'Conceptual understanding with practical applications, creative elements, enjoyable learning',
            'specific_elements': 'Exploration topics, fun projects, personal interests, experimentation, creative applications, hobby projects',
            'assessment': 'Self-reflection, personal projects, knowledge application, sharing with others, creative outputs',
            'time_style': 'Flexible pacing with emphasis on enjoyment, retention, and personal satisfaction',
            'unique_approach': 'Joy-driven learning focused on curiosity, exploration, and personal fulfillment'
        },
        'professional_certification': {
            'name': 'PROFESSIONAL CERTIFICATION',
            'depth': 'HIGH (6-9 main topics, 4-6 subtopics each)',
            'structure': 'Certification-aligned with official exam objectives, structured modules, practice tests',
            'content_focus': 'Certification requirements, official syllabus, exam patterns, industry standards',
            'specific_elements': 'Certification objectives, practice exams, study guides, official resources, exam tips',
            'assessment': 'Practice tests, mock exams, certification readiness, knowledge validation',
            'time_style': 'Structured preparation with milestone checkpoints and certification timeline',
            'unique_approach': 'Certification-focused learning aligned with official requirements and exam success'
        },
        'interview_preparation': {
            'name': 'INTERVIEW PREPARATION',
            'depth': 'HIGH (5-8 main topics, 3-5 subtopics each)',
            'structure': 'Interview-focused with technical and behavioral preparation, practice sessions',
            'content_focus': 'Common interview questions, technical concepts, problem-solving, communication skills',
            'specific_elements': 'Technical interviews, behavioral questions, coding challenges, system design, salary negotiation',
            'assessment': 'Mock interviews, coding practice, presentation skills, confidence building',
            'time_style': 'Intensive preparation with interview simulation and feedback loops',
            'unique_approach': 'Interview success focused on both technical competence and communication excellence'
        },
        'teaching_preparation': {
            'name': 'TEACHING PREPARATION',
            'depth': 'MAXIMUM (8-11 main topics, 5-7 subtopics each)',
            'structure': 'Pedagogical approach with teaching methodologies, curriculum design, student engagement',
            'content_focus': 'Deep subject mastery, teaching techniques, curriculum planning, assessment methods',
            'specific_elements': 'Lesson planning, teaching strategies, student assessment, classroom management, educational resources',
            'assessment': 'Teaching demonstrations, curriculum design, student feedback, peer observations',
            'time_style': 'Comprehensive preparation with both content mastery and teaching skill development',
            'unique_approach': 'Educator-focused learning emphasizing both subject expertise and teaching effectiveness'
        },
        'research': {
            'name': 'RESEARCH PREPARATION',
            'depth': 'MAXIMUM (9-12 main topics, 5-8 subtopics each)',
            'structure': 'Research-oriented with methodology, literature review, experimental design, publication prep',
            'content_focus': 'Research methodology, literature analysis, experimental design, data analysis, academic writing',
            'specific_elements': 'Literature review, research design, data collection, statistical analysis, paper writing, peer review',
            'assessment': 'Research proposals, literature reviews, experimental results, paper drafts, peer evaluations',
            'time_style': 'Extensive preparation with deep investigation and scholarly rigor',
            'unique_approach': 'Scholar-focused learning emphasizing original research and academic contribution'
        },
        'other': {
            'name': 'GENERAL EXPLORATION',
            'depth': 'MEDIUM (4-6 main topics, 2-4 subtopics each)',
            'structure': 'Flexible approach with balanced coverage, exploratory learning',
            'content_focus': 'Broad understanding with practical applications, balanced depth',
            'specific_elements': 'Core concepts, practical applications, exploratory topics, diverse perspectives',
            'assessment': 'Knowledge checks, practical exercises, self-assessment, flexible evaluation',
            'time_style': 'Balanced pacing with comprehensive coverage and practical application',
            'unique_approach': 'Well-rounded learning with flexibility to explore various aspects and applications'
        }
    }
    
    # Get the configuration for the current purpose, fallback to 'other' if not found
    config = purpose_configs.get(purpose, purpose_configs['other'])
    
    prompt = f"""
You are an expert study planning assistant. Create a UNIQUE, PURPOSE-DRIVEN learning roadmap that is COMPLETELY DIFFERENT based on the purpose.

TOPIC: {topic_str}
PURPOSE: {config['name']} ({purpose})

🎯 CRITICAL INSTRUCTION: The roadmap MUST be dramatically different for different purposes. Same topic + different purpose = completely different structure, content, approach, and learning path.

📋 PURPOSE-SPECIFIC CONFIGURATION:
- **DEPTH**: {config['depth']}
- **STRUCTURE**: {config['structure']}
- **CONTENT FOCUS**: {config['content_focus']}
- **SPECIFIC ELEMENTS**: {config['specific_elements']}
- **ASSESSMENT**: {config['assessment']}
- **TIME ALLOCATION**: {config['time_style']}
- **UNIQUE APPROACH**: {config['unique_approach']}

🔥 CRITICAL: GENERATE SPECIFIC, DETAILED, ACTIONABLE CONTENT - NO GENERIC TEMPLATES!

For {config['name']} purpose, create CONCRETE topics with REAL substance:

📚 ACADEMIC PURPOSE - Be Specific with Real Content:
WRONG: "Research Methodologies", "Literature Review Techniques"
RIGHT: "TCP/IP Protocol Stack Architecture and Layer Functions", "Network Security Protocols: SSL/TLS Implementation", "OSI Model vs TCP/IP: Detailed Comparison with Real Examples"

🏆 COMPETITIVE EXAM - Focus on Actual Exam Content:
WRONG: "High-Weightage Questions", "Previous Year Analysis"  
RIGHT: "Subnetting Calculations and VLSM Problems", "Routing Protocols: OSPF vs BGP Numerical Problems", "Network Troubleshooting Scenarios with Command-Line Tools"

💼 SKILL DEVELOPMENT - Real Projects and Tools:
WRONG: "Hands-on Projects", "Industry Tools"
RIGHT: "Building a Home Network with Cisco Packet Tracer", "Configuring VLANs and Inter-VLAN Routing", "Network Monitoring with Wireshark and PRTG"

🎯 INTERVIEW PREPARATION - Actual Interview Topics:
WRONG: "Interview Questions", "Technical Problem Solving"
RIGHT: "Explain How DNS Resolution Works Step-by-Step", "Design a Scalable Network Architecture for 1000+ Users", "Troubleshoot Network Latency Issues in Production"

🎨 PERSONAL INTEREST - Fun, Engaging Projects:
WRONG: "Fun Exploration", "Creative Projects"
RIGHT: "Build Your Own Home WiFi Network from Scratch", "Create a Network Monitoring Dashboard", "Set Up a Raspberry Pi as a Network Router"

🚨 MANDATORY REQUIREMENTS:
1. EVERY topic must be SPECIFIC to the subject matter
2. Include REAL tools, technologies, protocols, concepts
3. Use CONCRETE examples, not abstract terms
4. Focus on ACTIONABLE learning outcomes
5. Avoid generic educational jargon
6. Make topics sound GENUINELY useful and interesting

🎯 QUALITY EXAMPLES FOR INSPIRATION (ADAPT TO YOUR TOPIC):

For "Computer Networking" + Academic Purpose:
✅ GOOD: "OSI vs TCP/IP Model: Layer-by-Layer Analysis with Real Protocols"
✅ GOOD: "IPv4 vs IPv6: Address Structure, Subnetting, and Migration Strategies"
✅ GOOD: "Ethernet Standards: From 10Base-T to 10 Gigabit Fiber Implementation"

For "Python Programming" + Skill Development:
✅ GOOD: "Building REST APIs with Flask and Database Integration"
✅ GOOD: "Web Scraping Projects: BeautifulSoup, Scrapy, and Selenium Automation"
✅ GOOD: "Data Analysis Pipeline: Pandas, NumPy, and Matplotlib Visualization"

For Any Topic + Interview Preparation:
✅ GOOD: "System Design Questions: Scalability, Load Balancing, and Database Choices"
✅ GOOD: "Coding Challenges: Algorithm Optimization and Time Complexity Analysis"
✅ GOOD: "Behavioral Questions: STAR Method for Technical Leadership Stories"

🚨 CRITICAL OUTPUT INSTRUCTIONS:
1. RESPOND WITH ONLY VALID JSON - NO EXPLANATIONS, NO MARKDOWN, NO TEXT BEFORE OR AFTER
2. ENSURE ALL JSON BRACKETS AND BRACES ARE PROPERLY CLOSED
3. USE DOUBLE QUOTES FOR ALL STRINGS
4. INCLUDE EXACTLY 6-9 MAIN TOPICS FOR COMPREHENSIVE COVERAGE
5. EACH TOPIC MUST HAVE 4-7 SUBTOPICS WITH SPECIFIC DETAILS
6. ALL TOPIC NAMES MUST BE HIGHLY SPECIFIC AND ACTIONABLE
7. EVERY SUBTOPIC MUST SOUND LIKE SOMETHING A LEARNER WOULD GENUINELY WANT TO LEARN
8. INCLUDE REAL TOOLS, TECHNOLOGIES, FRAMEWORKS, PROTOCOLS IN TOPIC NAMES

Required JSON structure:
{{
  "main_topics": ["{topic_str}"],
  "roadmap": [
    {{
      "id": "1",
      "topic": "Specific, detailed topic with real tools/concepts (not generic)",
      "estimated_time_hours": 4.0,
      "prerequisites": [],
      "subtopics": [
        {{
          "id": "1.1",
          "topic": "Concrete subtopic with specific tools/techniques/examples",
          "estimated_time_hours": 1.0,
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
        "temperature": 0.8,  # Higher temperature for more creative and detailed responses
        "max_tokens": 10000,  # Increased further for more comprehensive output
        "top_p": 0.95,  # Higher top_p for more diverse vocabulary and concepts
        "frequency_penalty": 0.3,  # Reduce repetitive content
        "presence_penalty": 0.2  # Encourage new topics and concepts
    }

    def request_and_parse():
        try:
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30  # Add timeout to prevent hanging
            )
            
            print(f"GROQ API Response Status: {res.status_code}")
            
            if res.status_code != 200:
                print(f"GROQ API Error Response: {res.text}")
                raise ValueError(f"Groq API error {res.status_code}: {res.text}")

            data = res.json()
            if not data.get("choices"):
                raise ValueError("No choices in API response")
                
            raw_output = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not raw_output:
                raise ValueError("Empty content in API response")

            print(f"Raw API output length: {len(raw_output)}")
            print(f"Raw API output preview: {raw_output[:200]}...")

            # Clean the output more thoroughly
            raw_output = raw_output.strip()
            
            # Remove markdown fences
            raw_output = re.sub(r"^```[a-zA-Z]*\n?", "", raw_output)
            raw_output = re.sub(r"\n?```$", "", raw_output)
            
            # Remove any explanation before JSON
            first_brace = raw_output.find("{")
            if first_brace != -1:
                raw_output = raw_output[first_brace:]
            
            # Find the last closing brace to handle incomplete JSON
            last_brace = raw_output.rfind("}")
            if last_brace != -1:
                raw_output = raw_output[:last_brace + 1]

            print(f"Cleaned output length: {len(raw_output)}")
            parsed_data = json.loads(raw_output)
            
            # Validate the structure
            if not isinstance(parsed_data, dict):
                raise ValueError("Response is not a JSON object")
            if "roadmap" not in parsed_data:
                raise ValueError("No 'roadmap' field in response")
            if not isinstance(parsed_data["roadmap"], list):
                raise ValueError("'roadmap' field is not a list")
            if len(parsed_data["roadmap"]) == 0:
                raise ValueError("Empty roadmap in response")
                
            print(f"✅ Successfully parsed JSON with {len(parsed_data['roadmap'])} items")
            return parsed_data
            
        except requests.exceptions.RequestException as e:
            print(f"Network error: {e}")
            raise
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic JSON: {raw_output[:500]}...")
            raise
        except Exception as e:
            print(f"Other error in request_and_parse: {e}")
            raise

    # Enhanced retry logic with multiple attempts
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"🚀 GROQ API Attempt {attempt + 1}/{max_retries} for purpose: {purpose}")
            roadmap_data = request_and_parse()
            print("✅ Successfully generated roadmap using GROQ API")
            break
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parsing failed on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying with modified parameters...")
                # Reduce max_tokens slightly for retry to avoid truncation
                payload["max_tokens"] = max(4000, payload["max_tokens"] - 1000)
                payload["temperature"] = 0.5  # Reduce creativity for more consistent output
                continue
            else:
                print(f"❌ All JSON parsing attempts failed")
                print("🔄 Falling back to template roadmap...")
                return get_fallback_roadmap(topics, purpose)
        except ValueError as e:
            print(f"⚠️ API validation error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying...")
                continue
            else:
                print(f"❌ All API attempts failed")
                print("🔄 Falling back to template roadmap...")
                return get_fallback_roadmap(topics, purpose)
        except Exception as e:
            print(f"❌ GROQ API failed on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying...")
                continue
            else:
                print(f"❌ All attempts failed")
                print("🔄 Falling back to template roadmap...")
                return get_fallback_roadmap(topics, purpose)
    else:
        # This should not be reached, but just in case
        print("❌ Unexpected error: no roadmap_data assigned")
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

        # Check if we need to use fallback
        if not roadmap_data:
            print(f"🔄 FALLBACK TRIGGERED for Topic: '{topic_name}', Purpose: '{purpose_of_study}'")
            print(f"📝 Reason: AI roadmap generation failed, using purpose-specific fallback")
            try:
                fallback_data = get_fallback_roadmap([topic_name], purpose_of_study)
                roadmap_data = fallback_data.get("roadmap", [])
                print(f"✅ Generated {len(roadmap_data)} purpose-specific fallback topics")
                
                # Log the first few topics to verify purpose-specificity
                if roadmap_data:
                    print(f"📋 Sample fallback topics:")
                    for i, item in enumerate(roadmap_data[:3]):
                        print(f"   {i+1}. {item.get('topic', 'No topic')}")
                        
            except Exception as fallback_error:
                print(f"❌ ERROR in purpose-specific fallback generation: {fallback_error}")
                print(f"🚨 Using ULTIMATE GENERIC fallback (not purpose-specific)")
                # Ultimate fallback - basic generic structure
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
        else:
            print(f"✅ AI-Generated roadmap successfully created with {len(roadmap_data)} topics")

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


@api_view(['GET'])
def get_purpose_choices(request):
    """Get available purpose of study choices"""
    choices = [{'value': choice[0], 'label': choice[1]} for choice in StudyPlan.PURPOSE_CHOICES]
    return Response({'choices': choices})


@api_view(['POST'])
def test_groq_api(request):
    """Test GROQ API directly to diagnose issues"""
    topic = request.data.get('topic', 'Python Programming')
    purpose = request.data.get('purpose', 'skill_development')
    
    print(f"🧪 Testing GROQ API for: {topic} (Purpose: {purpose})")
    
    # Check API key
    if not GROQ_API_KEY:
        return Response({
            'status': 'error',
            'message': 'GROQ API key not configured',
            'fallback_used': True
        })
    
    try:
        result = generate_roadmap_with_groq([topic], total_hours=40, purpose=purpose)
        
        if result and "roadmap" in result:
            return Response({
                'status': 'success',
                'message': 'AI generation successful',
                'roadmap_items': len(result["roadmap"]),
                'first_topic': result["roadmap"][0].get("topic") if result["roadmap"] else None,
                'fallback_used': False
            })
        else:
            return Response({
                'status': 'error',
                'message': 'Invalid roadmap structure',
                'fallback_used': True
            })
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'fallback_used': True
        })