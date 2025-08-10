// Test script to check localStorage data integrity
import { getStudyPlansFromStorage } from '../utils/studyPlanUtils';

const testStorageData = () => {
  console.log('=== TESTING STUDY PLAN STORAGE DATA ===');
  
  // Get raw data from localStorage
  const rawData = localStorage.getItem('studyPlans');
  console.log('1. Raw localStorage data (string):', rawData);
  
  // Parse the raw data
  let parsedData;
  try {
    parsedData = rawData ? JSON.parse(rawData) : [];
    console.log('2. Parsed localStorage data (object):', parsedData);
  } catch (error) {
    console.error('Error parsing raw data:', error);
    return;
  }
  
  // Use the utility function
  const utilityData = getStudyPlansFromStorage();
  console.log('3. Data from getStudyPlansFromStorage():', utilityData);
  
  // Compare structures
  console.log('4. Are they the same?', JSON.stringify(parsedData) === JSON.stringify(utilityData));
  
  // Analyze the first study plan if it exists
  if (utilityData && utilityData.length > 0) {
    const firstPlan = utilityData[0];
    console.log('5. First study plan structure:', firstPlan);
    
    if (firstPlan.roadmaps) {
      console.log('6. First plan roadmaps array:', firstPlan.roadmaps);
      console.log('7. Number of roadmap items:', firstPlan.roadmaps.length);
      
      // Check each roadmap item
      firstPlan.roadmaps.forEach((item, index) => {
        console.log(`8.${index + 1}. Roadmap item ${index + 1}:`, {
          id: item.id,
          topic: item.topic,
          hasSubtopics: !!item.subtopics,
          subtopicsCount: item.subtopics ? item.subtopics.length : 0,
          subtopics: item.subtopics
        });
        
        // Check nested subtopics
        if (item.subtopics && item.subtopics.length > 0) {
          item.subtopics.forEach((subitem, subindex) => {
            console.log(`  8.${index + 1}.${subindex + 1}. Subtopic:`, {
              id: subitem.id,
              topic: subitem.topic,
              hasSubtopics: !!subitem.subtopics,
              subtopicsCount: subitem.subtopics ? subitem.subtopics.length : 0
            });
            
            // Check deeper nesting
            if (subitem.subtopics && subitem.subtopics.length > 0) {
              subitem.subtopics.forEach((deepitem, deepindex) => {
                console.log(`    8.${index + 1}.${subindex + 1}.${deepindex + 1}. Deep subtopic:`, {
                  id: deepitem.id,
                  topic: deepitem.topic
                });
              });
            }
          });
        }
      });
    }
  }
  
  console.log('=== END TEST ===');
};

export default testStorageData;
