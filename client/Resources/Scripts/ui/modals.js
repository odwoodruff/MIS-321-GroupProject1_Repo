// Modal-related functions

function showAlert(message, type) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return;

  const alertId = `alert-${Date.now()}`;
  const alertHtml = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  alertContainer.insertAdjacentHTML("beforeend", alertHtml);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

function showLoginForm() {
  // Show the login modal
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

function showVerificationModal(email, verificationCode = null) {
  // Hide login modal
  const loginModal = bootstrap.Modal.getInstance(
    document.getElementById("loginModal")
  );
  if (loginModal) {
    loginModal.hide();
  }

  // Create verification modal
  const modalHtml = `
    <div class="modal fade" id="verificationModal" tabindex="-1" aria-labelledby="verificationModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="verificationModalLabel">Verify Your Email</h5>
          </div>
          <div class="modal-body">
            <p>We've sent a verification code to <strong>${escapeHtml(
              email
            )}</strong></p>
            <p>Please check your email and enter the 6-digit code below:</p>
            <form id="verificationForm">
              <div class="mb-3">
                <label for="verificationCode" class="form-label">Verification Code</label>
                <input type="text" class="form-control" id="verificationCode" 
                       placeholder="Enter 6-digit code" maxlength="6" required>
              </div>
              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-secondary" onclick="resendVerificationCode('${email}')">
                  Resend Code
                </button>
                <button type="button" class="btn btn-primary" onclick="verifyEmailCode('${email}')">
                  Verify Email
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("verificationModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("verificationModal")
  );
  modal.show();

  // Focus on input
  setTimeout(() => {
    const input = document.getElementById("verificationCode");
    if (input) {
      input.focus();
    }
  }, 500);
}

async function resendVerificationCode(email) {
  try {
    const response = await fetch(`${CONFIG.AUTH_API_URL}/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      showAlert("Verification code resent successfully!", "success");
    } else {
      const errorData = await response.json();
      showAlert(
        errorData.message || "Failed to resend verification code",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error resending verification code:", error);
    showAlert("Failed to resend verification code", "danger");
  }
}

function handleLogout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
  updateAuthUI();
  renderApp();
  showAlert("You have been logged out", "info");
}

// Contact seller modal
async function contactSeller(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    showAlert("Book not found", "danger");
    return;
  }

  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Check if user is trying to contact themselves
  if (book.sellerEmail === currentUser.email) {
    showAlert("You cannot contact yourself about your own book", "warning");
    return;
  }

  // Check if already contacted
  const contactKey = `${book.sellerEmail}-${bookId}`;
  if (contactedSellers.has(contactKey)) {
    showAlert("You have already contacted this seller", "info");
    return;
  }

  try {
    // Add to contacted sellers via API
    const response = await fetch(`${CONFIG.DEV_API_URL}/contacted-sellers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sellerEmail: book.sellerEmail,
        bookId: bookId,
      }),
    });

    if (response.ok) {
      // Add to local set
      contactedSellers.add(contactKey);

      // Show success message
      showAlert(
        `Contact request sent to ${book.sellerName}! They will be notified.`,
        "success"
      );

      // Show rating prompt modal after a short delay
      setTimeout(() => {
        showRatingPromptModal(book);
      }, 1500);
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Failed to contact seller", "danger");
    }
  } catch (error) {
    console.error("Error contacting seller:", error);
    showAlert("Failed to contact seller", "danger");
  }
}

async function showRatingPromptModal(book) {
  const modalHTML = `
    <div class="modal fade" id="ratingPromptModal" tabindex="-1" aria-labelledby="ratingPromptModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ratingPromptModalLabel">Rate Your Experience</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>How was your experience with <strong>${escapeHtml(
              book.sellerName
            )}</strong>?</p>
            <p class="text-muted">Your feedback helps other students make informed decisions.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-primary" onclick="proceedToRating(${
                book.id
              }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
    book.sellerEmail
  )}')">
                <i class="bi bi-star"></i> Rate Now
              </button>
              <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("ratingPromptModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("ratingPromptModal")
  );
  modal.show();

  // Add to prompted to rate
  try {
    const response = await fetch(`${CONFIG.DEV_API_URL}/prompted-to-rate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sellerEmail: book.sellerEmail,
        bookId: book.id,
      }),
    });

    if (response.ok) {
      promptedToRate.add(`${book.sellerEmail}-${book.id}`);
    }
  } catch (error) {
    console.error("Error adding prompted to rate:", error);
  }
}

function proceedToRating(bookId, sellerName, sellerEmail) {
  // Close the prompt modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("ratingPromptModal")
  );
  if (modal) {
    modal.hide();
  }

  // Show the rating modal
  showRatingModal(bookId, sellerName, sellerEmail);
}

// Profile page functions
async function showProfile() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "profile");
  renderProfilePage();
}

function renderProfilePage() {
  const app = document.getElementById("app");

  if (!currentUser) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row justify-content-center">
          <div class="col-md-6 text-center">
            <h2>Authentication Required</h2>
            <p>Please sign in to view your profile.</p>
            <button class="btn btn-primary" onclick="showLoginForm()">Sign In</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Calculate average rating
  const userRatings = ratings.filter(
    (r) => r.sellerEmail === currentUser.email
  );
  const averageRating =
    userRatings.length > 0
      ? userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length
      : 0;

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>My Profile</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <div class="row">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body text-center">
                  <div class="profile-avatar mb-3">
                    <i class="bi bi-person-circle" style="font-size: 4rem; color: #6c757d;"></i>
                  </div>
                  <h5>${escapeHtml(
                    currentUser.firstName || "Student"
                  )} ${escapeHtml(currentUser.lastName || "User")}</h5>
                  <p class="text-muted">${escapeHtml(currentUser.email)}</p>
                  <div class="rating-display mb-3">
                    ${
                      averageRating > 0
                        ? `
                      <div class="d-flex justify-content-center align-items-center">
                        <span class="me-2">${averageRating.toFixed(1)}</span>
                        <div class="star-rating">
                          ${generateStarRating(averageRating)}
                        </div>
                        <span class="ms-2 text-muted">(${
                          userRatings.length
                        } reviews)</span>
                      </div>
                    `
                        : `
                      <p class="text-muted">No ratings yet</p>
                    `
                    }
                  </div>
                  <button class="btn btn-outline-primary btn-sm" onclick="editProfile()">
                    <i class="bi bi-pencil"></i> Edit Profile
                  </button>
                </div>
              </div>
            </div>
            
            <div class="col-md-8">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">Personal Information</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-sm-6">
                      <p><strong>First Name:</strong> ${escapeHtml(
                        currentUser.firstName || "Not set"
                      )}</p>
                    </div>
                    <div class="col-sm-6">
                      <p><strong>Last Name:</strong> ${escapeHtml(
                        currentUser.lastName || "Not set"
                      )}</p>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-sm-6">
                      <p><strong>Email:</strong> ${escapeHtml(
                        currentUser.email
                      )}</p>
                    </div>
                    <div class="col-sm-6">
                      <p><strong>Username:</strong> ${escapeHtml(
                        currentUser.username || "Not set"
                      )}</p>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-sm-6">
                      <p><strong>Member Since:</strong> ${new Date(
                        currentUser.dateCreated
                      ).toLocaleDateString()}</p>
                    </div>
                    <div class="col-sm-6">
                      <p><strong>Account Type:</strong> ${
                        currentUser.isAdmin ? "Administrator" : "Student"
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card mt-3">
                <div class="card-header">
                  <h5 class="mb-0">Account Statistics</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-sm-4 text-center">
                      <h4 class="text-primary">${
                        books.filter((b) => b.sellerEmail === currentUser.email)
                          .length
                      }</h4>
                      <p class="text-muted">Books Listed</p>
                    </div>
                    <div class="col-sm-4 text-center">
                      <h4 class="text-success">${userRatings.length}</h4>
                      <p class="text-muted">Reviews Received</p>
                    </div>
                    <div class="col-sm-4 text-center">
                      <h4 class="text-info">${contactedSellers.size}</h4>
                      <p class="text-muted">Books Contacted</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card mt-3">
                <div class="card-header">
                  <h5 class="mb-0">Account Actions</h5>
                </div>
                <div class="card-body">
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary" onclick="showMyBooks()">
                      <i class="bi bi-book"></i> View My Books
                    </button>
                    <button class="btn btn-outline-info" onclick="showMyRatings()">
                      <i class="bi bi-star"></i> View My Ratings
                    </button>
                    <button class="btn btn-outline-warning" onclick="showContactedBooks()">
                      <i class="bi bi-envelope"></i> View Contacted Books
                    </button>
                    <button class="btn btn-outline-secondary" onclick="showNotifications()">
                      <i class="bi bi-bell"></i> View Notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  updateNavigationState("profile");
}

function editProfile() {
  // This would open a profile editing modal
  showAlert("Profile editing feature coming soon!", "info");
}
