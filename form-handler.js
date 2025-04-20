// FILE: form-handler.js (Ensure this is in your Netlify functions directory)

const querystring = require('querystring'); // Built-in Node.js module

exports.handler = async (event, context) => {
  // 1. Check if it's a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: 'Method Not Allowed. Please POST form data.',
    };
  }

  // 2. Parse the form data
  let formData;
  try {
    // Netlify automatically base64 encodes the body if it's not JSON
    const decodedBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;
    formData = querystring.parse(decodedBody);
    console.log("Parsed Form Data:", formData); // Log for debugging in Netlify function logs
  } catch (error) {
    console.error('Error parsing form data:', error);
    return {
      statusCode: 400, // Bad Request
      body: 'Error parsing form data.',
    };
  }

  // 3. Prepare data for storage/webhook
  //    (Combine booking + planning details)
  const submissionData = {
      ...formData, // Spread all parsed form fields
      submissionTimestamp: new Date().toISOString(), // Add a server-side timestamp
      // Add any other server-side context if needed
  };

  // --- File Handling Placeholder ---
  // Direct file uploads are complex in standard Netlify functions.
  // Consider client-side uploads to cloud storage before submitting the form,
  // or use Netlify Forms with file uploads enabled.
  // This example does not handle file processing.
  // --- End File Handling Placeholder ---


  // 4. Save Data (Example: Send to Make.com Webhook)
  // *** IMPORTANT: Replace with your NEW webhook URL, preferably using Netlify environment variables ***
  const webhookUrl = 'https://hook.eu2.make.com/a2lmal9dw867mpzzhtjo1zdb2lyng8rn';
  // Example using environment variable (set this in Netlify UI):
  // const webhookUrl = process.env.PLANNING_FORM_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'hhttps://hook.eu2.make.com/a2lmal9dw867mpzzhtjo1zdb2lyng8rn') {
      console.error("Webhook URL is not configured!");
      // Decide how to handle this - maybe still redirect but log error?
      // For now, we'll log and proceed to redirect.
  } else {
      let saveError = null;
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
          saveError = `Webhook response not OK: ${response.status} ${response.statusText}`;
          console.warn(saveError);
          // Log the response body if possible for more details
          try {
              const errorBody = await response.text();
              console.warn("Webhook error response body:", errorBody);
          } catch (e) {
              console.warn("Could not read webhook error response body.");
          }
        } else {
          console.log('Successfully sent planning data to webhook.');
          const responseData = await response.text(); // Or .json()
          console.log('Webhook response:', responseData);
          // **IMPORTANT**: If your Make.com scenario saves data that admin.js needs to fetch,
          // this function doesn't save to localStorage. The admin panel needs updating.
        }
      } catch (error) {
        saveError = `Error sending data to webhook: ${error.message}`;
        console.error(saveError);
      }
  }

  // 5. Redirect to Thank You page
  console.log("Redirecting to thank-you page.");
  return {
    statusCode: 302, // Found (Redirect)
    headers: {
      // Ensure the path is correct relative to your site root
      Location: '/thank-you.html?source=planning', // Added source query param
    },
    body: '', // Body is usually ignored for 302
  };
};
