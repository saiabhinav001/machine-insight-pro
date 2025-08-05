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
    const frontendData = request.body.input_data[0].values[0];

    // 3. *** FIX: Construct the payload with ALL required fields for the AutoAI model ***
    const payload = {
      "input_data": [{
        "fields": [
          "UDI",
          "Product ID",
          "Type",
          "Air temperature [K]",
          "Process temperature [K]",
          "Rotational speed [rpm]",
          "Torque [Nm]",
          "Tool wear [min]",
          "Target" // This is the column the model predicts, but the API requires it as an input field.
        ],
        "values": [[
          0,                  // Placeholder for UDI
          "L50070",           // Placeholder for Product ID
          frontendData[0],    // Type
          frontendData[1],    // Air temperature
          frontendData[2],    // Process temperature
          frontendData[3],    // Rotational speed
          frontendData[4],    // Torque
          frontendData[5],    // Tool wear
          0                   // Placeholder for Target
        ]]
      }]
    };

    // 4. Make the prediction request to IBM Watson
    const predictionResponse = await fetch(WML_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(payload)
    });

    if (!predictionResponse.ok) {
      const errorBody = await predictionResponse.text();
      console.error("Error response from IBM:", errorBody);
      throw new Error(`Prediction API call failed. Status: ${predictionResponse.status}. Check Vercel logs for details.`);
    }

    const predictionData = await predictionResponse.json();

    // 5. EXTRACT PREDICTION AND REAL-TIME CONFIDENCE
    const predictionResult = predictionData.predictions[0]?.values[0];
    if (!predictionResult) {
        throw new Error("Invalid response structure from prediction API.");
    }
    
    const predictionLabel = predictionResult[0];
    const probabilityArray = predictionResult[1];
    const confidenceScore = Math.max(...probabilityArray);

    // 6. Send the final prediction AND confidence back to the frontend
    return response.status(200).json({
        prediction: predictionLabel,
        confidence: confidenceScore
    });

  } catch (error) {
    console.error("An error occurred in the handler:", error.message);
    return response.status(500).json({ message: error.message });
  }
}
