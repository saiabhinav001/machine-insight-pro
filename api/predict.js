// File: /api/predict.js

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the API key securely from Vercel Environment Variables
  const WML_API_KEY = process.env.WML_API_KEY;
  const WML_ENDPOINT_URL = process.env.WML_ENDPOINT_URL;

  if (!WML_API_KEY || !WML_ENDPOINT_URL) {
    console.error("Server configuration error: Missing API Key or Endpoint URL.");
    return response.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    // 1. Get IBM Cloud IAM token
    console.log("Step 1: Authenticating with IBM Cloud...");
    const tokenResponse = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WML_API_KEY}`
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Authentication failed:", errorText);
      throw new Error('Authentication with IBM Cloud failed.');
    }
    const tokenData = await tokenResponse.json();
    console.log("Step 1: Authentication successful.");

    // 2. Get the machine data sent from the frontend
    const machineData = request.body;
    console.log("Step 2: Received machine data from frontend:", JSON.stringify(machineData, null, 2));

    // 3. Make the prediction request to IBM Watson
    console.log(`Step 3: Making prediction request to endpoint: ${WML_ENDPOINT_URL}`);
    const predictionResponse = await fetch(WML_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(machineData)
    });

    // THIS IS THE CRITICAL DEBUGGING STEP
    if (!predictionResponse.ok) {
      // We will now log the exact error response from IBM
      const errorBody = await predictionResponse.text();
      console.error(`Prediction API call failed with status: ${predictionResponse.status}`);
      console.error("Error response from IBM:", errorBody);
      // Create a more informative error message for the frontend
      throw new Error(`Prediction API call failed. Status: ${predictionResponse.status}. Check Vercel logs for details.`);
    }

    const predictionData = await predictionResponse.json();
    console.log("Step 3: Prediction successful. Response:", JSON.stringify(predictionData, null, 2));

    // 4. EXTRACT PREDICTION AND REAL-TIME CONFIDENCE
    console.log("Step 4: Extracting prediction and confidence...");
    const predictionResult = predictionData.predictions[0]?.values[0];
    if (!predictionResult) {
        throw new Error("Invalid response structure from prediction API.");
    }
    
    const predictionLabel = predictionResult[0];
    const probabilityArray = predictionResult[1];
    const confidenceScore = Math.max(...probabilityArray);
    console.log(`Step 4: Extracted Label: ${predictionLabel}, Confidence: ${confidenceScore}`);

    // 5. Send the final prediction AND confidence back to the frontend
    return response.status(200).json({
        prediction: predictionLabel,
        confidence: confidenceScore
    });

  } catch (error) {
    console.error("An error occurred in the handler:", error.message);
    return response.status(500).json({ message: error.message });
  }
}
