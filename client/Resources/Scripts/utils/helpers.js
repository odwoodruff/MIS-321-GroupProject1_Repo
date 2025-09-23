// Utility Functions
function isAdmin() {
  return currentUser && currentUser.email === "ccsmith33@crimson.ua.edu";
}

function canEditBook(book) {
  // If no user is logged in, they can't edit any book
  if (!currentUser) {
    return false;
  }

  // Admin can edit any book
  if (isAdmin()) {
    return true;
  }

  // Regular users can only edit their own books
  return book.sellerEmail === currentUser.email;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to validate professor name
function isValidProfessorName(name) {
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return false;
  }

  // Check if name contains only letters, spaces, hyphens, apostrophes, and periods
  const validNameRegex = /^[a-zA-Z\s\-'.]+$/;
  return validNameRegex.test(name);
}

function getConditionInfo(condition) {
  const conditions = {
    Excellent: {
      class: "condition-excellent",
      icon: "bi-star-fill",
      description:
        "Like new condition with minimal wear. No highlighting or writing.",
    },
    "Very Good": {
      class: "condition-very-good",
      icon: "bi-star-half",
      description: "Good condition with minor wear. Minimal highlighting.",
    },
    Good: {
      class: "condition-good",
      icon: "bi-star",
      description: "Fair condition with some wear. Some highlighting or notes.",
    },
    Fair: {
      class: "condition-fair",
      icon: "bi-star",
      description: "Worn condition with noticeable wear. Heavy highlighting.",
    },
    Poor: {
      class: "condition-poor",
      icon: "bi-exclamation-triangle",
      description:
        "Heavily worn with significant damage. May have missing pages.",
    },
  };

  return (
    conditions[condition] || {
      class: "condition-unknown",
      icon: "bi-question-circle",
      description: "Unknown condition",
    }
  );
}

function getConditionColor(condition) {
  if (!condition) return "secondary";

  switch (condition.toLowerCase()) {
    case "excellent":
      return "success";
    case "very good":
      return "info";
    case "good":
      return "primary";
    case "fair":
      return "warning";
    case "poor":
      return "danger";
    default:
      return "secondary";
  }
}

function getUniqueCourses() {
  return [
    ...new Set(books.map((book) => book.courseCode).filter((code) => code)),
  ];
}

function isModalOpen() {
  // Check if any Bootstrap modals are open
  const openModals = document.querySelectorAll(".modal.show");
  if (openModals.length > 0) return true;

  // Check if any alerts are showing (Bootstrap alerts)
  const alerts = document.querySelectorAll(".alert:not(.d-none)");
  if (alerts.length > 0) return true;

  return false;
}

function getNotificationsForUser(userEmail) {
  // This function is deprecated - notifications are now loaded from API
  console.warn("getNotificationsForUser is deprecated - use API instead");
  return [];
}

// Development Helper Functions
function addDevelopmentHelper() {
  // Add development panel to the page
  const devPanel = document.createElement("div");
  devPanel.id = "dev-panel";
  devPanel.innerHTML = `
    <div style="position: fixed; bottom: 10px; right: 10px; background: #ffeb3b; border: 3px solid #ff9800; border-radius: 8px; padding: 15px; z-index: 9999; font-size: 14px; max-width: 350px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
      <h6 style="margin: 0 0 10px 0; color: #e65100; font-weight: bold;">🛠️ Development Tools</h6>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button onclick="signInAsAlex()" class="btn btn-sm btn-primary" style="font-size: 12px;">
          <i class="bi bi-person-check"></i> Sign In as Alex
        </button>
        <button onclick="testAlexData()" class="btn btn-sm btn-info" style="font-size: 12px;">
          <i class="bi bi-database"></i> Test Alex Data
        </button>
        <button onclick="verifyAllExistingUsers()" class="btn btn-sm btn-success" style="font-size: 12px;">
          <i class="bi bi-check-all"></i> Verify All Users
        </button>
        <button onclick="verifySingleUser()" class="btn btn-sm btn-warning" style="font-size: 12px;">
          <i class="bi bi-person-check"></i> Verify Single User
        </button>
        <button onclick="migrateData()" class="btn btn-sm btn-secondary" style="font-size: 12px;">
          <i class="bi bi-arrow-clockwise"></i> Migrate Data
        </button>
        <button onclick="forceMigrateData()" class="btn btn-sm btn-danger" style="font-size: 12px;">
          <i class="bi bi-exclamation-triangle"></i> Force Migrate
        </button>
        <button onclick="toggleDevPanel()" class="btn btn-sm btn-outline-secondary" style="font-size: 12px;">
          <i class="bi bi-x"></i> Hide Panel
        </button>
      </div>
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #ffcc02; font-size: 11px; color: #666;">
        <strong>Current User:</strong> ${
          currentUser ? currentUser.email : "Not logged in"
        }<br>
        <strong>Auth Token:</strong> ${authToken ? "Present" : "Missing"}<br>
        <strong>Books Loaded:</strong> ${books.length}<br>
        <strong>Notifications:</strong> ${notifications.length}
      </div>
    </div>
  `;

  document.body.appendChild(devPanel);
}

function toggleDevPanel() {
  const devPanel = document.getElementById("dev-panel");
  if (devPanel) {
    devPanel.style.display =
      devPanel.style.display === "none" ? "block" : "none";
  }
}

// Development functions
async function signInAsAlex() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/sign-in-as-alex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      currentUser = result.user;
      authToken = result.token;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("authToken", authToken);

      updateAuthUI();
      await loadBooks();
      await loadNotifications();
      await loadContactedSellers();
      await loadRatedBooks();
      await loadPromptedToRate();
      renderApp();
      showAlert("Signed in as Alex Johnson!", "success");
    } else {
      showAlert("Failed to sign in as Alex", "danger");
    }
  } catch (error) {
    console.error("Error signing in as Alex:", error);
    showAlert("Error signing in as Alex", "danger");
  }
}

async function testAlexData() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/test-alex-data`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Alex data test results:", result);
      showAlert(`Alex data test completed. Check console for details.`, "info");
    } else {
      showAlert("Failed to test Alex data", "danger");
    }
  } catch (error) {
    console.error("Error testing Alex data:", error);
    showAlert("Error testing Alex data", "danger");
  }
}

async function verifyAllExistingUsers() {
  try {
    const response = await fetch(
      `${CONFIG.DEV_API_URL}/verify-all-existing-users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();
    showAlert(result.message, "success");
  } catch (error) {
    console.error("Error verifying users:", error);
    showAlert("Error verifying users", "danger");
  }
}

async function verifySingleUser() {
  const email = document.getElementById("dev-email").value.trim();

  if (!email) {
    showAlert("Please enter an email address", "warning");
    return;
  }

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/verify-existing-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    showAlert(result.message, "success");
  } catch (error) {
    console.error("Error verifying user:", error);
    showAlert("Error verifying user", "danger");
  }
}

async function migrateData() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/migrate-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    showAlert(result.message, "success");
  } catch (error) {
    console.error("Error migrating data:", error);
    showAlert("Error migrating data", "danger");
  }
}

async function forceMigrateData() {
  if (!confirm("This will reset all data. Are you sure?")) {
    return;
  }

  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/force-migrate-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    showAlert(result.message, "success");
  } catch (error) {
    console.error("Error force migrating data:", error);
    showAlert("Error force migrating data", "danger");
  }
}
