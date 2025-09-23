// Navigation and UI state management functions

function updateNavigationState(activePage) {
  const homeLink = document.getElementById("home-nav-link");
  const myBooksLink = document.getElementById("my-books-nav-link");
  const contactedBooksLink = document.getElementById(
    "contacted-books-nav-link"
  );
  const myRatingsLink = document.getElementById("my-ratings-nav-link");
  const notificationsLink = document.getElementById("notifications-nav-link");
  const adminLink = document.getElementById("admin-nav-link");
  const profileLink = document.getElementById("profile-nav-link");

  // Remove active class from all links
  [
    homeLink,
    myBooksLink,
    contactedBooksLink,
    myRatingsLink,
    notificationsLink,
    adminLink,
    profileLink,
  ].forEach((link) => {
    if (link) {
      link.classList.remove("active");
    }
  });

  // Add active class to current page
  switch (activePage) {
    case "myBooks":
      if (myBooksLink) myBooksLink.classList.add("active");
      break;
    case "contactedBooks":
      if (contactedBooksLink) contactedBooksLink.classList.add("active");
      break;
    case "myRatings":
      if (myRatingsLink) myRatingsLink.classList.add("active");
      break;
    case "notifications":
      if (notificationsLink) notificationsLink.classList.add("active");
      break;
    case "admin":
      if (adminLink) adminLink.classList.add("active");
      break;
    case "profile":
      if (profileLink) profileLink.classList.add("active");
      break;
    default:
      if (homeLink) homeLink.classList.add("active");
      break;
  }
}

// Contacted Books page functions
async function showContactedBooks() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "contactedBooks");
  renderContactedBooksPage();
}

function renderContactedBooksPage() {
  const app = document.getElementById("app");

  // Get books that the user has contacted
  const contactedBooksList = books.filter((book) => {
    const contactKey = `${book.sellerEmail}-${book.id}`;
    return contactedSellers.has(contactKey);
  });

  app.innerHTML = `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Contacted Books</h2>
            <button class="btn btn-outline-secondary" onclick="goBackToBooks()">
              <i class="bi bi-arrow-left"></i> Back to Books
            </button>
          </div>
          
          <div class="books-grid">
            ${
              contactedBooksList.length === 0
                ? `
              <div class="text-center mt-5">
                <h4>No contacted books yet</h4>
                <p>Books you contact sellers about will appear here.</p>
                <button class="btn btn-primary" onclick="goBackToBooks()">
                  <i class="bi bi-search"></i> Browse Books
                </button>
              </div>
            `
                : contactedBooksList
                    .map((book) => {
                      const isRated = ratedBooks.has(
                        `${currentUser.email}-${book.sellerEmail}-${book.id}`
                      );
                      const hasBeenPrompted = promptedToRate.has(
                        `${book.sellerEmail}-${book.id}`
                      );

                      return `
                <div class="book-card">
                  <div class="book-icon"></div>
                  <div class="book-info">
                    <div class="book-details">
                      <h5 class="book-title">${escapeHtml(book.title)}</h5>
                      <p class="book-author">
                        <i class="bi bi-pencil"></i> <strong>Author:</strong> ${escapeHtml(
                          book.author
                        )}
                      </p>
                      <div class="book-meta">
                        <span><i class="bi bi-bookmark"></i> ${
                          book.courseCode || "N/A"
                        }</span>
                        <span><i class="bi bi-person-badge"></i> ${escapeHtml(
                          book.professor || "N/A"
                        )}</span>
                        <span><i class="bi bi-person-circle"></i> <strong>Sold by:</strong> ${escapeHtml(
                          book.sellerName || "Unknown"
                        )}</span>
                        ${
                          book.sellerRating && book.sellerRating > 0
                            ? `<span><i class="bi bi-star-fill"></i> ${book.sellerRating.toFixed(
                                1
                              )} (${book.sellerRatingCount})</span>`
                            : ""
                        }
                      </div>
                      <p class="book-price">$${book.price}</p>
                      <p class="book-condition">
                        <span class="badge bg-${getConditionColor(
                          book.condition
                        )} ms-2">${book.condition}</span>
                      </p>
                    </div>
                    <div class="book-actions">
                      ${
                        isRated
                          ? `
                          <button class="btn btn-outline-success btn-sm" disabled>
                            <i class="bi bi-star-fill"></i> Rated
                          </button>
                        `
                          : hasBeenPrompted
                          ? `<button class="btn btn-outline-warning btn-sm" onclick="showRatingModal(${
                              book.id
                            }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
                              book.sellerEmail
                            )}')">
                             <i class="bi bi-star"></i> Rate Seller
                           </button>`
                          : `<button class="btn btn-outline-secondary btn-sm" disabled>
                             <i class="bi bi-star"></i> Rate Seller
                           </button>`
                      }
                      <button class="btn btn-outline-info btn-sm" disabled>
                        <i class="bi bi-envelope-check"></i> Contacted
                      </button>
                    </div>
                  </div>
                </div>
              `;
                    })
                    .join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;

  updateNavigationState("contactedBooks");
}

// My Books page functions
async function showMyBooks() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "myBooks");
  renderMyBooksPage();
}

// My Ratings page functions
async function showMyRatings() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "myRatings");
  renderMyRatingsPage();
}

// Notifications page functions
async function showNotifications() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "notifications");
  renderNotificationsPage();
}

// Admin panel functions
async function showAdminPanel() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  if (!isAdmin()) {
    showAlert("Access denied. Admin privileges required.", "danger");
    return;
  }

  localStorage.setItem("currentPage", "admin");
  renderAdminPanel();
}

// Profile page functions
async function showProfile() {
  const isAuthenticated = await authCheck();
  if (!isAuthenticated) return;

  localStorage.setItem("currentPage", "profile");
  renderProfilePage();
}

// Back navigation
function goBackToBooks() {
  localStorage.removeItem("currentPage");
  renderApp();
}
