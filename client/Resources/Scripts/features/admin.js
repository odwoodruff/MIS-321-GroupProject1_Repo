// Admin panel functions

// showAdminPanel is defined in navigation.js

function renderAdminPanel() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Admin Panel</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0">User Management</h5>
                </div>
                <div class="card-body">
                  <button class="btn btn-primary mb-2" onclick="loadAllUsers()">
                    <i class="bi bi-people"></i> Load All Users
                  </button>
                  <div id="usersList" class="mt-3">
                    <p class="text-muted">Click "Load All Users" to see user list</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0">Rating Management</h5>
                </div>
                <div class="card-body">
                  <button class="btn btn-primary mb-2" onclick="loadRatings(); renderRatingsInAdminPanel();">
                    <i class="bi bi-star"></i> Load All Ratings
                  </button>
                  <button class="btn btn-success mb-2" onclick="createSampleRatings()">
                    <i class="bi bi-plus-circle"></i> Create Sample Ratings
                  </button>
                  <div id="ratingsList" class="mt-3">
                    <p class="text-muted">Click "Load All Ratings" to see ratings list</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0">Data Management</h5>
                </div>
                <div class="card-body">
                  <button class="btn btn-warning mb-2" onclick="migrateData()">
                    <i class="bi bi-arrow-clockwise"></i> Migrate Data
                  </button>
                  <button class="btn btn-danger mb-2" onclick="forceMigrateData()">
                    <i class="bi bi-exclamation-triangle"></i> Force Migrate Data
                  </button>
                  <button class="btn btn-info mb-2" onclick="loadBackups()">
                    <i class="bi bi-archive"></i> Load Backups
                  </button>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header">
                  <h5 class="mb-0">System Information</h5>
                </div>
                <div class="card-body">
                  <p><strong>Total Books:</strong> ${books.length}</p>
                  <p><strong>Total Users:</strong> ${
                    currentUser ? "Loading..." : "Unknown"
                  }</p>
                  <p><strong>Total Ratings:</strong> ${ratings.length}</p>
                  <p><strong>Current User:</strong> ${
                    currentUser ? currentUser.email : "Not logged in"
                  }</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  updateNavigationState("admin");
}

async function loadAllUsers() {
  try {
    const users = await loadAllUsers();
    renderUsersList(users);
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Failed to load users", "danger");
  }
}

function renderUsersList(users) {
  const usersList = document.getElementById("usersList");
  if (!usersList) return;

  if (users.length === 0) {
    usersList.innerHTML = "<p class='text-muted'>No users found.</p>";
    return;
  }

  usersList.innerHTML = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Name</th>
            <th>Admin</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => `
            <tr>
              <td>${user.id}</td>
              <td>${escapeHtml(user.username || "N/A")}</td>
              <td>${escapeHtml(user.email)}</td>
              <td>${escapeHtml(user.firstName || "")} ${escapeHtml(
                user.lastName || ""
              )}</td>
              <td>${
                user.isAdmin
                  ? '<span class="badge bg-danger">Admin</span>'
                  : '<span class="badge bg-secondary">User</span>'
              }</td>
              <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadBackups() {
  try {
    const backups = await loadBackups();
    renderBackupsList(backups);
  } catch (error) {
    console.error("Error loading backups:", error);
    showAlert("Failed to load backups", "danger");
  }
}

function renderBackupsList(backups) {
  const backupsList = document.getElementById("backupsList");
  if (!backupsList) {
    // Create backups list if it doesn't exist
    const adminPanel = document.querySelector(".card-body");
    if (adminPanel) {
      adminPanel.insertAdjacentHTML(
        "beforeend",
        `
        <div id="backupsList" class="mt-3">
          <h6>Backups</h6>
          <p class="text-muted">Loading backups...</p>
        </div>
      `
      );
    }
  }

  if (backups.length === 0) {
    backupsList.innerHTML = "<p class='text-muted'>No backups found.</p>";
    return;
  }

  backupsList.innerHTML = `
    <div class="list-group">
      ${backups
        .map(
          (backup) => `
        <div class="list-group-item">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${escapeHtml(backup.filename || "Unknown")}</h6>
            <small>${new Date(backup.dateCreated).toLocaleString()}</small>
          </div>
          <p class="mb-1">Size: ${backup.size || "Unknown"}</p>
          <small>${escapeHtml(backup.description || "No description")}</small>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// Development function to clear contacted sellers for current user
function clearContactedSellers() {
  if (!currentUser) {
    showAlert("Please sign in first", "warning");
    return;
  }

  if (
    confirm(
      "Are you sure you want to clear all contacted sellers for the current user?"
    )
  ) {
    contactedSellers.clear();
    showAlert("Contacted sellers cleared", "success");
    renderApp();
  }
}

async function searchUserByUsername() {
  const username = document.getElementById("usernameSearch").value.trim();
  if (!username) {
    showAlert("Please enter a username to search", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/user-by-username/${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        showAlert("User not found", "warning");
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    const usersList = document.getElementById("usersList");

    const userTable = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Name</th>
            <th>Rating</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
            <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
          </tr>
        </tbody>
      </table>
    `;
    usersList.innerHTML = userTable;
  } catch (error) {
    console.error("Error searching user:", error);
    showAlert("Failed to search user", "danger");
  }
}

async function checkRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to check", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/rate-limit-status/${encodeURIComponent(identifier)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const statusDiv = document.getElementById("rateLimitStatus");

    const alertClass = data.isRateLimited ? "alert-danger" : "alert-success";
    statusDiv.className = `alert ${alertClass}`;
    statusDiv.innerHTML = `
      <h6>Rate Limit Status for: ${data.identifier}</h6>
      <p><strong>Is Rate Limited:</strong> ${
        data.isRateLimited ? "Yes" : "No"
      }</p>
      <p><strong>Remaining Requests:</strong> ${data.remainingRequests}</p>
    `;
  } catch (error) {
    console.error("Error checking rate limit:", error);
    showAlert("Failed to check rate limit status", "danger");
  }
}

async function resetRateLimit() {
  const identifier = document
    .getElementById("rateLimitIdentifier")
    .value.trim();
  if (!identifier) {
    showAlert("Please enter an identifier to reset", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Admin/reset-rate-limit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier,
          actionType: "general",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the rate limit status
    await checkRateLimit();
  } catch (error) {
    console.error("Error resetting rate limit:", error);
    showAlert("Failed to reset rate limit", "danger");
  }
}

async function createBackup() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/create`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error creating backup:", error);
    showAlert("Failed to create backup", "danger");
  }
}

async function downloadBackup(fileName) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Backup/download/${fileName}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading backup:", error);
    showAlert("Failed to download backup", "danger");
  }
}

async function deleteBackup(fileName) {
  if (!confirm(`Are you sure you want to delete backup "${fileName}"?`)) {
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/Backup/delete/${fileName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    showAlert(data.message, "success");

    // Refresh the backup list
    await loadBackups();
  } catch (error) {
    console.error("Error deleting backup:", error);
    showAlert("Failed to delete backup", "danger");
  }
}

async function forceRemigrateData() {
  if (!confirm("This will delete ALL data and recreate it. Are you sure?")) {
    return;
  }

  try {
    showAlert("🔄 Force remigrating data...", "info");

    const response = await fetch(`${CONFIG.DEV_API_URL}/force-remigrate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(`✅ ${result.message}`, "success");

      // Add specific data for alex.johnson@ua.edu
      console.log("Starting Alex Johnson data setup...");
      await setupAlexJohnsonData();
      console.log("Alex Johnson data setup completed.");

      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error force remigrating:", error);
    showAlert("❌ Failed to force remigrate data", "danger");
  }
}
