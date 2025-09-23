function renderAdminPanel() {
  const app = document.getElementById("app");
  if (!app) return;

  // Create comprehensive admin panel
  const adminPanelHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-gear"></i> Admin Panel</h2>
            <button class="btn btn-outline-primary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <!-- Admin Navigation Tabs -->
          <ul class="nav nav-tabs mb-4" id="adminTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users" type="button" role="tab">
                <i class="bi bi-people"></i> Users
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="ratings-tab" data-bs-toggle="tab" data-bs-target="#ratings" type="button" role="tab">
                <i class="bi bi-star-half"></i> Ratings
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="rate-limits-tab" data-bs-toggle="tab" data-bs-target="#rate-limits" type="button" role="tab">
                <i class="bi bi-speedometer2"></i> Rate Limits
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="backup-tab" data-bs-toggle="tab" data-bs-target="#backup" type="button" role="tab">
                <i class="bi bi-download"></i> Backup
              </button>
            </li>
          </ul>

          <!-- Tab Content -->
          <div class="tab-content" id="adminTabContent">
            <!-- Users Tab -->
            <div class="tab-pane fade show active" id="users" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-people"></i> User Management</h5>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <button class="btn btn-primary" onclick="loadAllUsers()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Users
                      </button>
                    </div>
                    <div class="col-md-6">
                      <div class="input-group">
                        <input type="text" class="form-control" id="usernameSearch" placeholder="Search by username...">
                        <button class="btn btn-outline-secondary" onclick="searchUserByUsername()">
                          <i class="bi bi-search"></i> Search
                        </button>
                      </div>
                    </div>
                  </div>
                  <div id="usersList" class="table-responsive">
                    <p class="text-muted">Click "Refresh Users" to load user list</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ratings Tab -->
            <div class="tab-pane fade" id="ratings" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-star-half"></i> Rating Management</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <button class="btn btn-primary" onclick="loadAllRatings()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Ratings
                    </button>
                  </div>
                  <div id="ratingsList" class="admin-ratings-container">
                    <p class="text-muted">Click "Refresh Ratings" to load ratings</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rate Limits Tab -->
            <div class="tab-pane fade" id="rate-limits" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-speedometer2"></i> Rate Limit Management</h5>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <div class="input-group">
                        <input type="text" class="form-control" id="rateLimitIdentifier" placeholder="User identifier (email/IP)">
                        <button class="btn btn-outline-secondary" onclick="checkRateLimit()">
                          <i class="bi bi-search"></i> Check Status
                        </button>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <button class="btn btn-warning" onclick="resetRateLimit()">
                        <i class="bi bi-arrow-clockwise"></i> Reset Rate Limit
                      </button>
                    </div>
                  </div>
                  <div id="rateLimitStatus" class="alert alert-info">
                    <p class="mb-0">Enter an identifier above to check rate limit status</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Backup Tab -->
            <div class="tab-pane fade" id="backup" role="tabpanel">
              <div class="card">
                <div class="card-header">
                  <h5><i class="bi bi-download"></i> Backup Management</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <button class="btn btn-success" onclick="createBackup()">
                      <i class="bi bi-plus"></i> Create Backup
                    </button>
                    <button class="btn btn-primary" onclick="loadBackups()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Backups
                    </button>
                  </div>
                  <div id="backupsList">
                    <p class="text-muted">Click "Refresh Backups" to load backup list</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = adminPanelHTML;
}

function renderRatingsInAdminPanel() {
  const ratingsList = document.getElementById("ratingsList");
  if (!ratingsList) return;

  if (ratings.length === 0) {
    ratingsList.innerHTML = '<p class="text-muted">No ratings found</p>';
    return;
  }

  const ratingListHTML = ratings
    .map(
      (rating) => `
    <div class="rating-item">
      <div class="rating-content">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-2">
              <strong>Rating ID: ${rating.id}</strong>
              <span class="badge bg-primary ms-2">${rating.score}/5 stars</span>
            </div>
            <div class="rating-details">
              <p class="mb-1"><strong>Rater:</strong> User ID ${
                rating.raterId
              }</p>
              <p class="mb-1"><strong>Rated User:</strong> User ID ${
                rating.ratedUserId
              }</p>
              <p class="mb-1"><strong>Book ID:</strong> ${rating.bookId}</p>
              <p class="mb-1"><strong>Date:</strong> ${new Date(
                rating.dateCreated
              ).toLocaleString()}</p>
              ${
                rating.comment
                  ? `<p class="mb-1"><strong>Comment:</strong> ${escapeHtml(
                      rating.comment
                    )}</p>`
                  : ""
              }
            </div>
            <div class="rating-stars mb-2">
              ${renderStarRating(rating.score)}
            </div>
          </div>
          <div class="rating-actions">
            <button class="btn btn-outline-primary btn-sm" onclick="editRating(${
              rating.id
            })">
              <i class="bi bi-pencil"></i> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  ratingsList.innerHTML = ratingListHTML;
}

function renderMyBooksPage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Filter books to show only current user's books
  const myBooks = books.filter(
    (book) => book.sellerEmail === currentUser.email
  );

  if (myBooks.length === 0) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-book display-1 text-muted"></i>
              <h3 class="text-muted mt-3">No books listed yet</h3>
              <p class="text-muted">Start listing your textbooks on the marketplace.</p>
              <button class="btn btn-crimson" onclick="showAddBookForm()">
                <i class="bi bi-plus-circle"></i> List a Book
              </button>
              <button class="btn btn-outline-secondary ms-2" onclick="goBackToBooks()">
                <i class="bi bi-arrow-left"></i> Back to All Books
              </button>
            </div>
          </div>
        </div>
        
        <div id="alert-container"></div>
        
        <div id="book-form-container" class="mb-4" style="display: none;">
          ${renderBookForm()}
        </div>
      </div>
    `;
    return;
  }

  const booksHtml = myBooks
    .map(
      (book) => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100 book-card">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${book.title}</h5>
          <p class="card-text text-muted">by ${book.author}</p>
          <div class="mt-auto">
            <p class="card-text">
              <strong class="text-crimson">$${book.price}</strong>
              <span class="badge bg-${getConditionColor(
                book.condition
              )} ms-2">${book.condition}</span>
            </p>
            <p class="card-text small text-muted">
              ${book.courseCode ? `Course: ${book.courseCode}` : ""}
              ${book.professor ? ` | Professor: ${book.professor}` : ""}
            </p>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm" onclick="editBook(${
                book.id
              })">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${
                book.id
              }, '${book.title}')">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-book"></i> My Books (${myBooks.length})</h2>
            <div>
              <button class="btn btn-crimson" onclick="showAddBookForm()">
                <i class="bi bi-plus-circle"></i> List a Book
              </button>
              <button class="btn btn-outline-secondary ms-2" onclick="goBackToBooks()">
                <i class="bi bi-arrow-left"></i> Back to All Books
              </button>
            </div>
          </div>
          
          <div id="alert-container"></div>
          
          <div id="book-form-container" class="mb-4" style="display: none;">
            ${renderBookForm()}
          </div>
          
          <div class="row">
            ${booksHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Duplicate renderRatingsInAdminPanel() removed - using version from line 258

function renderContactedBooksPage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Filter books to show only books the user has contacted
  const contactedBooks = books.filter((book) => {
    const contactKey = `${currentUser.email}-${book.sellerEmail}-${book.id}`;
    return contactedSellers.has(contactKey);
  });

  console.log(
    "Contacted books page - contactedSellers:",
    Array.from(contactedSellers)
  );
  console.log(
    "Contacted books page - promptedToRate:",
    Array.from(promptedToRate)
  );
  console.log("Contacted books page - ratedBooks:", Array.from(ratedBooks));
  console.log("Contacted books found:", contactedBooks.length);

  if (contactedBooks.length === 0) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-envelope display-1 text-muted"></i>
              <h3 class="text-muted mt-3">No contacted books yet</h3>
              <p class="text-muted">Contact sellers about books you're interested in.</p>
              <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
                <i class="bi bi-arrow-left"></i> Back to All Books
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const booksHtml = contactedBooks
    .map((book) => {
      const conditionInfo = getConditionInfo(book.condition);
      const contactKey = `${currentUser.email}-${book.sellerEmail}-${book.id}`;
      const hasRated = ratedBooks.has(contactKey);
      const hasBeenPrompted = promptedToRate.has(contactKey);

      console.log(`Book ${book.id} (${book.title}):`, {
        contactKey,
        hasRated,
        hasBeenPrompted,
        sellerEmail: book.sellerEmail,
      });

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 book-card">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${book.title}</h5>
              <p class="card-text text-muted">by ${book.author}</p>
              <div class="mt-auto">
                <p class="card-text">
                  <strong class="text-crimson">$${book.price}</strong>
                  <span class="badge bg-${conditionInfo.class} ms-2">${
        conditionInfo.text
      }</span>
                </p>
                <p class="card-text">
                  <small class="text-muted">
                    Seller: ${book.sellerName} (${book.sellerEmail})
                  </small>
                </p>
                <div class="book-actions mt-3">
                  ${
                    hasRated
                      ? `<button class="btn btn-outline-success btn-sm" disabled>
                         <i class="bi bi-star-fill"></i> Rated
                       </button>`
                      : hasBeenPrompted
                      ? `<button class="btn btn-outline-warning btn-sm" onclick="showRatingModal(${
                          book.id
                        }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
                          book.sellerEmail
                        )}')">
                         <i class="bi bi-star"></i> Rate Seller
                       </button>`
                      : `<button class="btn btn-outline-secondary btn-sm" disabled>
                         <i class="bi bi-envelope"></i> Contacted
                       </button>`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-envelope"></i> Contacted Books</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to All Books
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        ${booksHtml}
      </div>
    </div>
  `;
}

// Duplicate renderRatingsInAdminPanel() removed - using version from line 258

function renderMyRatingsPage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Ratings are already filtered by the API to show only current user's ratings
  const myRatings = ratings;

  if (myRatings.length === 0) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-star display-1 text-muted"></i>
              <h3 class="text-muted mt-3">No ratings yet</h3>
              <p class="text-muted">Rate sellers after your interactions to help other students.</p>
              <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
                <i class="bi bi-arrow-left"></i> Back to All Books
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const ratingsHtml = myRatings
    .map(
      (rating) => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${
            rating.ratedUser?.name ||
            (rating.ratedUser?.firstName && rating.ratedUser?.lastName
              ? `${rating.ratedUser.firstName} ${rating.ratedUser.lastName}`
              : "User Not Found")
          }</h5>
          <p class="card-text text-primary fw-bold">${
            rating.book?.title || "Book Not Found"
          }</p>
          <div class="mb-3">
            <div class="d-flex align-items-center">
              <span class="me-2">Rating:</span>
              <div class="text-warning">
                ${"★".repeat(rating.score)}${"☆".repeat(5 - rating.score)}
              </div>
              <span class="ms-2 fw-bold">${rating.score}/5</span>
            </div>
          </div>
          <p class="card-text">${rating.comment || "No comment provided"}</p>
          <small class="text-muted">Rated on ${new Date(
            rating.dateCreated
          ).toLocaleDateString()}</small>
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" onclick="editRating(${
              rating.id
            })">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteRating(${
              rating.id
            })">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-star"></i> My Ratings (${myRatings.length})</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to All Books
            </button>
          </div>
          <div class="row">
            ${ratingsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Duplicate renderRatingsInAdminPanel() removed - using version from line 258

function renderProfilePage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Check if user is authenticated
  if (!currentUser) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
              <h3 class="text-warning mt-3">Authentication Required</h3>
              <p class="text-muted">Please sign in to view your profile.</p>
              <button class="btn btn-crimson" onclick="showLoginForm()">
                <i class="bi bi-box-arrow-in-right"></i> Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Calculate user statistics
  const userBooks = books.filter(
    (book) => book.sellerEmail === currentUser.email
  );
  const userRatings = ratings.filter(
    (rating) => rating.raterId === currentUser.id
  );
  const userRatedBy = ratings.filter(
    (rating) => rating.ratedUserId === currentUser.id
  );
  const userNotifications = notifications.filter(
    (notif) => notif.relatedUserId === currentUser.id
  );
  const userContactedBooks = Array.from(contactedSellers).filter((contact) =>
    contact.startsWith(currentUser.email)
  );

  // Calculate average rating
  const avgRating =
    userRatedBy.length > 0
      ? (
          userRatedBy.reduce((sum, rating) => sum + rating.score, 0) /
          userRatedBy.length
        ).toFixed(1)
      : "No ratings yet";

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-person-circle"></i> My Profile</h2>
            <button class="btn btn-outline-secondary" onclick="renderApp()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
        </div>
      </div>
      
      <div class="row">
        <!-- Profile Information Card -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header bg-crimson text-white">
              <h5 class="card-title mb-0"><i class="bi bi-person"></i> Personal Information</h5>
            </div>
            <div class="card-body" style="background-color: white;">
              <div class="row mb-3">
                <div class="col-sm-4"><strong>Name:</strong></div>
                <div class="col-sm-8">${currentUser.firstName} ${
    currentUser.lastName
  }</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-4"><strong>Email:</strong></div>
                <div class="col-sm-8">${currentUser.email}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-4"><strong>Member Since:</strong></div>
                <div class="col-sm-8">${new Date(
                  currentUser.dateCreated
                ).toLocaleDateString()}</div>
              </div>
              <div class="row mb-3">
                <div class="col-sm-4"><strong>Account Status:</strong></div>
                <div class="col-sm-8">
                  <span class="badge bg-success">Active</span>
                </div>
              </div>
              <hr>
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary" onclick="editProfile()">
                  <i class="bi bi-pencil"></i> Edit Profile
                </button>
                <button class="btn btn-outline-warning" onclick="changeEmail()">
                  <i class="bi bi-envelope"></i> Change Email
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Card -->
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0"><i class="bi bi-graph-up"></i> Your Statistics</h5>
            </div>
            <div class="card-body">
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="border-end">
                    <h3 class="text-crimson">${userBooks.length}</h3>
                    <small class="text-muted">Books Listed</small>
                  </div>
                </div>
                <div class="col-6">
                  <h3 class="text-crimson">${userContactedBooks.length}</h3>
                  <small class="text-muted">Books Contacted</small>
                </div>
              </div>
              <div class="row text-center mb-3">
                <div class="col-6">
                  <div class="border-end">
                    <h3 class="text-crimson">${userRatings.length}</h3>
                    <small class="text-muted">Ratings Given</small>
                  </div>
                </div>
                <div class="col-6">
                  <h3 class="text-crimson">${userRatedBy.length}</h3>
                  <small class="text-muted">Times Rated</small>
                </div>
              </div>
              <div class="row text-center">
                <div class="col-12">
                  <h3 class="text-crimson">${avgRating}/5</h3>
                  <small class="text-muted">Average Rating</small>
                  <div class="mt-2">
                    ${generateStarRating(parseFloat(avgRating))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Support & Settings Card -->
        <div class="col-12 mb-4">
          <div class="card">
            <div class="card-header bg-warning text-dark">
              <h5 class="card-title mb-0"><i class="bi bi-headset"></i> Support & Settings</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary" onclick="createSupportTicket()">
                      <i class="bi bi-ticket"></i> Create Support Ticket
                    </button>
                    <button class="btn btn-outline-info" onclick="viewSupportTickets()">
                      <i class="bi bi-list-ul"></i> View My Tickets
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-secondary" onclick="accountSettings()">
                      <i class="bi bi-gear"></i> Account Settings
                    </button>
                    <button class="btn btn-outline-dark" onclick="privacySettings()">
                      <i class="bi bi-shield"></i> Privacy Settings
                    </button>
                  </div>
                </div>
              </div>
              <hr>
              <div class="text-center">
                <button class="btn btn-outline-danger" onclick="deleteAccount()">
                  <i class="bi bi-trash"></i> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Duplicate renderRatingsInAdminPanel() removed - using version from line 258

function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let stars = "";
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill text-warning"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="bi bi-star-half text-warning"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star text-muted"></i>';
  }
  return stars;
}

// Profile page button functions (placeholders for now)
function editProfile() {
  showAlert("Edit Profile functionality coming soon!", "info");
}

function changeEmail() {
  showAlert("Change Email functionality coming soon!", "info");
}

function createSupportTicket() {
  showAlert("Create Support Ticket functionality coming soon!", "info");
}

function viewSupportTickets() {
  showAlert("View Support Tickets functionality coming soon!", "info");
}

function accountSettings() {
  showAlert("Account Settings functionality coming soon!", "info");
}

function privacySettings() {
  showAlert("Privacy Settings functionality coming soon!", "info");
}

function deleteAccount() {
  showAlert("Delete Account functionality coming soon!", "warning");
}

function renderNotificationsPage() {
  const app = document.getElementById("app");
  if (!app) return;

  if (notifications.length === 0) {
    app.innerHTML = `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-bell display-1 text-muted"></i>
              <h3 class="text-muted mt-3">No notifications yet</h3>
              <p class="text-muted">When someone shows interest in your books, you'll see notifications here.</p>
              <button class="btn btn-crimson" onclick="renderApp()">
                <i class="bi bi-arrow-left"></i> Back to Books
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const notificationList = notifications
    .map(
      (notification) => `
    <div class="notification-item ${
      notification.read ? "read" : "unread"
    }" onclick="markNotificationAsRead(${notification.id})">
      <div class="notification-content">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="notification-message">${notification.message}</div>
            <br>
            <small class="text-muted">${new Date(
              notification.dateCreated
            ).toLocaleString()}</small>
          </div>
          <div>
            ${
              !notification.read
                ? '<span class="badge bg-danger">New</span>'
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-bell"></i> Your Notifications</h2>
            <button class="btn btn-outline-crimson" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          <div class="notifications-container">
            ${notificationList}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Duplicate renderRatingsInAdminPanel() removed - using version from line 258
