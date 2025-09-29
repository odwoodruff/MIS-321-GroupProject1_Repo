// Centralized authentication check function
async function authCheck(showAlert = true) {
  // Check if user is logged in
  if (!currentUser) {
    if (showAlert && typeof showAlert === "function") {
      showAlert("Please sign in to continue", "warning");
    }
    showLoginForm();
    return false;
  }

  // Check if JWT token exists and is valid
  const token = localStorage.getItem("authToken");
  if (!token) {
    if (typeof showAlert === "function") {
      showAlert("Session expired. Please sign in again.", "warning");
    }
    logout();
    return false;
  }

  // Validate token with server
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof showAlert === "function") {
          showAlert("Session expired. Please sign in again.", "warning");
        }
        logout();
        return false;
      }
      throw new Error(`Token validation failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Token validation error:", error);
    if (typeof showAlert === "function") {
      showAlert("Authentication error. Please sign in again.", "warning");
    }
    logout();
    return false;
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

  showLoginForm();
}

// Main initialization
async function refreshAuth() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return false;
  }

  try {
    // Validate token by making a simple API call
    const response = await fetch(`${CONFIG.API_BASE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      // Token is invalid, clear it
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error("Token validation failed:", error);
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
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");
  const adminPanelLink = document.getElementById("admin-panel-link");
  const devMenuLink = document.getElementById("dev-menu-link");

  if (currentUser) {
    if (authButtons) authButtons.classList.add("d-none");
    if (userMenu) userMenu.classList.remove("d-none");
    if (userName) userName.textContent = currentUser.firstName;

    // Show admin menu items for admin users
    if (isAdmin() && adminPanelLink) {
      adminPanelLink.classList.remove("d-none");
    } else if (adminPanelLink) {
      adminPanelLink.classList.add("d-none");
    }

    // Show dev menu for admin users
    if (isAdmin() && devMenuLink) {
      devMenuLink.classList.remove("d-none");
    } else if (devMenuLink) {
      devMenuLink.classList.add("d-none");
    }
  } else {
    if (authButtons) authButtons.classList.remove("d-none");
    if (userMenu) userMenu.classList.add("d-none");
    if (adminPanelLink) adminPanelLink.classList.add("d-none");
    if (devMenuLink) devMenuLink.classList.add("d-none");
  }
}

function setupAuthEventListeners() {
  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent default form submission
      handleLogin();
    });
  }

  // Login button (backup)
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default button behavior
      handleLogin();
    });
  }

  // Logout button
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", handleLogout);
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    if (typeof showAlert === "function") {
      showAlert("Please enter your university email", "warning");
    }
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    return;
  }

  // Validate email domain
  if (!email.endsWith("@crimson.ua.edu") && !email.endsWith("@ua.edu")) {
    if (typeof showAlert === "function") {
      showAlert(
        "Please use a valid University of Alabama email address (@crimson.ua.edu or @ua.edu)",
        "warning"
      );
    }
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
    return;
  }

  try {
    // Send verification code
    const response = await fetch(`${CONFIG.AUTH_API_URL}/send-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      showVerificationModal(email, result.verificationCode);
      if (typeof showAlert === "function") {
        showAlert("Verification code sent to your email", "success");
      }
    } else {
      if (typeof showAlert === "function") {
        showAlert(
          result.message || "Failed to send verification code",
          "danger"
        );
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    if (typeof showAlert === "function") {
      showAlert("Login failed. Please try again.", "danger");
    }
  }
}

async function resendVerificationCode(email) {
  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/send-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      if (typeof showAlert === "function") {
        showAlert("Verification code resent", "success");
      }
    } else {
      if (typeof showAlert === "function") {
        showAlert(
          result.message || "Failed to resend verification code",
          "danger"
        );
      }
    }
  } catch (error) {
    console.error("Resend error:", error);
    if (typeof showAlert === "function") {
      showAlert("Failed to resend verification code", "danger");
    }
  }
}

async function verifyEmailCode(email) {
  const code = document.getElementById("verificationCode").value.trim();

  if (!code || code.length !== 6) {
    if (typeof showAlert === "function") {
      showAlert("Please enter a valid 6-digit verification code", "warning");
    }
    return;
  }

  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Verification successful, user data:", result.user);
      console.log("Token received:", result.token ? "Yes" : "No");

      // Store user data and JWT token
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

      // Hide verification modal first
      const verificationModal = bootstrap.Modal.getInstance(
        document.getElementById("verificationModal")
      );
      if (verificationModal) {
        verificationModal.hide();
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
      } else {
        // Existing user - show dark mode suggestion
        setTimeout(() => {
          showDarkModeSuggestion();
        }, 2000); // Small delay to let the UI settle
      }
    } else {
      console.error("Verification failed:", result.message);
      if (typeof showAlert === "function") {
        showAlert(result.message || "Invalid verification code", "danger");
      }
    }
  } catch (error) {
    console.error("Verification error:", error);
    if (typeof showAlert === "function") {
      showAlert("Verification failed. Please try again.", "danger");
    }
  }
}

function handleLogout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
  updateAuthUI();
  // Re-render the app to hide edit/delete buttons
  renderApp();
  if (typeof showAlert === "function") {
    showAlert("Logged out successfully", "info");
  }
}

function showLoginForm() {
  // Show the login modal
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

async function submitNameCollection() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();

  if (!firstName || !lastName) {
    if (typeof showAlert === "function") {
      showAlert("Please enter both first and last name", "warning");
    }
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
      if (typeof showAlert === "function") {
        showAlert("Profile updated successfully!", "success");
      }

      // Show dark mode suggestion for new users
      showDarkModeSuggestion();

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
      if (typeof showAlert === "function") {
        showAlert(result.message || "Failed to update profile", "danger");
      }
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    if (typeof showAlert === "function") {
      showAlert("Failed to update profile. Please try again.", "danger");
    }
  }
}

async function completeUserLogin() {
  // Update UI first
  updateAuthUI();

  // Show success message immediately
  if (typeof showAlert === "function") {
    showAlert("Email verified! Welcome to Roll Tide Books!", "success");
  }

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
  if (typeof showAlert === "function") {
    showAlert("Profile updated! Welcome to Roll Tide Books!", "success");
  }

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

// Show dark mode suggestion notification
function showDarkModeSuggestion() {
  console.log("showDarkModeSuggestion called");

  // Check if user has already seen the dark mode suggestion
  if (localStorage.getItem("darkModeSuggestionShown")) {
    console.log("Dark mode suggestion already shown, skipping");
    return;
  }

  console.log("Showing dark mode suggestion");

  // Create a small notification in the corner
  const notification = document.createElement("div");
  notification.id = "darkModeSuggestion";
  notification.className = "position-fixed";
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: var(--crimson);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    max-width: 200px;
    animation: slideInRight 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-moon-stars me-2"></i>
      <div>
        <div class="fw-bold">Try Dark Mode!</div>
        <small>Click the moon icon above</small>
      </div>
      <button type="button" class="btn-close btn-close-white ms-2" onclick="dismissDarkModeSuggestion()" style="font-size: 10px;"></button>
    </div>
  `;

  // Add animation keyframes if not already added
  if (!document.getElementById("darkModeAnimation")) {
    const style = document.createElement("style");
    style.id = "darkModeAnimation";
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Add click listener to dismiss on any button click
  const dismissOnClick = (event) => {
    if (event.target.tagName === "BUTTON" || event.target.closest("button")) {
      dismissDarkModeSuggestion();
      document.removeEventListener("click", dismissOnClick);
    }
  };
  document.addEventListener("click", dismissOnClick);

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    dismissDarkModeSuggestion();
    document.removeEventListener("click", dismissOnClick);
  }, 8000);
}

// Dismiss dark mode suggestion
function dismissDarkModeSuggestion() {
  const notification = document.getElementById("darkModeSuggestion");
  if (notification) {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  // Clean up any remaining click listeners
  const dismissOnClick = (event) => {
    if (event.target.tagName === "BUTTON" || event.target.closest("button")) {
      dismissDarkModeSuggestion();
      document.removeEventListener("click", dismissOnClick);
    }
  };
  document.removeEventListener("click", dismissOnClick);

  // Mark as shown so it doesn't appear again
  localStorage.setItem("darkModeSuggestionShown", "true");
}

// Make functions globally available
window.showDarkModeSuggestion = showDarkModeSuggestion;
window.dismissDarkModeSuggestion = dismissDarkModeSuggestion;
