// Global state for authentication
let currentUser = null;
let authToken = null; // JWT token for authentication

// Helper function to get headers with JWT token
function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

// Helper function to get user ID by email
async function getUserIdByEmail(email) {
  // Check cache first
  if (userEmailToIdMap.has(email)) {
    return userEmailToIdMap.get(email);
  }

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/existing-users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error("Failed to fetch users");
      return null;
    }

    const users = await response.json();
    const user = users.find((u) => u.email === email);

    // Cache the result
    if (user) {
      userEmailToIdMap.set(email, user.id);
      return user.id;
    }

    return null;
  } catch (error) {
    console.error("Error looking up user by email:", error);
    return null;
  }
}

// Global 401 error handler
function setupGlobalErrorHandling() {
  // Override fetch to catch 401 errors globally
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    if (response.status === 401) {
      console.log("401 Unauthorized detected, logging out user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      showAlert("Session expired. Please sign in again.", "warning");
      showLoginForm();
    }

    return response;
  };
}

// Centralized authentication check function
async function authCheck(showAlert = true) {
  // Check if user is logged in
  if (!currentUser) {
    if (showAlert) {
      showAlert("Please sign in to continue", "warning");
    }
    showLoginForm();
    return false;
  }

  // Check if JWT token exists and is valid
  if (!authToken) {
    if (showAlert) {
      showAlert("Please sign in to continue", "warning");
    }
    showLoginForm();
    return false;
  }

  return true;
}

// Main initialization
async function refreshAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      authToken = token;
      return true;
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      return false;
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    return false;
  }
}

// Authentication Functions
function checkAuthStatus() {
  const savedUser = localStorage.getItem("currentUser");
  const savedToken = localStorage.getItem("authToken");

  if (savedUser && savedToken) {
    currentUser = JSON.parse(savedUser);
    authToken = savedToken;
    return true;
  }
  return false;
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");
  const adminPanelLink = document.getElementById("admin-panel-link");

  if (currentUser) {
    authButtons.style.display = "none";
    userMenu.style.display = "block";
    userName.textContent = currentUser.firstName || currentUser.username;

    // Show admin panel link only for admin users
    if (adminPanelLink) {
      adminPanelLink.style.display = currentUser.isAdmin ? "block" : "none";
    }
  } else {
    authButtons.style.display = "block";
    userMenu.style.display = "none";
  }
}

function setupAuthEventListeners() {
  // Create the login modal first so it's available for Bootstrap data attributes
  createLoginModal();

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent default form submission
      handleLogin();
    });
  }

  // Logout link (if it exists)
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Set up signup form event listener when signup modal is created
function setupSignupEventListeners() {
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent default form submission
      handleSignup();
    });
  }
}

// Logout function
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  currentUser = null;
  authToken = null;

  // Clear notification polling
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
    notificationPollingInterval = null;
  }

  // Clear all data
  books = [];
  notifications = [];
  ratings = [];
  contactedSellers.clear();
  ratedBooks.clear();
  promptedToRate.clear();

  // Update UI
  updateAuthUI();
  renderApp();
  showAlert("You have been logged out", "info");
}

async function verifyEmailCode(email) {
  const code = document.getElementById("verificationCode").value.trim();

  if (!code || code.length !== 6) {
    showAlert("Please enter a valid 6-digit verification code", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        code: code,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Verification successful, user data:", result.user);
      console.log("Token received:", result.token ? "Yes" : "No");

      // Store user data and token
      currentUser = result.user;
      authToken = result.token;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("authToken", authToken);

      console.log("Verification successful - Token stored:", !!authToken);
      console.log("Verification successful - User stored:", !!currentUser);
      console.log(
        "Token preview:",
        authToken ? authToken.substring(0, 20) + "..." : "No token"
      );

      // Hide verification modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("verificationModal")
      );
      if (modal) {
        modal.hide();
      }

      // Always proceed with authenticated flow - JWT token is now available
      await completeUserLoginWithAuth();

      // Check if this is a new user (no first/last name set) and show name collection modal
      if (
        !currentUser.firstName ||
        currentUser.firstName === "Student" ||
        !currentUser.lastName ||
        currentUser.lastName === "User"
      ) {
        // Show name collection modal for new users after they're logged in
        setTimeout(() => {
          showNameCollectionModal();
        }, 1000); // Small delay to let the UI settle
      }
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Invalid verification code", "danger");
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    showAlert("An error occurred during verification", "danger");
  }
}

async function completeUserLogin() {
  // Update UI first
  updateAuthUI();

  // Show success message immediately
  showAlert("Email verified! Welcome to Roll Tide Books!", "success");

  // Load only non-authenticated data
  try {
    await loadBooks();
    console.log("Books loaded successfully");
  } catch (error) {
    console.warn("Failed to load books:", error);
  }

  // Render the app
  renderApp();
}

async function completeUserLoginWithAuth() {
  // Update UI first
  updateAuthUI();

  // Show success message immediately
  showAlert("Profile updated! Welcome to Roll Tide Books!", "success");

  // Add a delay to let the API process everything
  console.log("Waiting 2 seconds for API to process...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Load all authenticated data
  try {
    await loadBooks();
    console.log("Books loaded successfully");
  } catch (error) {
    console.warn("Failed to load books:", error);
  }

  try {
    console.log(
      "About to load notifications - currentUser:",
      !!currentUser,
      "authToken:",
      !!authToken
    );
    await loadNotifications();
    console.log("Notifications loaded successfully");
  } catch (error) {
    console.warn("Failed to load notifications:", error);
  }

  try {
    await loadContactedSellers();
    console.log(
      "Contacted sellers loaded successfully, count:",
      contactedSellers.size
    );
  } catch (error) {
    console.warn("Failed to load contacted sellers:", error);
  }

  try {
    await loadRatedBooks();
    console.log("Rated books loaded successfully, count:", ratedBooks.size);
  } catch (error) {
    console.warn("Failed to load rated books:", error);
  }

  try {
    await loadPromptedToRate();
    console.log(
      "Prompted to rate loaded successfully, count:",
      promptedToRate.size
    );
  } catch (error) {
    console.warn("Failed to load prompted to rate:", error);
  }

  // Render the app
  renderApp();

  // Start notification polling now that user is authenticated
  setupNotificationPolling();
}

function showNameCollectionModal() {
  // Create name collection modal
  const modalHtml = `
    <div class="modal fade" id="nameCollectionModal" tabindex="-1" aria-labelledby="nameCollectionModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="nameCollectionModalLabel">Complete Your Profile</h5>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">Please provide your first and last name to complete your account setup.</p>
            <form id="nameCollectionForm">
              <div class="mb-3">
                <label for="firstName" class="form-label">First Name</label>
                <input type="text" class="form-control" id="firstName" required>
              </div>
              <div class="mb-3">
                <label for="lastName" class="form-label">Last Name</label>
                <input type="text" class="form-control" id="lastName" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" onclick="submitNameCollection()">Complete Setup</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("nameCollectionModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("nameCollectionModal")
  );
  modal.show();
}

async function submitNameCollection() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();

  if (!firstName || !lastName) {
    showAlert("Please enter both first and last name", "warning");
    return;
  }

  try {
    // Update user profile via API
    const response = await fetch(`${CONFIG.AUTH_API_URL}/update-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
      }),
    });

    if (response.ok) {
      // Update current user data
      currentUser.firstName = firstName;
      currentUser.lastName = lastName;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Hide modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("nameCollectionModal")
      );
      if (modal) {
        modal.hide();
      }

      // User is already logged in, just reload the data to reflect the updated profile
      showAlert("Profile updated successfully!", "success");

      // Reload authenticated data to reflect the updated profile
      try {
        await loadNotifications();
        await loadContactedSellers();
        await loadRatedBooks();
        await loadPromptedToRate();

        // Re-render the app to show updated profile info
        renderApp();
      } catch (error) {
        console.warn("Failed to reload some data after profile update:", error);
        // Still re-render the app
        renderApp();
      }
    } else {
      const result = await response.json();
      showAlert(result.message || "Failed to update profile", "danger");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showAlert("Failed to update profile. Please try again.", "danger");
  }
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
