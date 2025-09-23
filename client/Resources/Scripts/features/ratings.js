// Rating-related functions

async function loadRatings() {
  try {
    if (!currentUser) return;

    if (isAdmin()) {
      await loadAllRatings();
    } else {
      // Load user-specific ratings for regular users
      await loadMyRatings();
    }
  } catch (error) {
    console.error("Error loading ratings:", error);
    ratings = [];
  }
}

async function loadMyRatings() {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/ratings-for-me`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      ratings = await response.json();
    } else {
      console.error("Failed to load my ratings:", response.status);
      ratings = [];
    }
  } catch (error) {
    console.error("Error loading my ratings:", error);
    ratings = [];
  }
}

async function loadAllRatings() {
  try {
    const response = await fetch(`${CONFIG.RATING_API_URL}/ratings/all`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      ratings = await response.json();
    } else {
      console.error("Failed to load all ratings:", response.status);
      ratings = [];
    }
  } catch (error) {
    console.error("Error loading all ratings:", error);
    ratings = [];
  }
}

function renderRatingsInAdminPanel() {
  const ratingsList = document.getElementById("ratingsList");
  if (!ratingsList) return;

  if (ratings.length === 0) {
    ratingsList.innerHTML = "<p class='text-muted'>No ratings found.</p>";
    return;
  }

  ratingsList.innerHTML = ratings
    .map((rating) => {
      const stars = generateStarRating(rating.score);
      return `
        <div class="rating-item border rounded p-3 mb-3">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-1">${escapeHtml(rating.raterName || "Unknown")}</h6>
              <div class="mb-2">${stars}</div>
              <p class="mb-1 text-muted small">
                Rated: ${escapeHtml(rating.sellerName || "Unknown")}
              </p>
              <p class="mb-1 text-muted small">
                Book: ${escapeHtml(rating.bookTitle || "Unknown")}
              </p>
              ${
                rating.comment
                  ? `<p class="mb-1">${escapeHtml(rating.comment)}</p>`
                  : ""
              }
              <small class="text-muted">
                ${new Date(rating.dateCreated).toLocaleString()}
              </small>
            </div>
            <div class="rating-actions">
              <button class="btn btn-sm btn-outline-primary" onclick="showAdminRatingModal(${
                rating.id
              })">
                <i class="bi bi-eye"></i> View
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteRating(${
                rating.id
              })">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function submitRating(ratedUserId, bookId, score, comment = "") {
  try {
    const response = await fetch(`${CONFIG.RATING_API_URL}/ratings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ratedUserId: ratedUserId,
        bookId: bookId,
        score: score,
        comment: comment,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Rating submitted successfully:", result);

      // Add to local ratings
      ratings.push(result);

      // Mark as rated locally
      const book = books.find((b) => b.id === bookId);
      if (book) {
        ratedBooks.add(`${currentUser.email}-${book.sellerEmail}-${bookId}`);
      }

      showAlert("Rating submitted successfully!", "success");
      return result;
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Failed to submit rating", "danger");
      return null;
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    showAlert("Failed to submit rating", "danger");
    return null;
  }
}

async function showRatingModal(bookId, sellerName, sellerEmail) {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  // Get the seller's user ID
  const sellerUserId = await getUserIdByEmail(sellerEmail);
  if (!sellerUserId) {
    showAlert("Could not find seller information", "danger");
    return;
  }

  const modalHtml = `
    <div class="modal fade" id="ratingModal" tabindex="-1" aria-labelledby="ratingModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ratingModalLabel">Rate ${escapeHtml(
              sellerName
            )}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="ratingForm">
              <div class="mb-3">
                <label class="form-label">Rating</label>
                <div id="starRating" class="star-rating">
                  <i class="bi bi-star" data-rating="1"></i>
                  <i class="bi bi-star" data-rating="2"></i>
                  <i class="bi bi-star" data-rating="3"></i>
                  <i class="bi bi-star" data-rating="4"></i>
                  <i class="bi bi-star" data-rating="5"></i>
                </div>
                <input type="hidden" id="ratingScore" value="0" required>
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

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Setup star rating
  setupStarRating();

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("ratingModal"));
  modal.show();
}

function setupStarRating() {
  const stars = document.querySelectorAll("#starRating .bi-star");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      document.getElementById("ratingScore").value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-warning";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-warning";
        }
      });
    });
  });

  // Reset stars on mouse leave
  document.getElementById("starRating").addEventListener("mouseleave", () => {
    const currentRating =
      parseInt(document.getElementById("ratingScore").value) || 0;
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.className = "bi bi-star-fill text-warning";
      } else {
        s.className = "bi bi-star text-warning";
      }
    });
  });
}

async function handleRatingSubmit(bookId, sellerUserId) {
  const score = parseInt(document.getElementById("ratingScore").value);
  const comment = document.getElementById("ratingComment").value.trim();

  if (score < 1 || score > 5) {
    showAlert("Please select a rating between 1 and 5 stars", "warning");
    return;
  }

  try {
    const result = await submitRating(sellerUserId, bookId, score, comment);
    if (result) {
      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("ratingModal")
      );
      if (modal) {
        modal.hide();
      }

      // Update UI
      renderApp();
    }
  } catch (error) {
    console.error("Error handling rating submit:", error);
    showAlert("Failed to submit rating", "danger");
  }
}

function renderStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let stars = "";

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill text-warning"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="bi bi-star-half text-warning"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star text-warning"></i>';
  }

  return stars;
}

async function updateRating(ratingId, score, comment = "") {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/${ratingId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: score,
          comment: comment,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log("Rating updated successfully:", result);

      // Update local ratings
      const ratingIndex = ratings.findIndex((r) => r.id === ratingId);
      if (ratingIndex !== -1) {
        ratings[ratingIndex] = result;
      }

      showAlert("Rating updated successfully!", "success");
      return result;
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Failed to update rating", "danger");
      return null;
    }
  } catch (error) {
    console.error("Error updating rating:", error);
    showAlert("Failed to update rating", "danger");
    return null;
  }
}

async function deleteRating(ratingId) {
  try {
    const response = await fetch(
      `${CONFIG.RATING_API_URL}/ratings/${ratingId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      console.log("Rating deleted successfully");

      // Remove from local ratings
      ratings = ratings.filter((r) => r.id !== ratingId);

      showAlert("Rating deleted successfully!", "success");
      return true;
    } else {
      const errorData = await response.json();
      showAlert(errorData.message || "Failed to delete rating", "danger");
      return false;
    }
  } catch (error) {
    console.error("Error deleting rating:", error);
    showAlert("Failed to delete rating", "danger");
    return false;
  }
}

function showAdminRatingModal(rating) {
  console.log("showAdminRatingModal called with:", rating); // Debug log
  const modalHtml = `
    <div class="modal fade" id="adminRatingModal" tabindex="-1" aria-labelledby="adminRatingModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="adminRatingModalLabel">Rating Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <h6>Rater Information</h6>
                <p><strong>Name:</strong> ${escapeHtml(
                  rating.raterName || "Unknown"
                )}</p>
                <p><strong>Email:</strong> ${escapeHtml(
                  rating.raterEmail || "Unknown"
                )}</p>
              </div>
              <div class="col-md-6">
                <h6>Seller Information</h6>
                <p><strong>Name:</strong> ${escapeHtml(
                  rating.sellerName || "Unknown"
                )}</p>
                <p><strong>Email:</strong> ${escapeHtml(
                  rating.sellerEmail || "Unknown"
                )}</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-md-6">
                <h6>Book Information</h6>
                <p><strong>Title:</strong> ${escapeHtml(
                  rating.bookTitle || "Unknown"
                )}</p>
                <p><strong>Author:</strong> ${escapeHtml(
                  rating.bookAuthor || "Unknown"
                )}</p>
              </div>
              <div class="col-md-6">
                <h6>Rating Details</h6>
                <p><strong>Score:</strong> ${rating.score}/5</p>
                <p><strong>Date:</strong> ${new Date(
                  rating.dateCreated
                ).toLocaleString()}</p>
              </div>
            </div>
            ${
              rating.comment
                ? `
              <div class="row mt-3">
                <div class="col-12">
                  <h6>Comment</h6>
                  <p class="border rounded p-3">${escapeHtml(
                    rating.comment
                  )}</p>
                </div>
              </div>
            `
                : ""
            }
            <div class="row mt-3">
              <div class="col-12">
                <h6>Edit Rating</h6>
                <form id="adminRatingForm">
                  <div class="mb-3">
                    <label class="form-label">Rating</label>
                    <div id="adminStarRating" class="star-rating">
                      <i class="bi bi-star" data-rating="1"></i>
                      <i class="bi bi-star" data-rating="2"></i>
                      <i class="bi bi-star" data-rating="3"></i>
                      <i class="bi bi-star" data-rating="4"></i>
                      <i class="bi bi-star" data-rating="5"></i>
                    </div>
                    <input type="hidden" id="adminRatingScore" value="${
                      rating.score
                    }" required>
                  </div>
                  <div class="mb-3">
                    <label for="adminRatingComment" class="form-label">Comment</label>
                    <textarea class="form-control" id="adminRatingComment" rows="3">${escapeHtml(
                      rating.comment || ""
                    )}</textarea>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" onclick="handleAdminRatingSubmit(${
              rating.id
            })">Update Rating</button>
            <button type="button" class="btn btn-danger" onclick="deleteRating(${
              rating.id
            })">Delete Rating</button>
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

  // Add modal to DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Setup admin star rating
  setupAdminStarRating(rating.score);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("adminRatingModal")
  );
  modal.show();
}

function setupAdminStarRating(currentScore) {
  const stars = document.querySelectorAll("#adminStarRating .bi-star");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const rating = index + 1;
      document.getElementById("adminRatingScore").value = rating;

      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-warning";
        }
      });
    });

    star.addEventListener("mouseenter", () => {
      const rating = index + 1;
      stars.forEach((s, i) => {
        if (i < rating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-warning";
        }
      });
    });
  });

  // Reset stars on mouse leave
  document
    .getElementById("adminStarRating")
    .addEventListener("mouseleave", () => {
      const currentRating =
        parseInt(document.getElementById("adminRatingScore").value) || 0;
      stars.forEach((s, i) => {
        if (i < currentRating) {
          s.className = "bi bi-star-fill text-warning";
        } else {
          s.className = "bi bi-star text-warning";
        }
      });
    });

  // Set initial rating
  stars.forEach((s, i) => {
    if (i < currentScore) {
      s.className = "bi bi-star-fill text-warning";
    } else {
      s.className = "bi bi-star text-warning";
    }
  });
}

async function handleAdminRatingSubmit(ratingId) {
  const score = parseInt(document.getElementById("adminRatingScore").value);
  const comment = document.getElementById("adminRatingComment").value.trim();

  if (score < 1 || score > 5) {
    showAlert("Please select a rating between 1 and 5 stars", "warning");
    return;
  }

  try {
    const result = await updateRating(ratingId, score, comment);
    if (result) {
      // Close modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("adminRatingModal")
      );
      if (modal) {
        modal.hide();
      }

      // Update UI
      renderRatingsInAdminPanel();
    }
  } catch (error) {
    console.error("Error handling admin rating submit:", error);
    showAlert("Failed to update rating", "danger");
  }
}

function editRating(ratingId) {
  const rating = ratings.find((r) => r.id === ratingId);
  if (rating) {
    showAdminRatingModal(rating);
  }
}

async function createSampleRatings() {
  if (!isAdmin()) {
    showAlert("Only administrators can create sample ratings", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.DEV_API_URL}/create-sample-ratings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      showAlert(
        result.message || "Sample ratings created successfully!",
        "success"
      );

      // Reload ratings
      await loadRatings();
      renderRatingsInAdminPanel();
    } else {
      const errorData = await response.json();
      showAlert(
        errorData.message || "Failed to create sample ratings",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error creating sample ratings:", error);
    showAlert("Failed to create sample ratings", "danger");
  }
}

// My Ratings page functions
async function showMyRatings() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "myRatings");
  renderMyRatingsPage();
}

function renderMyRatingsPage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>My Ratings</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <div class="ratings-list">
            ${
              ratings.length === 0
                ? `
              <div class="text-center mt-5">
                <h4>No ratings yet</h4>
                <p>You haven't received any ratings yet. Keep selling books to get reviews!</p>
              </div>
            `
                : ratings
                    .map(
                      (rating) => `
              <div class="rating-item border rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <h6 class="mb-1">${escapeHtml(
                      rating.raterName || "Unknown"
                    )}</h6>
                    <div class="mb-2">${generateStarRating(rating.score)}</div>
                    <p class="mb-1 text-muted small">
                      Book: ${escapeHtml(rating.bookTitle || "Unknown")}
                    </p>
                    ${
                      rating.comment
                        ? `<p class="mb-1">${escapeHtml(rating.comment)}</p>`
                        : ""
                    }
                    <small class="text-muted">
                      ${new Date(rating.dateCreated).toLocaleString()}
                    </small>
                  </div>
                </div>
              </div>
            `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;

  updateNavigationState("myRatings");
}

function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let stars = "";

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill text-warning"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="bi bi-star-half text-warning"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star text-warning"></i>';
  }

  return stars;
}
