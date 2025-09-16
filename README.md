# Group Project Book Club

A full-stack web application for managing a book collection, built with ASP.NET Core Web API and vanilla JavaScript.

## Features

- **Book Management**: Add, edit, delete, and view books
- **Search Functionality**: Search books by title, author, or genre
- **Enhanced Book Model**: Includes title, author, genre, year, and description
- **Responsive Design**: Modern UI with Bootstrap 5
- **In-Memory Storage**: No database required - data stored in memory

## Project Structure

```
GroupProjectBook/
├── api/                    # ASP.NET Core Web API
│   └── api/
│       ├── Controllers/    # API Controllers
│       ├── Models/         # Data Models
│       ├── Services/       # Business Logic
│       └── Program.cs      # Application Entry Point
└── client/                 # Frontend Client
    ├── index.html          # Main HTML Page
    └── Resources/
        ├── Scripts/        # JavaScript Files
        └── Styles/         # CSS Files
```

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- A modern web browser

### Running the Application

1. **Start the API Server**:

   ```bash
   cd api/api
   dotnet run
   ```

   The API will be available at `https://localhost:7144` or `http://localhost:5144`

2. **Open the Client**:
   - Open `client/index.html` in your web browser
   - Or serve it using a local web server

### API Endpoints

- `GET /api/Book` - Get all books (with optional search parameter)
- `GET /api/Book/{id}` - Get a specific book
- `POST /api/Book` - Create a new book
- `PUT /api/Book/{id}` - Update a book
- `DELETE /api/Book/{id}` - Delete a book

### Book Model

```json
{
  "id": 1,
  "title": "Book Title",
  "author": "Author Name",
  "genre": "Fiction",
  "year": 2023,
  "description": "Book description"
}
```

## Key Differences from Reference Project

- **No SQL Database**: Uses in-memory storage instead of SQLite
- **Enhanced Book Model**: Added genre, year, and description fields
- **Search Functionality**: Added search capability across multiple fields
- **Improved UI**: Enhanced styling and user experience
- **Better Error Handling**: More robust error handling and user feedback

## Technologies Used

- **Backend**: ASP.NET Core 8.0, C#
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Icons**: Bootstrap Icons
- **Storage**: In-memory (List<Book>)

## Development Notes

- The application uses CORS to allow cross-origin requests
- Data is stored in memory and will be lost when the server restarts
- The API includes Swagger documentation for testing endpoints
- The client includes responsive design for mobile devices
