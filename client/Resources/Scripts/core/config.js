// Configuration - Dynamic port detection
let CONFIG = {
  API_BASE_URL: "http://localhost:5032/api/Book",
  USER_API_URL: "http://localhost:5032/api/User",
  RATING_API_URL: "http://localhost:5032/api/Book",
  AUTH_API_URL: "http://localhost:5032/api/Auth",
  DEV_API_URL: "http://localhost:5032/api/Dev",
};

// Function to update config with actual port
async function updateConfigWithPort() {
  try {
    // Try to get port from API, fallback to 5032
    const response = await fetch("http://localhost:5032/api/config/port");
    if (response.ok) {
      const data = await response.json();
      const port = data.port;
      CONFIG.API_BASE_URL = `http://localhost:${port}/api/Book`;
      CONFIG.USER_API_URL = `http://localhost:${port}/api/User`;
      CONFIG.RATING_API_URL = `http://localhost:${port}/api/Book`;
      CONFIG.AUTH_API_URL = `http://localhost:${port}/api/Auth`;
      CONFIG.DEV_API_URL = `http://localhost:${port}/api/Dev`;
      console.log(`Updated API URLs to use port: ${port}`);
    }
  } catch (error) {
    console.log("Using default port 5032");
  }
}
