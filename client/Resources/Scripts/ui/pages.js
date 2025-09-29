function renderAdminPanel() {
  const app = document.getElementById("app");
  if (!app) return;

  // Create comprehensive admin panel
  const adminPanelHTML = `
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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
              <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users" type="button" role="tab" onclick="loadAllUsers()">
                <i class="bi bi-people"></i> Users
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="ratings-tab" data-bs-toggle="tab" data-bs-target="#ratings" type="button" role="tab" onclick="loadAllRatings()">
                <i class="bi bi-star-half"></i> Ratings
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="books-tab" data-bs-toggle="tab" data-bs-target="#books" type="button" role="tab" onclick="loadAllBooks()">
                <i class="bi bi-book"></i> Books
              </button>
            </li>
            <!-- HIDDEN FOR COLIN'S UI BRANCH - Rate limits tab disabled
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="rate-limits-tab" data-bs-toggle="tab" data-bs-target="#rate-limits" type="button" role="tab">
                <i class="bi bi-speedometer2"></i> Rate Limits
              </button>
            </li>
            -->
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="backup-tab" data-bs-toggle="tab" data-bs-target="#backup" type="button" role="tab" onclick="loadBackups()">
                <i class="bi bi-download"></i> Backup
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="support-tickets-tab" data-bs-toggle="tab" data-bs-target="#support-tickets" type="button" role="tab" onclick="loadSupportTickets()">
                <i class="bi bi-ticket-perforated"></i> Support Tickets
              </button>
            </li>
          </ul>

          <!-- Tab Content -->
          <div class="tab-content" id="adminTabContent">
            <!-- Users Tab -->
            <div class="tab-pane fade show active" id="users" role="tabpanel">
              <div class="card admin-card">
                <div class="card-header admin-card-header">
                  <h5><i class="bi bi-people"></i> User Management</h5>
                </div>
                <div class="card-body admin-card-body">
                  <div class="row mb-3">
                    <div class="col-md-3">
                      <button class="btn btn-primary" onclick="loadAllUsers()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Users
                      </button>
                    </div>
                    <div class="col-md-4">
                      <div class="input-group">
                        <input type="text" class="form-control admin-input" id="usernameSearch" placeholder="Search by username..." oninput="handleUserSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-search"></i>
                        </span>
                      </div>
                    </div>
                    <div class="col-md-5">
                      <div class="input-group">
                        <input type="number" class="form-control admin-input" id="userIdSearch" placeholder="Search by user ID..." oninput="handleUserIdSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-hash"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div id="usersList" class="table-responsive admin-table-container">
                    <p class="text-muted">Loading users...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ratings Tab -->
            <div class="tab-pane fade" id="ratings" role="tabpanel">
              <div class="card admin-card">
                <div class="card-header admin-card-header">
                  <h5><i class="bi bi-star-half"></i> Rating Management</h5>
                </div>
                <div class="card-body admin-card-body">
                  <div class="row mb-3">
                    <div class="col-md-3">
                      <button class="btn btn-primary" onclick="loadAllRatings()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Ratings
                      </button>
                    </div>
                    <div class="col-md-3">
                      <div class="input-group">
                        <input type="text" class="form-control admin-input" id="ratingSearch" placeholder="Search by comment..." oninput="handleRatingSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-search"></i>
                        </span>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="input-group">
                        <input type="number" class="form-control admin-input" id="ratingIdSearch" placeholder="Search by rating ID..." oninput="handleRatingIdSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-hash"></i>
                        </span>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="input-group">
                        <select class="form-select admin-input" id="ratingScoreFilter" onchange="filterRatingsByScore()">
                          <option value="">All Scores</option>
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div id="ratingsList" class="admin-ratings-container">
                    <p class="text-muted">Loading ratings...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Books Tab -->
            <div class="tab-pane fade" id="books" role="tabpanel">
              <div class="card admin-card">
                <div class="card-header admin-card-header">
                  <h5><i class="bi bi-book"></i> Book Management</h5>
                </div>
                <div class="card-body admin-card-body">
                  <div class="row mb-3">
                    <div class="col-md-3">
                      <button class="btn btn-primary" onclick="loadAllBooks()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Books
                      </button>
                    </div>
                    <div class="col-md-4">
                      <div class="input-group">
                        <input type="text" class="form-control admin-input" id="bookSearch" placeholder="Search by title or author..." oninput="handleBookSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-search"></i>
                        </span>
                      </div>
                    </div>
                    <div class="col-md-5">
                      <div class="input-group">
                        <input type="number" class="form-control admin-input" id="bookIdSearch" placeholder="Search by book ID..." oninput="handleBookIdSearchInput()">
                        <span class="input-group-text admin-input-group-text">
                          <i class="bi bi-hash"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div id="booksList" class="table-responsive admin-table-container">
                    <p class="text-muted">Loading books...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- HIDDEN FOR COLIN'S UI BRANCH - Rate Limits Tab disabled
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
            -->

            <!-- Backup Tab -->
            <div class="tab-pane fade" id="backup" role="tabpanel">
              <div class="card admin-card">
                <div class="card-header admin-card-header">
                  <h5><i class="bi bi-download"></i> Backup Management</h5>
                </div>
                <div class="card-body admin-card-body">
                  <div class="mb-3">
                    <button class="btn btn-success" onclick="createBackup()">
                      <i class="bi bi-plus"></i> Create Backup
                    </button>
                    <button class="btn btn-primary" onclick="loadBackups()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Backups
                    </button>
                  </div>
                  <div id="backupsList" class="admin-table-container">
                    <p class="text-muted">Loading backups...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Support Tickets Tab -->
            <div class="tab-pane fade" id="support-tickets" role="tabpanel">
              <div class="card admin-card">
                <div class="card-header admin-card-header">
                  <h5><i class="bi bi-ticket-perforated"></i> Support Tickets Management</h5>
                </div>
                <div class="card-body admin-card-body">
                  <div class="mb-3">
                    <button class="btn btn-primary" onclick="loadSupportTickets()">
                      <i class="bi bi-arrow-clockwise"></i> Refresh Tickets
                    </button>
                    <button class="btn btn-warning" onclick="createSampleSupportTickets()">
                      <i class="bi bi-plus-circle"></i> Create Sample Tickets
                    </button>
                    <button class="btn btn-info" onclick="addTestSupportTickets()">
                      <i class="bi bi-bug"></i> Add Test Tickets
                    </button>
                  </div>
                  <div id="supportTicketsContainer" class="admin-table-container">
                    <p class="text-muted">Loading support tickets...</p>
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

  // Auto-load users tab content when admin panel opens
  setTimeout(() => {
    loadAllUsers();
  }, 100);
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
            <button class="btn btn-outline-primary btn-sm me-2" onclick="editRating(${
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
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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
      <div class="card h-100 book-card ${
        !book.isAvailable ? "opacity-75" : ""
      }">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${book.title}</h5>
          <p class="card-text text-muted">by ${book.author}</p>
          <div class="mt-auto">
            <p class="card-text">
              <strong class="text-crimson">$${book.price}</strong>
              <span class="badge bg-${getConditionColor(
                book.condition
              )} ms-2">${book.condition}</span>
              ${
                !book.isAvailable
                  ? '<span class="badge bg-success ms-2">SOLD</span>'
                  : ""
              }
            </p>
            <p class="card-text small text-muted">
              ${book.courseCode ? `Course: ${book.courseCode}` : ""}
              ${book.professor ? ` | Professor: ${book.professor}` : ""}
            </p>
            <div class="d-flex gap-2">
              ${
                book.isAvailable
                  ? `
                <button class="btn btn-outline-primary btn-sm" onclick="editBook(${book.id})">
                  <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-outline-success btn-sm" onclick="markAsSold(${book.id}, '${book.title}')">
                  <i class="bi bi-check-circle"></i> Mark as Sold
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${book.id}, '${book.title}')">
                  <i class="bi bi-trash"></i> Delete
                </button>
              `
                  : `
                <span class="text-muted small">This book has been sold</span>
              `
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  app.innerHTML = `
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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

async function renderProfilePage() {
  const app = document.getElementById("app");
  if (!app) return;

  // Check if user is authenticated
  if (!currentUser) {
    app.innerHTML = `
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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

  // Show loading state
  app.innerHTML = `
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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
        <div class="col-12">
          <div class="text-center py-5">
            <div class="spinner-border text-crimson" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    // Load user statistics
    const stats = await loadUserStatistics();
    renderProfileContent(stats);
  } catch (error) {
    console.error("Error loading profile:", error);
    app.innerHTML = `
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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
          <div class="col-12">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle"></i>
              <strong>Error loading profile:</strong> ${error.message}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

async function loadUserStatistics() {
  const response = await fetch(
    `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/profile/statistics`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load user statistics");
  }

  return await response.json();
}

function renderProfileContent(stats) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="bi bi-person-circle"></i> My Profile</h2>
            <button class="btn btn-outline-secondary" onclick="renderApp()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
        </div>
      </div>
      
      <!-- User Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-book display-4 text-crimson mb-2"></i>
              <h3 class="text-crimson">${stats.booksListed}</h3>
              <p class="text-muted mb-0">Books Listed</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-check-circle display-4 text-success mb-2"></i>
              <h3 class="text-success">${stats.booksSold}</h3>
              <p class="text-muted mb-0">Books Sold</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-envelope display-4 text-primary mb-2"></i>
              <h3 class="text-primary">${stats.booksContacted}</h3>
              <p class="text-muted mb-0">Books Contacted</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-currency-dollar display-4 text-success mb-2"></i>
              <h3 class="text-success">$${stats.totalSales.toFixed(2)}</h3>
              <p class="text-muted mb-0">Total Sales</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Statistics Row -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-star display-4 text-warning mb-2"></i>
              <h3 class="text-warning">${stats.ratingsGiven}</h3>
              <p class="text-muted mb-0">Ratings Given</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-star-fill display-4 text-warning mb-2"></i>
              <h3 class="text-warning">${stats.averageRatingGiven}/5</h3>
              <p class="text-muted mb-0">Avg Rating Given</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-star-half display-4 text-info mb-2"></i>
              <h3 class="text-info">${stats.ratingsReceived}</h3>
              <p class="text-muted mb-0">Ratings Received</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card h-100 profile-stat-card">
            <div class="card-body text-center">
              <i class="bi bi-star-fill display-4 text-success mb-2"></i>
              <h3 class="text-success">${stats.averageRatingReceived}/5</h3>
              <p class="text-muted mb-0">Avg Rating Received</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Support & Account Management -->
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header bg-crimson text-white">
              <h5 class="card-title mb-0"><i class="bi bi-headset"></i> Support</h5>
            </div>
            <div class="card-body">
              <button class="btn btn-outline-primary w-100 mb-3" onclick="showSupportTicketModal()">
                <i class="bi bi-ticket"></i> Create Support Ticket
              </button>
              <button class="btn btn-outline-info w-100 mb-3" onclick="showMyTickets()">
                <i class="bi bi-list-ul"></i> View My Tickets
              </button>
              <div class="text-center">
                <small class="text-muted">Need help? Contact our support team!</small>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header bg-danger text-white">
              <h5 class="card-title mb-0"><i class="bi bi-exclamation-triangle"></i> Account Management</h5>
            </div>
            <div class="card-body">
              <div class="alert alert-warning">
                <i class="bi bi-info-circle"></i>
                <strong>Member since:</strong> ${new Date(
                  stats.memberSince
                ).toLocaleDateString()}
              </div>
              <button class="btn btn-outline-danger w-100" onclick="showDeleteAccountModal()">
                <i class="bi bi-trash"></i> Delete Account
              </button>
              <div class="text-center mt-2">
                <small class="text-muted">This action cannot be undone!</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Support Ticket Modal
function showSupportTicketModal() {
  console.log("showSupportTicketModal called");
  const modalHtml = `
    <div class="modal fade" id="supportTicketModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-crimson text-white">
            <h5 class="modal-title"><i class="bi bi-ticket"></i> Create Support Ticket</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="supportTicketForm">
              <div class="mb-3">
                <label for="ticketSubject" class="form-label">Subject</label>
                <select class="form-select" id="ticketSubject" required>
                  <option value="">Select a subject...</option>
                  <option value="Account Issues">Account Issues</option>
                  <option value="Book Listing Problems">Book Listing Problems</option>
                  <option value="Technical Problems">Technical Problems</option>
                  <option value="Report User">Report User</option>
                  <option value="Report Book">Report Book</option>
                  <option value="General Question">General Question</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="ticketMessage" class="form-label">Message</label>
                <textarea class="form-control" id="ticketMessage" rows="6" 
                  placeholder="Please describe your issue or question in detail..." required></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-crimson" onclick="submitSupportTicket()">
              <i class="bi bi-send"></i> Submit Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("supportTicketModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("supportTicketModal")
  );
  modal.show();
}

async function submitSupportTicket() {
  const subject = document.getElementById("ticketSubject").value;
  const message = document.getElementById("ticketMessage").value;

  if (!subject || !message) {
    if (typeof showAlert === "function") {
      showAlert("Please fill in all fields", "warning");
    } else {
      alert("Please fill in all fields");
    }
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/profile/support-ticket`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, message }),
      }
    );

    if (response.ok) {
      if (typeof showAlert === "function") {
        showAlert("Support ticket created successfully!", "success");
      } else {
        alert("Support ticket created successfully!");
      }
      bootstrap.Modal.getInstance(
        document.getElementById("supportTicketModal")
      ).hide();
      document.getElementById("supportTicketForm").reset();
    } else {
      throw new Error("Failed to create support ticket");
    }
  } catch (error) {
    console.error("Error creating support ticket:", error);
    if (typeof showAlert === "function") {
      showAlert("Error creating support ticket. Please try again.", "danger");
    } else {
      alert("Error creating support ticket. Please try again.");
    }
  }
}

async function showMyTickets() {
  console.log("showMyTickets called");
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace(
        "/api/Book",
        ""
      )}/api/profile/support-tickets`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load support tickets");
    }

    const tickets = await response.json();
    renderTicketsModal(tickets);
  } catch (error) {
    console.error("Error loading support tickets:", error);
    if (typeof showAlert === "function") {
      showAlert("Error loading support tickets. Please try again.", "danger");
    } else {
      alert("Error loading support tickets. Please try again.");
    }
  }
}

function renderTicketsModal(tickets) {
  const modalHtml = `
    <div class="modal fade" id="ticketsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-list-ul"></i> My Support Tickets</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${
              tickets.length === 0
                ? '<div class="text-center py-4"><i class="bi bi-inbox display-4 text-muted"></i><p class="text-muted mt-2">No support tickets found</p></div>'
                : tickets
                    .map(
                      (ticket) => `
                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 class="card-title">${ticket.subject}</h6>
                        <p class="card-text text-muted">${ticket.message}</p>
                        <small class="text-muted">Created: ${new Date(
                          ticket.dateCreated
                        ).toLocaleString()}</small>
                      </div>
                      <span class="badge bg-${getStatusColor(ticket.status)}">${
                        ticket.status
                      }</span>
                    </div>
                    ${
                      ticket.adminResponse
                        ? `
                      <div class="mt-3 p-3 bg-light rounded">
                        <strong>Admin Response:</strong>
                        <p class="mb-0">${ticket.adminResponse}</p>
                      </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `
                    )
                    .join("")
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("ticketsModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("ticketsModal"));
  modal.show();
}

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "open":
      return "primary";
    case "in progress":
      return "warning";
    case "resolved":
      return "success";
    case "closed":
      return "secondary";
    default:
      return "secondary";
  }
}

// Delete Account Modal
function showDeleteAccountModal() {
  const modalHtml = `
    <div class="modal fade" id="deleteAccountModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle"></i> Delete Account</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <h6><i class="bi bi-exclamation-triangle"></i> Warning!</h6>
              <p>This action will permanently delete your account and all associated data including:</p>
              <ul>
                <li>All your book listings</li>
                <li>All your ratings and reviews</li>
                <li>All your support tickets</li>
                <li>All your notifications</li>
                <li>All your contact history</li>
              </ul>
              <p><strong>This action cannot be undone!</strong></p>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="confirmDelete">
              <label class="form-check-label" for="confirmDelete">
                I understand that this action cannot be undone
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="confirmDeleteAccount()" disabled id="deleteAccountBtn">
              <i class="bi bi-trash"></i> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("deleteAccountModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("deleteAccountModal")
  );
  modal.show();

  // Enable delete button when checkbox is checked
  document
    .getElementById("confirmDelete")
    .addEventListener("change", function () {
      document.getElementById("deleteAccountBtn").disabled = !this.checked;
    });
}

async function confirmDeleteAccount() {
  if (!document.getElementById("confirmDelete").checked) {
    showAlert("Please confirm that you understand the consequences", "warning");
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL.replace("/api/Book", "")}/api/profile/account`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      showAlert(
        "Account deleted successfully. You will be logged out.",
        "success"
      );
      bootstrap.Modal.getInstance(
        document.getElementById("deleteAccountModal")
      ).hide();

      // Clear user data and redirect to login
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      currentUser = null;

      setTimeout(() => {
        showLoginForm();
      }, 2000);
    } else {
      throw new Error("Failed to delete account");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    showAlert("Error deleting account. Please try again.", "danger");
  }
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
      <div class="container mt-4 page-content-container">
        <div class="row page-content-row">
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
    <div class="container mt-4 page-content-container">
      <div class="row page-content-row">
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
