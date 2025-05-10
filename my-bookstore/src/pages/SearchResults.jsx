import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./SearchResults.module.css";

const BASE_URL = "https://swims.p-e.kr";
const RATING_URL = "https://swims.p-e.kr/ratings/average"; // 평점 평균 API

const SearchResults = () => {
  const [userInfo, setUserInfo] = useState(null); // 사용자 정보 상태 추가
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({
    category: "all",
    additionalCategory: "all",
    additionalQuery: "",
    genres: [],
    sortBy: "title",
    sortOrder: "asc",
  });
  const [averageRatings, setAverageRatings] = useState({}); // 각 도서의 평균 평점을 저장

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem("loggedInUserId"); 
        const response = await axios.post(`${BASE_URL}/api/infofind`, null, {
          params: { userId }
        });
        console.log("회원 정보:", response.data);
        setUserInfo(response.data);
      } catch (error) {
        console.error("회원 정보 가져오기 실패", error);
        setUserInfo(null);
      }
    };

    fetchUserInfo();
  }, []);

  const { search } = useLocation();
  const navigate = useNavigate();

  // 도서 목록과 평균 평점을 가져오는 함수
  const fetchBooks = useCallback(async () => {
    const queryParams = new URLSearchParams(search);
    const query = queryParams.get("query") || "";
    const { category, additionalCategory, additionalQuery, genres, sortBy, sortOrder } = filters;

    if (!query) return;

    try {
      let responses = [];

      // 제목, 작가, 출판사별로 검색
      if (category === "all" || category === "title") {
        const titleRes = await axios.get(`${BASE_URL}/api/books/search`, {
          params: { userId: userInfo?.id, title: query },
        });
        responses.push(...titleRes.data);
      }

      if (category === "all" || category === "author") {
        const authorRes = await axios.get(`${BASE_URL}/api/books/search`, {
          params: { userId: userInfo?.id, author: query },
        });
        responses.push(...authorRes.data);
      }

      if (category === "all" || category === "publisher") {
        const publisherRes = await axios.get(`${BASE_URL}/api/books/search`, {
          params: { userId: userInfo?.id, publisher: query },
        });
        responses.push(...publisherRes.data);
      }

      // 중복 제거 (bookId 기준)
      let uniqueBooks = Array.from(new Map(responses.map(book => [book.bookId, book])).values());

      // 세부 검색 필터링
      if (additionalQuery) {
        uniqueBooks = uniqueBooks.filter(book => {
          if (additionalCategory === "title") return book.title.toLowerCase().includes(additionalQuery.toLowerCase());
          if (additionalCategory === "author") return book.author.toLowerCase().includes(additionalQuery.toLowerCase());
          if (additionalCategory === "publisher") return book.publisher.toLowerCase().includes(additionalQuery.toLowerCase());
          return true;
        });
      }

      // 장르 필터링
      if (genres.length > 0) {
        uniqueBooks = uniqueBooks.filter(book => genres.includes(book.genre));
      }

      // 평균 평점 가져오기
      const ratings = await fetchAverageRatings(uniqueBooks);

      // 정렬 적용
      const sortedBooks = uniqueBooks.sort((a, b) => {
        if (sortBy === "rating") {
          // 평점순 정렬 (숫자 비교)
          const ratingA = averageRatings[a.bookId] || 0; // 평점 없으면 0으로 처리
          const ratingB = averageRatings[b.bookId] || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA; // 오름차순/내림차순
        } else if (sortBy === "comments") {
          // 리뷰순 정렬 (리뷰 개수 기준)
          const commentsA = a.commentCount || 0;
          const commentsB = b.commentCount || 0;
          return sortOrder === "asc" ? commentsA - commentsB : commentsB - commentsA; // 오름차순/내림차순
        } else {
          // 제목순, 작가순, 출판사명순 (문자열 비교)
          const fieldA = a[sortBy]?.toLowerCase() || "";
          const fieldB = b[sortBy]?.toLowerCase() || "";
          return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        }
      });
      
      setBooks(sortedBooks);
    } catch (error) {
      console.error("검색 오류:", error);
    }
  }, [search, filters, userInfo]);

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

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="category">검색 범위</label>
            <select id="category" value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)}>
              <option value="all">전체</option>
              <option value="title">제목</option>
              <option value="author">작가</option>
              <option value="publisher">출판사</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="additionalCategory">세부 검색</label>
            <select id="additionalCategory" value={filters.additionalCategory} onChange={(e) => handleFilterChange("additionalCategory", e.target.value)}>
              <option value="all">전체</option>
              <option value="title">제목</option>
              <option value="author">작가</option>
              <option value="publisher">출판사</option>
            </select>
            <input
              type="text"
              className={styles.input}
              placeholder="추가 검색어 입력"
              value={filters.additionalQuery}
              onChange={(e) => handleFilterChange("additionalQuery", e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>장르</label>
            {["고전", "동화", "디스토피아", "전후소설", "풍자"].map((genre) => (
              <label key={genre}>
                <input
                  type="checkbox"
                  value={genre}
                  checked={filters.genres.includes(genre)}
                  onChange={(e) => {
                    handleFilterChange("genres", e.target.checked ? [...filters.genres, genre] : filters.genres.filter((g) => g !== genre));
                  }}
                />
                {genre}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.booksWrapper}>
          <div className={styles.sortWrapper}>
            <select value={filters.sortBy} onChange={(e) => handleFilterChange("sortBy", e.target.value)}>
              <option value="title">제목순</option>
              <option value="author">작가명순</option>
              <option value="publisher">출판사명순</option>
              <option value="rating">평점순</option>
              <option value="comments">리뷰순</option>
            </select>
            <select value={filters.sortOrder} onChange={(e) => handleFilterChange("sortOrder", e.target.value)}>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
          <div className={styles.bookList}>
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book.bookId} className={styles.bookCard} 
                onClick={() => handleBookClick(book.bookId)}>
                    <img 
                      src={`${BASE_URL}${book.imageUrl}`} 
                      alt={book.title} 
                      className={styles.bookImage} 
                      onError={(e) => (e.target.src = "/fallback-image.jpg")} 
                    />
                    <h3>{book.title}</h3>
                    <p>저자: {book.author}</p>
                    <p>출판사: {book.publisher}</p>
                    <p>가격: {book.price}원</p>
                    <p>장르: {book.genre}</p>
                    <p>평균 평점: {averageRatings[book.bookId] ? averageRatings[book.bookId].toFixed(1) : "없음"}</p>
                    <p>리뷰: {book.commentCount}개</p>
                </div>
              ))
            ) : (
              <p>검색 결과가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
