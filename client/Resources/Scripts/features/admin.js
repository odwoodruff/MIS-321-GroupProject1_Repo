function editRating(ratingId) {
  const rating = ratings.find((r) => r.id === ratingId);
  if (rating) {
    console.log("Editing rating:", rating); // Debug log
    showAdminRatingModal(rating);
  } else {
    showAlert("Rating not found", "danger");
  }
}

async function createSampleRatings() {
  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  try {
    // First, clear all existing ratings to avoid conflicts
    const clearResponse = await fetch(
      `${CONFIG.API_BASE_URL}/Dev/clear-all-ratings`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!clearResponse.ok) {
      console.warn("Could not clear existing ratings, continuing anyway...");
    }

    // Using dummy user IDs (1000-1999 range) to avoid conflicts with real users

    // Create dummy users and get their actual assigned IDs
    const dummyUserData = [
      {
        username: "dummy_user_1",
        email: "dummy1@example.com",
        firstName: "Dummy",
        lastName: "User1",
      },
      {
        username: "dummy_user_2",
        email: "dummy2@example.com",
        firstName: "Dummy",
        lastName: "User2",
      },
      {
        username: "dummy_user_3",
        email: "dummy3@example.com",
        firstName: "Dummy",
        lastName: "User3",
      },
      {
        username: "dummy_user_4",
        email: "dummy4@example.com",
        firstName: "Dummy",
        lastName: "User4",
      },
      {
        username: "dummy_user_5",
        email: "dummy5@example.com",
        firstName: "Dummy",
        lastName: "User5",
      },
    ];

    const dummyUserIds = [];

    // Create dummy users and collect their actual IDs
    for (const userData of dummyUserData) {
      const createUserResponse = await fetch(
        `${CONFIG.API_BASE_URL}/Dev/create-dummy-user`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (createUserResponse.ok) {
        const result = await createUserResponse.json();
        dummyUserIds.push(result.userId);
        console.log(
          `Created dummy user: ${userData.username} with ID ${result.userId}`
        );
      } else {
        console.warn(
          `Could not create dummy user ${userData.username}, continuing...`
        );
      }
    }

    if (dummyUserIds.length < 2) {
      showAlert(
        "Could not create enough dummy users for sample ratings",
        "warning"
      );
      return;
    }
    const sampleRatings = [];
    const usedCombinations = new Set();

    // Generate 6 random ratings between dummy users
    for (let i = 0; i < 6; i++) {
      let raterId, ratedUserId, bookId;
      let combination;

      // Ensure we don't create duplicate combinations
      do {
        raterId = dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        ratedUserId =
          dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
        bookId = Math.floor(Math.random() * 5) + 1; // Books 1-5
        combination = `${raterId}-${ratedUserId}-${bookId}`;
      } while (raterId === ratedUserId || usedCombinations.has(combination));

      usedCombinations.add(combination);

      sampleRatings.push({
        ratedUserId: ratedUserId,
        bookId: bookId,
        score: Math.floor(Math.random() * 5) + 1, // 1-5 stars
        comment: [
          "Great seller, book was in excellent condition!",
          "Fast response and easy transaction.",
          "Book was okay, some highlighting as described.",
          "Perfect condition, would buy again!",
          "Good communication, book as described.",
          "Quick delivery, satisfied with purchase.",
        ][Math.floor(Math.random() * 6)],
      });
    }

    // Submit all sample ratings
    for (const ratingData of sampleRatings) {
      await submitRating(
        ratingData.ratedUserId,
        ratingData.bookId,
        ratingData.score,
        ratingData.comment
      );
    }

    // Reload ratings and refresh the page
    await loadAllRatings();
    renderAdminRatingManagement();
    showAlert("Sample ratings created successfully!", "success");
  } catch (error) {
    console.error("Error creating sample ratings:", error);
    showAlert("Failed to create sample ratings", "danger");
  }
}

// Admin Panel Functions
async function loadAllUsers() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Admin/users`,
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
    const usersList = document.getElementById("usersList");

    if (data.users && data.users.length > 0) {
      const usersTable = `
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
            ${data.users
              .map(
                (user) => `
              <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.averageRating.toFixed(1)} (${user.ratingCount})</td>
                <td>${new Date(user.dateCreated).toLocaleDateString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p class="text-muted">Total users: ${data.totalCount}</p>
      `;
      usersList.innerHTML = usersTable;
    } else {
      usersList.innerHTML = '<p class="text-muted">No users found</p>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("Failed to load users", "danger");
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

async function loadBackups() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/Backup/list`,
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
    const backupsList = document.getElementById("backupsList");

    if (data && data.length > 0) {
      const backupsTable = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Created Date</th>
              <th>File Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (backup) => `
              <tr>
                <td>${backup.fileName}</td>
                <td>${new Date(backup.createdDate).toLocaleString()}</td>
                <td>${(backup.fileSize / 1024).toFixed(1)} KB</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" onclick="downloadBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-download"></i> Download
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteBackup('${
                    backup.fileName
                  }')">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
      backupsList.innerHTML = backupsTable;
    } else {
      backupsList.innerHTML = '<p class="text-muted">No backups found</p>';
    }
  } catch (error) {
    console.error("Error loading backups:", error);
    showAlert("Failed to load backups", "danger");
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
