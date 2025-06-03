const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1";
const HF_API_URL_ALT = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

const mealTemplates = {
  breakfast: [
    {
      name: "Masala Oats",
      description: "Steel-cut oats cooked with vegetables, spices, and topped with roasted nuts",
      calories: 320,
      protein: 12,
      carbs: 50,
      fat: 10
    },
    {
      name: "Poha with Sprouts",
      description: "Flattened rice cooked with vegetables, peanuts, and mild spices",
      calories: 350,
      protein: 15,
      carbs: 55,
      fat: 12
    },
    {
      name: "Idli with Sambar",
      description: "Steamed rice cakes served with lentil-based vegetable stew",
      calories: 280,
      protein: 18,
      carbs: 45,
      fat: 8
    }
  ],
  lunch: [
    {
      name: "Brown Rice Thali",
      description: "Brown rice with dal, sabzi, roti, and raita",
      calories: 450,
      protein: 25,
      carbs: 65,
      fat: 15
    },
    {
      name: "Quinoa Biryani",
      description: "Quinoa cooked with vegetables and aromatic spices",
      calories: 420,
      protein: 20,
      carbs: 60,
      fat: 12
    },
    {
      name: "Dal Chawal with Sabzi",
      description: "Lentil curry with brown rice and vegetable curry",
      calories: 480,
      protein: 22,
      carbs: 70,
      fat: 14
    }
  ],
  dinner: [
    {
      name: "Grilled Fish Curry",
      description: "Grilled fish in light curry with steamed vegetables",
      calories: 380,
      protein: 35,
      carbs: 25,
      fat: 18
    },
    {
      name: "Tandoori Chicken",
      description: "Marinated chicken with mint chutney and salad",
      calories: 420,
      protein: 40,
      carbs: 15,
      fat: 22
    },
    {
      name: "Paneer Tikka",
      description: "Grilled cottage cheese with vegetables and mint chutney",
      calories: 350,
      protein: 25,
      carbs: 20,
      fat: 20
    }
  ],
  snack: [
    {
      name: "Sprouts Chaat",
      description: "Mixed sprouts with chopped vegetables and chaat masala",
      calories: 180,
      protein: 12,
      carbs: 25,
      fat: 5
    },
    {
      name: "Roasted Makhana",
      description: "Roasted fox nuts with mild spices",
      calories: 150,
      protein: 8,
      carbs: 20,
      fat: 4
    },
    {
      name: "Fruit Chaat",
      description: "Mixed fruits with chaat masala and lemon",
      calories: 120,
      protein: 3,
      carbs: 25,
      fat: 2
    }
  ]
};

const generateFallbackDietPlan = (userProfile) => {
  const meals = [];
  const calorieGoal = userProfile.calorieGoal || 2000;
  const mealsPerDay = userProfile.mealsPerDay || 5;
  
  // Add breakfast
  meals.push(mealTemplates.breakfast[Math.floor(Math.random() * mealTemplates.breakfast.length)]);
  
  // Add lunch
  meals.push(mealTemplates.lunch[Math.floor(Math.random() * mealTemplates.lunch.length)]);
  
  // Add dinner
  meals.push(mealTemplates.dinner[Math.floor(Math.random() * mealTemplates.dinner.length)]);
  
  // Add snacks if needed
  const remainingMeals = mealsPerDay - 3;
  for (let i = 0; i < remainingMeals; i++) {
    meals.push(mealTemplates.snack[Math.floor(Math.random() * mealTemplates.snack.length)]);
  }

  return { meals };
};

const generateWithHuggingFace = async (prompt, userProfile) => {
  try {
    const apiKey = process.env.REACT_APP_HF_API_KEY;
    
    if (!apiKey) {
      console.log('No API key found, using fallback diet plan');
      return generateFallbackDietPlan(userProfile);
    }

    // Try both endpoints
    const endpoints = [HF_API_URL, HF_API_URL_ALT];
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 1000,
              temperature: 0.7,
              top_p: 0.95,
              return_full_text: false,
              do_sample: true,
              num_return_sequences: 1
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error for ${endpoint}: ${response.status} - ${errorText}`);
          lastError = new Error(`API Error: ${response.status} - ${errorText}`);
          continue;
        }

        const result = await response.json();
        console.log('Raw response:', result);

        // Parse the response text to extract JSON
        const jsonMatch = result[0].generated_text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log('No JSON found in response, trying next endpoint');
          continue;
        }
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    // If we get here, all endpoints failed
    console.error('All endpoints failed:', lastError);
    return generateFallbackDietPlan(userProfile);
  } catch (error) {
    console.error('Error with HuggingFace:', error);
    return generateFallbackDietPlan(userProfile);
  }
};

export const generateDietPlan = async (userProfile) => {
  console.log('userProfile', userProfile);
  const mealCount = userProfile.mealFrequency || 4; // Default to 4 meals if not specified
  const totalCalories = userProfile.calorieGoal || 2000;
  
  // Calculate calorie distribution
  const calorieDistribution = {
    3: { breakfast: 0.35, lunch: 0.40, dinner: 0.25 },
    4: { breakfast: 0.30, lunch: 0.35, dinner: 0.25, snack: 0.10 },
    5: { breakfast: 0.25, lunch: 0.30, dinner: 0.25, morningSnack: 0.10, eveningSnack: 0.10 },
    6: { breakfast: 0.20, lunch: 0.25, dinner: 0.25, morningSnack: 0.10, eveningSnack: 0.10, preWorkout: 0.10 }
  };

  const distribution = calorieDistribution[mealCount];
  const mealTimings = {
    3: ['Breakfast (7-8 AM)', 'Lunch (12-1 PM)', 'Dinner (7-8 PM)'],
    4: ['Breakfast (7-8 AM)', 'Lunch (12-1 PM)', 'Evening Snack (4-5 PM)', 'Dinner (7-8 PM)'],
    5: ['Breakfast (7-8 AM)', 'Morning Snack (10-11 AM)', 'Lunch (12-1 PM)', 'Evening Snack (4-5 PM)', 'Dinner (7-8 PM)'],
    6: ['Breakfast (7-8 AM)', 'Morning Snack (10-11 AM)', 'Lunch (12-1 PM)', 'Pre-Workout (4-5 PM)', 'Post-Workout (6-7 PM)', 'Dinner (8-9 PM)']
  };

  const prompt = `Create a personalized Indian diet plan for a user with the following profile:
    - Calorie Goal: ${totalCalories} calories per day
    - Fitness Goal: ${userProfile.fitnessGoal}
    - Activity Level: ${userProfile.activityLevel}
    - Diet Type: ${userProfile.dietType}
    - Food Allergies: ${userProfile.foodAllergies || 'None'}
    - Number of Meals: ${mealCount} meals per day

    Important Requirements:
    1. Each meal must be an Indian dish that matches the user's diet type
    2. The total calories across all meals must sum up to exactly ${totalCalories} calories
    3. Each meal must be served at specific times as follows:
       ${mealTimings[mealCount].join('\n       ')}
    4. Calorie distribution should be as follows:
       ${Object.entries(distribution).map(([meal, percentage]) => 
         `${meal}: ${Math.round(totalCalories * percentage)} calories (${percentage * 100}%)`
       ).join('\n       ')}
    5. Each meal must include:
       - A main dish
       - Appropriate sides/accompaniments
       - Portion sizes that match the calorie target
       - Protein, carbs, and fat content that supports the fitness goal

    Format the response as a JSON object with a 'meals' array containing meal objects.
    Example format:
    {
      "meals": [
        {
          "name": "Masala Dosa with Sambar",
          "timing": "Breakfast (7-8 AM)",
          "description": "Crispy rice crepe with spiced potato filling, served with lentil-based vegetable stew",
          "calories": 350,
          "protein": 12,
          "carbs": 45,
          "fat": 15,
          "portion": "2 dosas with 1 cup sambar"
        }
      ]
    }

    Ensure that:
    1. The total calories across all meals equals exactly ${totalCalories}
    2. Each meal's timing matches the specified schedule
    3. The meals are appropriate for the user's diet type and fitness goal
    4. Portion sizes are realistic and achievable
    5. The meal plan is practical and can be prepared at home`;

  try {
    console.log('Attempting to generate diet plan with HuggingFace...');
    const dietPlan = await generateWithHuggingFace(prompt, userProfile);
    console.log('Successfully generated diet plan', dietPlan);
    return dietPlan;
  } catch (error) {
    console.error('Failed to generate with HuggingFace:', error);
    console.log('Falling back to template-based diet plan');
    return generateFallbackDietPlan(userProfile);
  }
}; 