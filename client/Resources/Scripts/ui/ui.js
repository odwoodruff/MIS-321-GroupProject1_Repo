// UI Functions
function renderApp() {
  console.log("Rendering app with books:", books);
  const app = document.getElementById("app");
  if (!app) {
    console.error("App element not found!");
    return;
  }

  app.innerHTML = `
    <div class="container mt-4">
      <!-- Search and Filter -->
      <div class="search-container">
        <div class="row">
          <div class="col-md-6">
            <div class="input-group">
              <input type="text" class="form-control search-input" id="search-input" 
                     placeholder="Search by title, author, or professor..." 
                     value="${escapeHtml(currentSearchTerm)}"
                     onkeyup="handleSearch(event)">
              <button class="btn search-btn" onclick="handleSearch(event)">
                <i class="bi bi-search"></i> Search
              </button>
            </div>
          </div>
          <div class="col-md-4">
            <div class="d-flex gap-2">
              <div class="dropdown" style="flex: 1;">
                <button class="btn btn-outline-secondary dropdown-toggle w-100" type="button" 
                        id="courseDropdown" data-bs-toggle="dropdown" aria-expanded="false"
                        style="height: 38px;">
                  ${
                    selectedCourse
                      ? `<span class="badge bg-secondary me-2">${selectedCourse}</span>`
                      : ""
                  }
                  <span id="courseText">Select Course</span>
                </button>
                <ul class="dropdown-menu w-100" id="courseMenu" style="max-height: 300px; overflow-y: auto;">
                  <li class="sticky-top bg-light">
                    <div class="d-flex align-items-center m-2">
                      <input type="text" class="form-control form-control-sm" 
                             id="courseSearch" placeholder="Type to search..." 
                             onkeyup="filterCourses()" style="font-size: 0.875rem; flex: 1;">
                    </div>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                ${getUniqueCourses()
                  .sort()
                  .map(
                    (course) =>
                      `<li><a class="dropdown-item" href="#" onclick="selectCourse('${course}')">${course}</a></li>`
                  )
                  .join("")}
                </ul>
              </div>
              ${
                selectedCourse
                  ? `<button class="btn btn-outline-danger" onclick="clearCourseSelection()" title="Clear selection"
                      style="height: 38px; padding: 0.375rem 0.75rem;">
                      <i class="bi bi-x"></i>
                    </button>`
                  : ""
              }
            </div>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-crimson w-100" onclick="showAddBookForm()"
                    style="height: 38px;">
                <i class="bi bi-plus-circle"></i> List Book
              </button>
          </div>
        </div>
      </div>
      
      <div id="alert-container"></div>
      
      <div id="book-form-container" class="mb-4" style="display: none;">
        ${renderBookForm()}
      </div>
      
      <div id="books-container">
        ${renderBooks()}
      </div>
    </div>
  `;

  // Initialize tooltips after rendering
  setTimeout(initializeTooltips, 100);

  // Setup scroll behavior after DOM is rendered
  setTimeout(setupScrollBehavior, 100);
}

function renderBooks() {
  // Check if user is authenticated
  if (!authToken) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-lock display-1 text-muted"></i>
        <h3 class="text-muted mt-3">Please Sign In</h3>
        <p class="text-muted">You need to sign in to view and buy books</p>
        <button class="btn btn-crimson" data-bs-toggle="modal" data-bs-target="#loginModal">
          <i class="bi bi-box-arrow-in-right"></i> Sign In
        </button>
      </div>
    `;
  }

  // Filter out user's own books and contacted books from the display
  const availableBooks = currentUser
    ? books.filter((book) => {
        // Don't show user's own books
        if (book.sellerEmail === currentUser.email) return false;

        // Don't show books the user has contacted
        const contactKey = `${currentUser.email}-${book.sellerEmail}-${book.id}`;
        if (contactedSellers.has(contactKey)) return false;

        return true;
      })
    : books;

  if (availableBooks.length === 0) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-book display-1 text-muted"></i>
        <h3 class="text-muted mt-3">No books found</h3>
        <p class="text-muted">${
          currentSearchTerm ? "Try a different search term or " : ""
        }Be the first to list a book!</p>
      </div>
    `;
  }

  // Create array with ads inserted at intervals
  const itemsWithAds = [];
  let adCounter = 0;
  let nextAdAt = 6; // Start with 6 posts, then alternate

  availableBooks.forEach((book, index) => {
    // Add book
    itemsWithAds.push(renderBookCard(book));

    // Insert ads alternating between every 6 and 7 books
    if (index + 1 === nextAdAt && index < availableBooks.length - 1) {
      itemsWithAds.push(renderAdCard(adCounter % 2 === 0 ? 1 : 2)); // Alternate between ads
      adCounter++;
      // Alternate between 6 and 7 for next ad
      nextAdAt += adCounter % 2 === 0 ? 6 : 7;
    }
  });

  return `
    <div class="container-fluid px-0">
      ${itemsWithAds.join("")}
    </div>
  `;
}

function renderBookCard(book) {
  const conditionInfo = getConditionInfo(book.condition);
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
                ? `
              <span><i class="bi bi-star-fill text-warning"></i> ${book.sellerRating.toFixed(
                1
              )} (${book.sellerRatingCount} reviews)</span>
            `
                : ""
            }
            ${(() => {
              const ratingKey = `${currentUser?.email}-${book.sellerEmail}-${book.id}`;
              const isRated =
                currentUser &&
                book.sellerEmail !== currentUser.email &&
                ratedBooks.has(ratingKey);
              console.log(`Rating check for book ${book.id}:`, {
                currentUser: currentUser?.email,
                sellerEmail: book.sellerEmail,
                ratingKey,
                isRated,
                ratedBooksSize: ratedBooks.size,
                ratedBooksArray: Array.from(ratedBooks),
              });
              return isRated
                ? `<span class="badge bg-success ms-2"><i class="bi bi-star-fill"></i> Rated</span>`
                : "";
            })()}
          </div>
        </div>
        <div class="book-price">$${(book.price || 0).toFixed(2)}</div>
        <div class="book-condition ${conditionInfo.class}" 
             data-bs-toggle="tooltip" 
             data-bs-placement="top" 
             title="${conditionInfo.description}">
          <i class="bi ${conditionInfo.icon}"></i> ${
    book.condition || "Unknown"
  }
        </div>
        <div class="book-actions">
          ${
            currentUser &&
            book.sellerEmail !== currentUser.email &&
            !contactedSellers.has(
              `${currentUser.email}-${book.sellerEmail}-${book.id}`
            )
              ? `
            <button class="btn btn-crimson btn-sm" onclick="contactSeller(${book.id})">
              <i class="bi bi-envelope"></i> Contact
            </button>
          `
              : currentUser &&
                book.sellerEmail !== currentUser.email &&
                contactedSellers.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                ) &&
                promptedToRate.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                ) &&
                !ratedBooks.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                )
              ? `
            <button class="btn btn-outline-warning btn-sm" onclick="showRatingModal(${
              book.id
            }, '${escapeHtml(book.sellerName)}', '${escapeHtml(
                  book.sellerEmail
                )}')">
              <i class="bi bi-star"></i> Rate
            </button>
          `
              : currentUser &&
                book.sellerEmail !== currentUser.email &&
                contactedSellers.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                ) &&
                !ratedBooks.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                )
              ? `
            <button class="btn btn-outline-secondary btn-sm" disabled>
              <i class="bi bi-check-circle"></i> Contacted
            </button>
          `
              : currentUser &&
                book.sellerEmail !== currentUser.email &&
                contactedSellers.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                ) &&
                ratedBooks.has(
                  `${currentUser.email}-${book.sellerEmail}-${book.id}`
                )
              ? `
            <button class="btn btn-outline-secondary btn-sm" disabled>
              <i class="bi bi-check-circle"></i> Contacted
            </button>
          `
              : ""
          }
          ${
            canEditBook(book)
              ? `
            <button class="btn btn-outline-crimson btn-sm" onclick="editBook(${
              book.id
            })">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${
              book.id
            }, '${escapeHtml(book.title)}')">
              <i class="bi bi-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function renderAdCard(adNumber) {
  const adImage = adNumber === 1 ? "ad1.jpg" : "ad2.jpg";
  const adData =
    adNumber === 1
      ? {
          title: "Adventure Awaits Wilderness Tours",
          description:
            "Experience breathtaking nature with our guided wilderness tours. From scenic river adventures to forest hiking expeditions, discover the great outdoors like never before.",
          cta: "Call Today!",
        }
      : {
          title: "Need Code? Call Monroe!",
          description:
            "Professional coding services for all your development needs. From web applications to mobile apps, get expert programming solutions delivered fast and efficiently.",
          cta: "Get Started Now!",
        };

  return `
    <div class="ad-card">
      <div class="ad-content">
        <img src="./Resources/Images/${adImage}" alt="Advertisement" class="ad-image" />
        <div class="ad-text-content">
          <h4 class="ad-title">${adData.title}</h4>
          <p class="ad-description">${adData.description}</p>
          <div class="ad-cta" onclick="handleAdClick(${adNumber})">${adData.cta}</div>
        </div>
        <div class="ad-label">Advertisement</div>
      </div>
    </div>
  `;
}

function handleAdClick(adNumber) {
  console.log("Ad clicked:", adNumber);

  if (adNumber === 1) {
    // Wilderness Tours ad - show phone number
    showCustomAlert("Wilderness Tours", "📞 Call us at: 867-5309");
  } else {
    // Monroe coding ad - show joke message
    showCustomAlert(
      "Monroe Coding Services",
      "😄 Don't actually call Monroe please! He will probably mess up your code!"
    );
  }
}

function showCustomAlert(title, message) {
  // Create custom modal
  const modal = document.createElement("div");
  modal.className = "modal fade show";
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}
