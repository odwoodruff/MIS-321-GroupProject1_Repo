function showVerificationModal(email, verificationCode = null) {
  // Hide login modal
  bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();

  // Create verification modal
  const modalHtml = `
    <div class="modal fade" id="verificationModal" tabindex="-1" aria-labelledby="verificationModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="verificationModalLabel">Verify Your Email</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>We've sent a 6-digit verification code to <strong>${email}</strong></p>
            ${
              verificationCode
                ? `
              <div class="alert alert-info">
                <strong>Development Mode:</strong> Your verification code is <code>${verificationCode}</code>
              </div>
            `
                : ""
            }
              <div class="mb-3">
                <label for="verificationCode" class="form-label">Verification Code</label>
                <input type="text" class="form-control" id="verificationCode" 
                       placeholder="Enter 6-digit code" maxlength="6" pattern="[0-9]{6}">
              </div>
            <div class="text-center">
              <button type="button" class="btn btn-outline-secondary" onclick="resendVerificationCode('${email}')">
                Resend Code
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="verifyEmailCode('${email}')">Verify</button>
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

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("verificationModal")
  );
  modal.show();
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

async function showRatingModal(bookId, sellerName, sellerEmail) {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Check if user has contacted this seller for this specific book
  const contactKey = `${currentUser.email}-${sellerEmail}-${bookId}`;
  if (!contactedSellers.has(contactKey)) {
    showAlert(
      "You must contact the seller first before you can rate them",
      "warning"
    );
    return;
  }

  // Get the seller's user ID by looking up their email
  const sellerUserId = await getUserIdByEmail(sellerEmail);

  if (!sellerUserId) {
    showAlert("Cannot rate this seller - seller account not found", "warning");
    return;
  }

  const modalHTML = `
    <div class="modal fade" id="ratingModal" tabindex="-1" aria-labelledby="ratingModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ratingModalLabel">Rate ${sellerName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="ratingForm">
              <div class="mb-3">
                <label class="form-label">Rating (1-5 stars)</label>
                <div class="rating-input">
                  <div class="star-rating" id="starRating">
                    <i class="bi bi-star" data-rating="1"></i>
                    <i class="bi bi-star" data-rating="2"></i>
                    <i class="bi bi-star" data-rating="3"></i>
                    <i class="bi bi-star" data-rating="4"></i>
                    <i class="bi bi-star" data-rating="5"></i>
                  </div>
                  <input type="hidden" id="ratingScore" value="0">
                </div>
              </div>
              <div class="mb-3">
                <label for="ratingComment" class="form-label">Comment (optional)</label>
                <textarea class="form-control" id="ratingComment" rows="3" placeholder="Share your experience..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="handleRatingSubmit(${bookId}, ${sellerUserId})">Submit Rating</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("ratingModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("ratingModal"));
  modal.show();

  // Setup star rating interaction
  setupStarRating();
}

function showAdminRatingModal(rating) {
  console.log("showAdminRatingModal called with:", rating); // Debug log

  // Ensure we have valid rating data
  const safeRating = {
    id: rating.id || 0,
    score: rating.score || 1,
    comment: rating.comment || "",
    raterId: rating.raterId || 0,
    ratedUserId: rating.ratedUserId || 0,
    bookId: rating.bookId || 0,
    dateCreated: rating.dateCreated || new Date().toISOString(),
  };

  console.log("Safe rating data:", safeRating); // Debug log

  const modalHTML = `
    <div class="modal fade" id="adminRatingModal" tabindex="-1" aria-labelledby="adminRatingModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="adminRatingModalLabel">Edit Rating (Admin)</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="adminRatingForm">
              <div class="mb-3">
                <label class="form-label">Rating (1-5 stars)</label>
                <div class="rating-input">
                  <div class="star-rating" id="adminStarRating">
                    <i class="bi bi-star" data-rating="1"></i>
                    <i class="bi bi-star" data-rating="2"></i>
                    <i class="bi bi-star" data-rating="3"></i>
                    <i class="bi bi-star" data-rating="4"></i>
                    <i class="bi bi-star" data-rating="5"></i>
                  </div>
                  <input type="hidden" id="adminRatingScore" value="${
                    safeRating.score
                  }">
                </div>
              </div>
              <div class="mb-3">
                <label for="adminRatingComment" class="form-label">Comment</label>
                <textarea class="form-control" id="adminRatingComment" rows="3">${
                  safeRating.comment
                }</textarea>
              </div>
              <div class="mb-3">
                <small class="text-muted">
                  <strong>Rater:</strong> User ID ${safeRating.raterId}<br>
                  <strong>Rated User:</strong> User ID ${
                    safeRating.ratedUserId
                  }<br>
                  <strong>Book ID:</strong> ${safeRating.bookId}<br>
                  <strong>Date:</strong> ${new Date(
                    safeRating.dateCreated
                  ).toLocaleString()}
                </small>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="handleAdminRatingSubmit(${
              safeRating.id
            })">Update Rating</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("adminRatingModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("adminRatingModal")
  );
  modal.show();

  // Setup star rating interaction
  setupAdminStarRating(safeRating.score);
}

async function showRatingPromptModal(book) {
  const modalHTML = `
    <div class="modal fade" id="ratingPromptModal" tabindex="-1" aria-labelledby="ratingPromptModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ratingPromptModalLabel">Thank You!</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <div class="mb-3">
              <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
            </div>
            <h4 class="mb-3">Interest sent to ${escapeHtml(
              book.sellerName
            )}!</h4>
            <p class="mb-4">They'll be notified about your interest in "${escapeHtml(
              book.title
            )}".</p>
            <p class="mb-4">Would you like to rate this seller now?</p>
          </div>
          <div class="modal-footer justify-content-center">
            <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">
              <i class="bi bi-x-circle"></i> Not Now
            </button>
            <button type="button" class="btn btn-warning" onclick="proceedToRating(${
              book.id
            }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
    book.sellerEmail
  )}')">
              <i class="bi bi-star"></i> Yes, Rate Now
            </button>
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

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Track that user has been prompted to rate this book via API
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
      promptedToRate.add(`${currentUser.email}-${book.sellerEmail}-${book.id}`);
      console.log("Added prompted to rate via API");
    } else {
      console.warn("Failed to add prompted to rate via API");
      // Fallback to local set
      promptedToRate.add(`${currentUser.email}-${book.sellerEmail}-${book.id}`);
    }
  } catch (error) {
    console.error("Error adding prompted to rate:", error);
    // Fallback to local set
    promptedToRate.add(`${currentUser.email}-${book.sellerEmail}-${book.id}`);
  }

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("ratingPromptModal")
  );
  modal.show();

  // Re-render to show the contacted button and rate button if prompted
  renderApp();
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

function createLoginModal() {
  // Check if login modal already exists
  if (document.getElementById("loginModal")) {
    return;
  }

  const modalHTML = `
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="loginModalLabel">Sign In to Roll Tide Books</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="loginForm">
              <div class="mb-3">
                <label for="loginEmail" class="form-label">University Email Address</label>
                <input type="email" class="form-control" id="loginEmail" 
                       placeholder="your.email@crimson.ua.edu" required>
                <div class="form-text">
                  Use your @crimson.ua.edu or @ua.edu email address
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="loginBtn">Sign In</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to the login modal container
  const container = document.getElementById("loginModalContainer");
  if (container) {
    container.innerHTML = modalHTML;
  } else {
    // Fallback: add to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}
