import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../App"; // AuthContext 가져오기
import styles from "./BookDetailPage.module.css";

const BASE_URL = "https://34-64-72-234.nip.io"; 

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loggedInUser } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState(null); // 사용자 정보 상태

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
  

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/books`)
      .then((response) => {
        console.log("받은 데이터:", response.data); // 데이터 확인
  
        const selectedBook = response.data.find((book) => book.bookId === Number(id));
        if (selectedBook) {
          setBook(selectedBook);
          console.log("선택된 도서:", selectedBook); // 특정 책 확인
        } else {
          setError("도서를 찾을 수 없습니다.");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("도서 정보를 불러오는 중 오류 발생:", error);
        setError("도서를 찾을 수 없습니다.");
        setLoading(false);
      });

    // 평균 평점 불러오기
    axios.get(`${BASE_URL}/ratings/average?bookId=${id}`)
    .then((response) => {
      setAverageRating(response.data);
    })
    .catch((error) => {
      console.error("평균 평점 가져오기 실패:", error);
    });

    // 댓글 목록 가져오기
    //if (!userInfo?.id) return; // userInfo가 없으면 요청을 보내지 않음

    axios.get(`${BASE_URL}/api/comments/book/${id}`)
      .then((response) => {
        setReviews(response.data);
      })
      .catch((error) => {
        console.error("댓글 목록 가져오기 실패:", error);
      });

  }, [id]);

  if (loading) return <div className={styles.container}>로딩 중...</div>;
  if (error) return <div className={styles.container}>{error}</div>;

  const handleAddRating = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (rating < 1 || rating > 5) {
      alert("평점은 1에서 5 사이여야 합니다.");
      return;
    }
    axios.post(`${BASE_URL}/ratings`, null, {
      params: {
        userId: userInfo.id,
        bookId: book.bookId,
        score: rating,
      },
    })
    .then(() => {
      alert("평점이 등록되었습니다.");
      // 평균 평점 갱신
      setAverageRating((prev) => {
        const totalReviews = reviews.length + 1; // 기존 리뷰 + 이번 평점
        const newAverage = ((averageRating * reviews.length) + rating) / totalReviews;
        return newAverage;
      });
    })
    .catch((error) => {
      console.error("평점 등록 중 오류 발생:", error);
    });
  };

  const handleAddToCart = async () => {
    if (!userInfo?.id) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
  
    try {
      await axios.post(`${BASE_URL}/api/cart/add`, null, {
        params: {
          userId: userInfo.id,
          bookId: book.bookId,
          quantity: 1,
        },
      });
  
      if (window.confirm("장바구니에 추가되었습니다! 장바구니로 이동하시겠습니까?")) {
        navigate("/cart");
      }
    } catch (error) {
      console.error("장바구니 추가 실패:", error);
    }
  };
  

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
  
    if (!userInfo || !userInfo.id) {
      alert("사용자 정보를 불러올 수 없습니다.");
      return;
    }
  
    console.log("구매 페이지로 이동할 사용자 정보:", userInfo);
  
    navigate("/order", {
      state: {
        userId: userInfo.id,  // 이제 숫자 userId가 들어감!
        user: userInfo,
        items: [{ ...book, quantity: 1 }],
      },
    });
  };

  const handleAddComment = (event) => {
    event.preventDefault(); // 기본 폼 제출 동작 방지
    
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
  
    axios.post(`${BASE_URL}/api/comments/${book.bookId}`, null, {
      params: { userId: userInfo.id, content: comment },
    })
    .then(response => {
      setReviews([...reviews, response.data]);
      setComment(""); // 댓글 초기화
    })
    .catch(error => console.error("댓글 추가 중 오류 발생:", error));
  };
  

  const handleUpdateComment = (commentId, newContent) => {
    axios.put(`${BASE_URL}/api/comments/${commentId}`, null, {
      params: { userId: userInfo.id, newContent }
    })
    .then(response => {
      setReviews(reviews.map(review => review.commentId === commentId ? response.data : review));
    })
    .catch(error => console.error("댓글 수정 중 오류 발생:", error));
  };

  const handleDeleteComment = (commentId) => {
    axios.delete(`${BASE_URL}/api/comments/${commentId}`, {
      params: { userId: userInfo.id }
    })
    .then(() => {
      setReviews(reviews.filter(review => review.commentId !== commentId));
    })
    .catch(error => console.error("댓글 삭제 중 오류 발생:", error));
  };

  return (
    <div className={styles.container}>
      <h2>{book.title}</h2>
      <img 
        src={`https://34-64-72-234.nip.io${book.imageUrl}`} 
        alt={book.title} 
        className={styles.bookImage} 
        onError={(e) => e.target.src = "/fallback-image.jpg"} // 기본 이미지 표시
      />
      <p>저자: {book.author}</p>
      <p>출판사: {book.publisher}</p>
      {/* <p>출판년도: {book.year}</p> */}
      <p>가격: {book.price}원</p>
      {/* <p>{book.stock > 0 ? `재고 있음 (${book.stock}개)` : "재고 없음"}</p> */}
      <p>장르: {book?.genre || "정보 없음"}</p>
      <div className={styles.buttons}>
      <button className={styles.addToCartButton} onClick={handleAddToCart}>
        장바구니 담기
      </button>
      <button className={styles.buyNowButton} onClick={handleBuyNow}>
        바로 구매하기
      </button>
      </div>
      <div className={styles.ratingSection}>
        <h3>평점</h3>
        <div>
          <span>평균 평점: {averageRating.toFixed(1)}</span>
        </div>
        <form className={styles.reviewForm}>
          <label>
            평점:
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} required>
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>{star}</option>
              ))}
            </select>
          </label>
        </form>
        <button onClick={handleAddRating} className={styles.submitRatingButton}>
          평점 등록
        </button>
      </div>

      <div className={styles.reviewsSection} id="reviews">
        <h3>리뷰</h3>
        {reviews.length > 0 ? (
          <ul>
            {reviews.map(review => (
              
              <li key={review.commentId}>
                <div className={styles.reviewButtons}> 
                <div>
                <strong>{review.user.name}:</strong> {review.content}
                </div>
                <div>
                {review.user.id === userInfo?.id && (
                  <>
                    <button className={styles.editReviewButton} onClick={() => handleUpdateComment(review.commentId, prompt("수정할 내용을 입력하세요:", review.content))}>수정</button>
                    <button className={styles.removeReviewButton} onClick={() => handleDeleteComment(review.commentId)}>삭제</button>
                  </>
                )}
                </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>등록된 리뷰가 없습니다.</p>
        )}

        <form className={styles.reviewForm}>
          <label>
            댓글:
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </label>
          <button type="button" onClick={handleAddComment} className={styles.submitReviewButton}>
            리뷰 등록
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookDetailPage;