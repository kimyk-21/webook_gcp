import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import axios from 'axios';
import styles from "./Header.module.css";

const BASE_URL = "https://swims.p-e.kr"; // 백엔드 URL 맞게 설정

const Header = () => {
  const { isAuthenticated, setIsAuthenticated, userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // 메뉴 영역을 감싸는 ref 생성

  useEffect(() => {
    console.log("현재 로그인 상태:", isAuthenticated);
    console.log("현재 사용자 정보:", userInfo);
  
    if (isAuthenticated && userInfo) {
      axios.get(`${BASE_URL}/api/search-history/${userInfo.id}`)
        .then(response => {
          setSearchHistory(response.data.map(entry => entry.keyword));
        })
        .catch(error => console.error("검색 기록 불러오기 오류:", error));
    } else {
      console.log("로그인되지 않음 - 검색 기록 불러오지 않음");
      setSearchHistory([]);
    }
  }, [isAuthenticated, userInfo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false); // 메뉴 외부 클릭 시 닫기
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.clear(); // 모든 로컬스토리지 삭제
    setIsAuthenticated(false);
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

    // 로그인 상태에 따른 페이지 이동 처리
  const handleProtectedNavigation = (path) => {
    if (isAuthenticated) {
      navigate(path); // 인증된 경우 해당 경로로 이동
    } else {
      alert("로그인이 필요합니다.");
      navigate("/login"); // 로그인 페이지로 이동
    }
  };

const handleSearchChange = async (e) => {
  const query = e.target.value;
  setSearchQuery(query);

  if (query.trim() === "") {
    setSuggestions([]);
    return;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/books/search`, {
      params: { search: query },
    });

    const books = response.data;

    // 중복 제거 후 자동완성 리스트 업데이트 (제목, 저자, 출판사 포함)
    const filteredSuggestions = books.flatMap((book) => [book.title, book.author, book.publisher])
      .filter((item) => item && item.toLowerCase().includes(query.toLowerCase()));

    setSuggestions([...new Set(filteredSuggestions)]); // 중복 제거
  } catch (error) {
    console.error("검색 오류:", error);
  }
};

const handleSearchSubmit = async (e) => {
  e.preventDefault();
  if (searchQuery.trim() === "") return;

  try {
    // 검색 API 요청 (검색 버튼을 눌렀을 때만 실행)
    const response = await axios.get(`${BASE_URL}/api/books/search`, {
      params: { search: searchQuery },
    });

    console.log("검색 결과:", response.data);

    if (isAuthenticated && userInfo) {
      // 검색 기록 저장
      await axios.post(`${BASE_URL}/api/search-history/${userInfo.id}`, null, { params: { keyword: searchQuery } });
      if (searchQuery.trim() !== "") {
        setSearchHistory((prev) => [...new Set([searchQuery, ...prev])]);
      }
      
    }
  } catch (error) {
    console.error("검색 오류:", error);
  }

  navigate(`/search?query=${searchQuery}`);
  setShowHistory(false);
};

const handleDeleteHistory = async (keyword) => {
  if (!isAuthenticated || !userInfo) return;
  try {
    await axios.delete(`${BASE_URL}/api/search-history/${userInfo.id}/keyword`, { params: { keyword } });
    setSearchHistory(prev => prev.filter(item => item !== keyword));
  } catch (error) {
    console.error("검색 기록 삭제 오류:", error);
  }
};

  const handleClearHistory = async () => {
    if (!isAuthenticated || !userInfo) return;
    try {
      await axios.delete(`${BASE_URL}/api/search-history/${userInfo.id}`);
      setSearchHistory([]);
    } catch (error) {
      console.error("전체 검색 기록 삭제 오류:", error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <Link to="/" className={styles.titleLink}>
          WEbook
        </Link>
      </h1>
      <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowHistory(true)} // 입력창 포커스 시 기록 표시
            onBlur={() => setTimeout(() => setShowHistory(false), 200)} // 기록 닫기 (약간의 지연)
            placeholder="책 제목, 저자, 출판사 검색"
            className={styles.searchInput}
          />
          {showHistory && isAuthenticated && searchHistory.length > 0 && (
            <ul className={styles.historyList}>
              {searchHistory.map((item, index) => (
                <li key={index} className={styles.historyItem}>
                  <span
                    onClick={() => {
                      setSearchQuery(item);
                      setShowHistory(false);
                    }}
                  >
                    {item}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item);
                    }}
                    className={styles.deleteButton}
                  >
                    삭제
                  </button>
                </li>
              ))}
              <li className={styles.clearHistoryItem}>
                <button onClick={handleClearHistory} className={styles.clearButton}>
                  전체 삭제
                </button>
              </li>
            </ul>
          )}
          {suggestions.length > 0 && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((item, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSearchQuery(item);
                    setSuggestions([]);
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className={styles.searchButton}>
          검색
        </button>
      </form>
      <button className={styles.hamburgerMenu} onClick={toggleMenu}>☰</button>
      <nav ref={menuRef} className={`${styles.nav} ${menuOpen ? styles.active : ""}`}>
        <ul className={styles.navList}>
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/"
                  className={styles.navLink}
                  onClick={handleLogout} // 로그아웃 클릭 시 처리
                >
                  로그아웃
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={styles.navLink}>
                  로그인
                </Link>
              </li>
              <li>
                <Link to="/signup" className={styles.navLink}>
                  회원가입
                </Link>
              </li>
            </>
          )}
          <li>
            <Link
              to="/member-info"
              className={styles.navLink}
              onClick={(e) => {
                e.preventDefault();
                handleProtectedNavigation("/member-info"); // 보호된 페이지로 이동
              }}
            >
              회원정보
            </Link>
          </li>
          <li>
            <Link to="/cart" className={styles.navLink}>
              장바구니
            </Link>
          </li>
          <li>
            <Link
              to="/order-history"
              className={styles.navLink}
              onClick={(e) => {
                e.preventDefault();
                handleProtectedNavigation("/order-history"); // 보호된 페이지로 이동
              }}
            >
              구매내역
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;