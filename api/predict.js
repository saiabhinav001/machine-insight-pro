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
    return response.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    // 1. Get IBM Cloud IAM token
    const tokenResponse = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WML_API_KEY}`
    });

    if (!tokenResponse.ok) {
      throw new Error('Authentication with IBM Cloud failed.');
    }
    const tokenData = await tokenResponse.json();

    // 2. Get the machine data sent from the frontend
    const machineData = request.body;

    // 3. Make the prediction request to IBM Watson
    const predictionResponse = await fetch(WML_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(machineData)
    });

    if (!predictionResponse.ok) {
      throw new Error('Prediction API call failed.');
    }

    const predictionData = await predictionResponse.json();

    // 4. EXTRACT PREDICTION AND REAL-TIME CONFIDENCE
    const predictionResult = predictionData.predictions[0]?.values[0];
    if (!predictionResult) {
        throw new Error("Invalid response structure from prediction API.");
    }
    
    const predictionLabel = predictionResult[0];
    const probabilityArray = predictionResult[1]; // This is the array of probabilities
    
    // The confidence is the highest value in the probability array
    const confidenceScore = Math.max(...probabilityArray);

    // 5. Send the final prediction AND confidence back to the frontend
    return response.status(200).json({
        prediction: predictionLabel,
        confidence: confidenceScore
    });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: error.message });
  }
}
