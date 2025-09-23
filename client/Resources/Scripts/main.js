// Main application initialization and coordination
// This file coordinates all the modular components

// Global state
let books = [];
let editingBookId = null;
let currentSearchTerm = "";
let notifications = [];
let ratings = [];
let contactedSellers = new Set(); // Track which sellers the user has contacted
let ratedBooks = new Set(); // Track which books the user has rated (format: "raterEmail-sellerEmail-bookId")
let promptedToRate = new Set(); // Track which books the user has been prompted to rate
let userEmailToIdMap = new Map(); // Cache for email to user ID mapping

// Notification polling
let notificationPollingInterval = null;

// Additional global variables from index.js
let selectedCourse = "";

// Main initialization
async function handleOnLoad() {
  console.log("Page loaded, initializing app...");

  // Update config with actual port
  await updateConfigWithPort();

  // Setup global error handling
  setupGlobalErrorHandling();

  // Check authentication status
  checkAuthStatus();

  // Update UI based on auth status
  updateAuthUI();

  // Setup event listeners
  setupAuthEventListeners();
  setupScrollBehavior();

  // Load books (will be empty if not authenticated)
  await loadBooks();

  // Render the app
  renderApp();

  // Add development helper if in development mode
  addDevelopmentHelper();

  console.log("App initialization completed");
}

// Setup scroll behavior for smooth scrolling
function setupScrollBehavior() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  console.log("Scroll behavior setup completed");
}

// Additional functions that are referenced across modules
async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAlert("Please fill in all fields", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.requiresVerification) {
        showVerificationModal(email, result.verificationCode);
      } else {
        // Direct login success
        currentUser = result.user;
        authToken = result.token;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        localStorage.setItem("authToken", authToken);
        updateAuthUI();
        await loadBooks();
        renderApp();
        showAlert("Login successful!", "success");
      }
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Login failed", "danger");
    }
  } catch (error) {
    console.error("Error during login:", error);
    showAlert("Login failed. Please try again.", "danger");
  }
}

async function handleSignup() {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!email || !password || !confirmPassword) {
    showAlert("Please fill in all fields", "warning");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match", "warning");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters long", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      showVerificationModal(email, result.verificationCode);
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Registration failed", "danger");
    }
  } catch (error) {
    console.error("Error during registration:", error);
    showAlert("Registration failed. Please try again.", "danger");
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", handleOnLoad);

// Make sure the app initializes even if DOMContentLoaded already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handleOnLoad);
} else {
  handleOnLoad();
}
