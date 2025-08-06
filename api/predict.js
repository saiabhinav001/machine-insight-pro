// File: /api/predict.js

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the API key and Endpoint URL securely from Vercel Environment Variables
  const WML_API_KEY = process.env.WML_API_KEY;
  const WML_ENDPOINT_URL = process.env.WML_ENDPOINT_URL;

  if (!WML_API_KEY || !WML_ENDPOINT_URL) {
    console.error("Server configuration error: WML credentials not set.");
    return response.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    // 1. Get IBM Cloud IAM token for authentication
    const tokenResponse = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WML_API_KEY}`
    });

    if (!tokenResponse.ok) {
      console.error("Authentication with IBM Cloud failed. Status:", tokenResponse.status);
      throw new Error('Authentication with IBM Cloud failed.');
    }
    const tokenData = await tokenResponse.json();

    // 2. Get the machine data sent from the frontend
    const frontendData = request.body.input_data[0].values[0];

    // 3. Construct the full payload required by the AutoAI model.
    //    This includes placeholder values for fields not present in the UI form.
    const payload = {
      "input_data": [{
        "fields": [
          "UDI", "Product ID", "Type", "Air temperature [K]", "Process temperature [K]", 
          "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]", "Target"
        ],
        "values": [[
          0,                // Placeholder for UDI
          "L50070",         // Placeholder for Product ID
          frontendData[0],  // Type from form
          frontendData[1],  // Air temperature from form
          frontendData[2],  // Process temperature from form
          frontendData[3],  // Rotational speed from form
          frontendData[4],  // Torque from form
          frontendData[5],  // Tool wear from form
          1                 // FIXED: Set Target to 1 to allow failure prediction
        ]]
      }]
    };

    // 4. Make the prediction request to the IBM Watson Machine Learning endpoint
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
      console.error("Error response from IBM Watson:", errorBody);
      throw new Error(`Prediction API call failed. Status: ${predictionResponse.status}.`);
    }

    const predictionData = await predictionResponse.json();

    // 5. Extract the text prediction and the real-time confidence score from the response
    const predictionResult = predictionData.predictions[0]?.values[0];
    if (!predictionResult || predictionResult.length < 2) {
        console.error("Invalid response structure from prediction API:", predictionData);
        throw new Error("Invalid response structure from prediction API.");
    }
    
    const predictionText = predictionResult[0];      // The string prediction, e.g., "Overstrain Failure"
    const probabilityArray = predictionResult[1];   // The array of probabilities for each class
    const confidenceScore = Math.max(...probabilityArray); // The highest probability is the confidence

    // 6. Send the simplified result (prediction text and confidence) back to the frontend
    return response.status(200).json({
        prediction: predictionText,
        confidence: confidenceScore
    });

  } catch (error) {
    console.error("An error occurred in the /api/predict handler:", error.message);
    return response.status(500).json({ message: error.message });
  }
}
