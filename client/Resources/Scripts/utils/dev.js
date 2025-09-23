// Development Helper Functions
function addDevelopmentHelper() {
  // Add development panel to the page
  const devPanel = document.createElement("div");
  devPanel.id = "dev-panel";
  devPanel.innerHTML = `
    <div style="position: fixed; bottom: 10px; right: 10px; background: #ffeb3b; border: 3px solid #ff9800; border-radius: 8px; padding: 15px; z-index: 9999; font-size: 14px; max-width: 350px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
      <h6 style="margin: 0 0 10px 0; color: #495057;">🔧 Development Helper</h6>
      <div style="margin-bottom: 10px;">
        <button onclick="verifyAllExistingUsers()" class="btn btn-sm btn-primary" style="margin-right: 5px;">Verify All Users</button>
        <button onclick="showExistingUsers()" class="btn btn-sm btn-info" style="margin-right: 5px;">Show Users</button>
        <button onclick="forceRemigrateData()" class="btn btn-sm btn-warning" style="margin-right: 5px;">Force Remigrate</button>
        <button onclick="clearContactedSellers()" class="btn btn-sm btn-danger" style="margin-right: 5px;">Clear Contacted</button>
        <button onclick="signInAsAlex()" class="btn btn-sm btn-success">Sign In as Alex</button>
      </div>
      <div style="margin-bottom: 10px;">
            <button onclick="testAlexData()" class="btn btn-sm btn-info" style="width: 100%; margin-bottom: 5px;">Test Alex Data</button>
            <button onclick="forceAlexData()" class="btn btn-sm btn-warning" style="width: 100%; margin-bottom: 5px;">Force Alex Data</button>
        <input type="email" id="dev-email" placeholder="Enter email to verify" style="width: 100%; margin-bottom: 5px; padding: 2px 5px; font-size: 11px;">
        <button onclick="verifySingleUser()" class="btn btn-sm btn-success" style="width: 100%;">Verify This User</button>
      </div>
    </div>
  `;

  document.body.appendChild(devPanel);
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

    if (response.ok) {
      showAlert(`✅ ${result.message}`, "success");
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error verifying all users:", error);
    showAlert("❌ Failed to verify users", "danger");
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

    if (response.ok) {
      showAlert(`✅ User ${email} verified successfully`, "success");
      document.getElementById("dev-email").value = "";
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    showAlert("❌ Failed to verify user", "danger");
  }
}

async function signInAsAlex() {
  try {
    console.log("Signing in as Alex Johnson...");

    // First verify Alex Johnson
    const verifyResponse = await fetch(
      `${CONFIG.DEV_API_URL}/verify-existing-user`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alex.johnson@ua.edu" }),
      }
    );

    if (!verifyResponse.ok) {
      const errorResult = await verifyResponse.json();
      throw new Error(errorResult.message || "Failed to verify Alex Johnson");
    }

    console.log("Alex Johnson verified successfully");

    // Now get a fresh JWT token using the dev login endpoint
    const loginResponse = await fetch(`${CONFIG.DEV_API_URL}/dev-login-alex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!loginResponse.ok) {
      const errorResult = await loginResponse.json();
      throw new Error(errorResult.message || "Failed to get JWT token");
    }

    const loginResult = await loginResponse.json();

    // Store the JWT token
    localStorage.setItem("authToken", loginResult.token);
    localStorage.setItem("currentUser", JSON.stringify(loginResult.user));

    console.log("Alex Johnson signed in successfully");
    showAlert("✅ Signed in as Alex Johnson successfully!", "success");

    // Refresh the page to load the authenticated state
    window.location.reload();
  } catch (error) {
    console.error("Failed to sign in as Alex:", error);
    showAlert(`❌ Failed to sign in as Alex: ${error.message}`, "danger");
  }
}

async function testAlexData() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/test-alex-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok) {
      const data = result;
      const content = `
          <div class="alex-data-test">
            <h6><strong>Alex Johnson Data Test Results:</strong></h6>
            <div class="mb-2">
              <strong>User:</strong> ${data.alexUser.firstName} ${
        data.alexUser.lastName
      } (${data.alexUser.email})
            </div>
            <div class="mb-2">
              <strong>Books:</strong> ${data.booksCount} books
              <ul class="mb-1">
                ${data.books
                  .map((b) => `<li>${b.title} - $${b.price}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="mb-2">
              <strong>Notifications:</strong> ${
                data.notificationsCount
              } notifications
              <ul class="mb-1">
                ${data.notifications
                  .map((n) => `<li>${n.message} (Read: ${n.isRead})</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="mb-2">
              <strong>Ratings FOR Alex:</strong> ${
                data.ratingsForAlexCount
              } ratings
              <ul class="mb-1">
                ${data.ratingsForAlex
                  .map((r) => `<li>${r.score}/5 stars - "${r.comment}"</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="mb-2">
              <strong>Ratings BY Alex:</strong> ${
                data.ratingsByAlexCount
              } ratings
              <ul class="mb-1">
                ${data.ratingsByAlex
                  .map((r) => `<li>${r.score}/5 stars - "${r.comment}"</li>`)
                  .join("")}
              </ul>
            </div>
          </div>
        `;

      showPersistentModal("Alex Johnson Data Test", content);
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error testing Alex data:", error);
    showAlert("❌ Failed to test Alex data", "danger");
  }
}

async function forceAlexData() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/force-alex-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(`✅ ${result.message}`, "success");
      // Auto-test the data after forcing recreation
      setTimeout(() => {
        testAlexData();
      }, 1000);
    } else {
      showAlert(`❌ ${result.message}`, "danger");
    }
  } catch (error) {
    console.error("Error forcing Alex data:", error);
    showAlert("❌ Failed to force Alex data", "danger");
  }
}

async function showExistingUsers() {
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/existing-users`);
    const users = await response.json();

    if (response.ok) {
      // Separate admin and regular users
      const adminEmails = ["ccsmith33@crimson.ua.edu", "dev@crimson.ua.edu"];
      const adminUsers = users.filter((u) => adminEmails.includes(u.email));
      const regularUsers = users.filter((u) => !adminEmails.includes(u.email));

      // Format admin users with special styling
      const adminList = adminUsers
        .map(
          (u) =>
            `👑 <strong>${u.email}</strong> (${u.firstName} ${u.lastName}) - <span class="text-danger">ADMIN</span>`
        )
        .join("<br>");

      // Format regular users
      const regularList = regularUsers
        .map((u) => `${u.email} (${u.firstName} ${u.lastName})`)
        .join("<br>");

      // Combine admin and regular users
      const fullUserList =
        adminList + (adminList && regularList ? "<br><br>" : "") + regularList;

      // Create a persistent modal instead of using showAlert
      showPersistentModal(
        "Existing Users",
        `<strong>Existing Users:</strong><br><br>${fullUserList}`
      );
    } else {
      showAlert("❌ Failed to load users", "danger");
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showAlert("❌ Failed to load users", "danger");
  }
}

function showPersistentModal(title, content) {
  console.log("Creating modal with title:", title);

  // Remove any existing dev modal
  const existingModal = document.getElementById("dev-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div class="modal fade" id="dev-modal" tabindex="-1" aria-labelledby="devModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="devModalLabel">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  console.log("Modal HTML added to body");

  // Show the modal
  const modalElement = document.getElementById("dev-modal");
  console.log("Modal element found:", modalElement);

  if (modalElement && typeof bootstrap !== "undefined") {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    console.log("Modal shown");
  } else {
    console.error("Bootstrap not available or modal element not found");
    // Fallback: just show the modal element
    if (modalElement) {
      modalElement.style.display = "block";
      modalElement.classList.add("show");
    }
  }
}

async function setupAlexJohnsonData() {
  let originalToken = null;
  try {
    console.log("Setting up Alex Johnson data...");

    // First, login as alex.johnson@ua.edu to get proper auth headers
    const loginResponse = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex.johnson@ua.edu",
        password: "password123", // Assuming default password
      }),
    });

    if (!loginResponse.ok) {
      console.warn(
        "Could not login as alex.johnson@ua.edu, using current auth"
      );
    } else {
      const loginResult = await loginResponse.json();
      // Store the token temporarily for this operation
      originalToken = localStorage.getItem("authToken");
      localStorage.setItem("authToken", loginResult.token);
    }

    // 1. Add AT LEAST 3 book entries for alex.johnson@ua.edu
    const alexBooks = [
      {
        title: "Introduction to Computer Science",
        author: "John Smith",
        isbn: "978-0123456789",
        price: 45.99,
        condition: "Good",
        description: "Used textbook with some highlighting",
        sellerEmail: "alex.johnson@ua.edu",
      },
      {
        title: "Data Structures and Algorithms",
        author: "Jane Doe",
        isbn: "978-0987654321",
        price: 65.5,
        condition: "Excellent",
        description: "Like new condition, no marks",
        sellerEmail: "alex.johnson@ua.edu",
      },
      {
        title: "Database Systems",
        author: "Bob Wilson",
        isbn: "978-1122334455",
        price: 55.0,
        condition: "Fair",
        description: "Some wear but all pages intact",
        sellerEmail: "alex.johnson@ua.edu",
      },
      {
        title: "Software Engineering Principles",
        author: "Alice Johnson",
        isbn: "978-1234567890",
        price: 75.0,
        condition: "Good",
        description: "Well-maintained textbook with minimal wear",
        sellerEmail: "alex.johnson@ua.edu",
      },
      {
        title: "Machine Learning Fundamentals",
        author: "David Brown",
        isbn: "978-2345678901",
        price: 85.0,
        condition: "Excellent",
        description: "Brand new condition, never used",
        sellerEmail: "alex.johnson@ua.edu",
      },
    ];

    let booksCreated = 0;
    for (const book of alexBooks) {
      try {
        const bookResponse = await fetch(`${CONFIG.API_BASE_URL}/books`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(book),
        });
        if (bookResponse.ok) {
          booksCreated++;
          console.log(`✅ Created book: ${book.title}`);
        } else {
          console.warn(`❌ Failed to create book: ${book.title}`);
        }
      } catch (error) {
        console.warn(`❌ Error creating book ${book.title}:`, error);
      }
    }

    // 2. Add 6+ notifications for alex.johnson@ua.edu
    const notifications = [
      "New book listing: 'Introduction to Computer Science' is now available",
      "Book inquiry: Someone is interested in your 'Data Structures' textbook",
      "Rating received: You got 5 stars for your 'Database Systems' book",
      "Price update: Consider adjusting your book prices for better visibility",
      "Weekly summary: 5 books listed, 2 inquiries received",
      "Reminder: Update your book descriptions for better sales",
      "New message: Buyer interested in 'Machine Learning' textbook",
      "System: Your book 'Software Engineering' has been viewed 15 times",
    ];

    let notificationsCreated = 0;
    for (const message of notifications) {
      try {
        const notifResponse = await fetch(
          `${CONFIG.API_BASE_URL}/notifications`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              userId: "alex.johnson@ua.edu",
              message: message,
              type: "info",
            }),
          }
        );
        if (notifResponse.ok) {
          notificationsCreated++;
        } else {
          console.warn(`❌ Failed to create notification: ${message}`);
        }
      } catch (error) {
        console.warn(`❌ Error creating notification:`, error);
      }
    }

    // 3. Add AT LEAST 3 ratings from alex.johnson@ua.edu
    const alexRatings = [
      {
        ratedUserId: "sarah.williams@ua.edu",
        bookId: 1,
        score: 5,
        comment:
          "Great seller! Book was exactly as described and shipped quickly.",
      },
      {
        ratedUserId: "ccsmith33@crimson.ua.edu",
        bookId: 2,
        score: 4,
        comment: "Good condition book, fair price. Would buy again.",
      },
      {
        ratedUserId: "sarah.williams@ua.edu",
        bookId: 3,
        score: 5,
        comment: "Excellent communication and fast delivery. Highly recommend!",
      },
      {
        ratedUserId: "ccsmith33@crimson.ua.edu",
        bookId: 4,
        score: 3,
        comment: "Book was okay, some highlighting as described.",
      },
    ];

    let ratingsCreated = 0;
    for (const rating of alexRatings) {
      try {
        await submitRating(
          rating.ratedUserId,
          rating.bookId,
          rating.score,
          rating.comment
        );
        ratingsCreated++;
        console.log(`✅ Created rating for user ${rating.ratedUserId}`);
      } catch (error) {
        console.warn(`❌ Error creating rating:`, error);
      }
    }

    console.log(`Alex Johnson data setup complete!`);
    console.log(`📚 Books created: ${booksCreated}/${alexBooks.length}`);
    console.log(
      `🔔 Notifications created: ${notificationsCreated}/${notifications.length}`
    );
    console.log(`⭐ Ratings created: ${ratingsCreated}/${alexRatings.length}`);

    // Show summary alert
    showAlert(
      `Alex Johnson setup complete! Books: ${booksCreated}, Notifications: ${notificationsCreated}, Ratings: ${ratingsCreated}`,
      "success"
    );
  } catch (error) {
    console.error("Error setting up Alex Johnson data:", error);
    showAlert(
      "❌ Error setting up Alex Johnson data: " + error.message,
      "danger"
    );
  } finally {
    // Restore original auth token if we changed it
    if (originalToken !== null) {
      localStorage.setItem("authToken", originalToken);
    }
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
