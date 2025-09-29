// Mock dependencies
jest.mock("../../Resources/Scripts/core/config.js", () => ({
  API_BASE_URL: "http://localhost:5000/api",
}));

jest.mock("../../Resources/Scripts/core/auth.js", () => ({
  getAuthHeaders: jest.fn(() => ({ Authorization: "Bearer fake-token" })),
}));

// Import the module after mocking
const BooksService = require("../../Resources/Scripts/features/books.js");

describe("BooksService", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe("loadBooks", () => {
    test("should fetch and return books", async () => {
      const mockBooks = [
        { id: 1, title: "Book 1", author: "Author 1", price: 50.0 },
        { id: 2, title: "Book 2", author: "Author 2", price: 75.0 },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooks,
      });

      const result = await BooksService.loadBooks();

      expect(fetch).toHaveBeenCalledWith("http://localhost:5000/api/books");
      expect(result).toEqual(mockBooks);
    });

    test("should handle fetch errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(BooksService.loadBooks()).rejects.toThrow("Network error");
    });
  });

  describe("createBook", () => {
    test("should create a new book", async () => {
      const bookData = {
        title: "New Book",
        author: "New Author",
        price: 60.0,
        condition: "Good",
      };

      const mockResponse = { id: 3, ...bookData };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await BooksService.createBook(bookData);

      expect(fetch).toHaveBeenCalledWith("http://localhost:5000/api/books", {
        method: "POST",
        headers: { Authorization: "Bearer fake-token" },
        body: JSON.stringify(bookData),
      });
      expect(result).toEqual(mockResponse);
    });

    test("should handle creation errors", async () => {
      const bookData = { title: "New Book" };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Validation error" }),
      });

      await expect(BooksService.createBook(bookData)).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("updateBook", () => {
    test("should update an existing book", async () => {
      const bookId = 1;
      const updateData = { title: "Updated Book", price: 80.0 };

      const mockResponse = { id: bookId, ...updateData };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await BooksService.updateBook(bookId, updateData);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/books/${bookId}`,
        {
          method: "PUT",
          headers: { Authorization: "Bearer fake-token" },
          body: JSON.stringify(updateData),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("deleteBook", () => {
    test("should delete a book", async () => {
      const bookId = 1;

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Book deleted successfully" }),
      });

      const result = await BooksService.deleteBook(bookId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/books/${bookId}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer fake-token" },
        }
      );
      expect(result.message).toBe("Book deleted successfully");
    });
  });

  describe("searchBooks", () => {
    test("should search books with query", async () => {
      const query = "programming";
      const mockResults = [
        { id: 1, title: "Programming 101", author: "Author 1" },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await BooksService.searchBooks(query);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/books/search?q=${encodeURIComponent(query)}`
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe("getBookById", () => {
    test("should fetch a specific book", async () => {
      const bookId = 1;
      const mockBook = {
        id: bookId,
        title: "Test Book",
        author: "Test Author",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBook,
      });

      const result = await BooksService.getBookById(bookId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:5000/api/books/${bookId}`
      );
      expect(result).toEqual(mockBook);
    });
  });
});
