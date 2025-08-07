// File: /api/predict.js

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const WML_API_KEY = process.env.WML_API_KEY;
  const WML_ENDPOINT_URL = process.env.WML_ENDPOINT_URL;

  if (!WML_API_KEY || !WML_ENDPOINT_URL) {
    console.error("Server configuration error: WML credentials are not set in Vercel.");
    return response.status(500).json({ message: 'Server configuration error: Missing API credentials.' });
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
      const errorText = await tokenResponse.text();
      console.error("IBM IAM Authentication Error:", errorText);
      // Send a detailed error back to the frontend
      throw new Error(`Authentication with IBM Cloud failed. Status: ${tokenResponse.status}. Details: ${errorText}`);
    }
    const tokenData = await tokenResponse.json();

    // 2. Get the machine data sent from the frontend
    const frontendData = request.body.input_data[0].values[0];

    // 3. Construct the full payload required by the AutoAI model
    const payload = {
      "input_data": [{
        "fields": [
          "UDI", "Product ID", "Type", "Air temperature [K]", "Process temperature [K]", 
          "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]", "Target"
        ],
        "values": [[
          0, "L50070", frontendData[0], frontendData[1], frontendData[2], 
          frontendData[3], frontendData[4], frontendData[5], 1
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
      // This is the critical part: read the error body from IBM's response
      const errorBody = await predictionResponse.text();
      console.error("Error response from IBM Watson Prediction API:", errorBody);
      // Create a more informative error message to send to the frontend
      throw new Error(`Prediction API call failed. Status: ${predictionResponse.status}. Details: ${errorBody}`);
    }

    const predictionData = await predictionResponse.json();

    // 5. Extract the prediction and confidence score
    const predictionResult = predictionData.predictions[0]?.values[0];
    if (!predictionResult || predictionResult.length < 2) {
        console.error("Invalid response structure from prediction API:", predictionData);
        throw new Error("Invalid response structure from prediction API.");
    }
    
    const predictionText = predictionResult[0];
    const probabilityArray = predictionResult[1];
    const confidenceScore = Math.max(...probabilityArray);

    // 6. Send the successful result back to the frontend
    return response.status(200).json({
        prediction: predictionText,
        confidence: confidenceScore
    });

  } catch (error) {
    // This will now catch the detailed errors from above
    console.error("An error occurred in the /api/predict handler:", error.message);
    return response.status(500).json({ message: error.message });
  }
}
