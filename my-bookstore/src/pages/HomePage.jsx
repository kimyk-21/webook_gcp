import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./HomePage.module.css";

const BASE_URL = "https://34-64-72-234.nip.io/api/books"; // 백엔드 API 주소
const RATING_URL = "https://34-64-72-234.nip.io/ratings/average"; // 평점 평균 API 주소

const HomePage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [averageRatings, setAverageRatings] = useState({}); // 각 도서의 평균 평점을 저장

  useEffect(() => {
    fetchBooks();
  }, []);

  // 도서 목록을 가져오는 함수
  const fetchBooks = async () => {
    try {
      const response = await axios.get(BASE_URL);
      setBooks(response.data);
      // 도서 목록을 가져온 후 평균 평점도 함께 가져오기
      fetchAverageRatings(response.data);
    } catch (error) {
      console.error("도서 목록을 불러오는 데 실패했습니다.", error);
    }
  };

  // 각 도서에 대한 평균 평점을 가져오는 함수
  const fetchAverageRatings = async (books) => {
    const ratings = {};
    for (const book of books) {
      try {
        const response = await axios.get(RATING_URL, { params: { bookId: book.bookId } });
        ratings[book.bookId] = response.data;
      } catch (error) {
        console.error(`평점 정보를 가져오는 데 실패했습니다. bookId: ${book.bookId}`, error);
      }
    }
    setAverageRatings(ratings); // 평점 정보를 상태에 저장
  };

  // 장르별 필터링
  const filterBooksByGenre = (genre) => {
    setSelectedGenre(genre);
  };

  // 도서 클릭 시 상세 페이지로 이동
  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className={styles.container}>
      <main>
        {/* 장르 탭 */}
        <div className={styles.genreTabs}>
          {["all", "고전", "동화", "디스토피아", "전후소설", "풍자"].map((genre) => (
            <button 
              key={genre}
              className={selectedGenre === genre ? styles.selectedTab : ""} 
              onClick={() => filterBooksByGenre(genre)}
            >
              {genre === "all" ? "전체" : genre}
            </button>
          ))}
        </div>

        {/* 도서 목록 */}
        <div className={styles.bookList}>
          {books.length > 0 ? (
            books
              .filter((book) => selectedGenre === "all" || book.genre === selectedGenre)
              .map((book, index) => (
                <div 
                  key={book.id || `book-${index}`} 
                  className={styles.bookItem} 
                  onClick={() => handleBookClick(book.bookId)}
                >
                  {/* 도서 이미지 */}
                  <img 
                    src={`https://34-64-72-234.nip.io${book.imageUrl}`} 
                    alt={book.title} 
                    className={styles.bookImage} 
                    onError={(e) => e.target.src = "/fallback-image.jpg"} 
                  />
                  
                  {/* 도서 정보 */}
                  <div className={styles.bookInfo}>
                    <div className={styles.bookTitle}>{book.title}</div>
                    <div className={styles.bookMeta}>{book.author} | {book.publisher}</div>
                    <div className={styles.bookPrice}>
                      {book.price}원
                      <span className={styles.bookRating}>
                        {averageRatings[book.bookId] ? 
                          `⭐️${averageRatings[book.bookId].toFixed(1)}점` : "⭐️0"} 
                        ({book.commentCount}개)
                      </span>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p>도서를 불러오는 중입니다...</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;