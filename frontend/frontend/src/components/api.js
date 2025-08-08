export const generateRoadmap = async (topic, time, userId = 1) => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/roadmap/generate_roadmap/?topic=${encodeURIComponent(topic)}&time=${time}&user_id=${userId}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return { error: "Failed to fetch roadmap" };
  }
};
