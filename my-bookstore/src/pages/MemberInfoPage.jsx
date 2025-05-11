import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './MemberInfoPage.module.css';
import { AuthContext } from '../App';

const BASE_URL = "https://34-64-72-234.nip.io"; // 백엔드 URL 맞게 설정 

const MemberInfoPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);  // AuthContext에서 userInfo 받아오기
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [interests, setInterests] = useState([]); // 관심사 상태
  const [password, setPassword] = useState(''); // 비밀번호 상태
  const [userInfoState, setUserInfoState] = useState(userInfo || {}); // userInfo 상태 관리

  const [coupons, setCoupons] = useState([]); // 쿠폰 리스트 상태
  const [newCouponUserId, setNewCouponUserId] = useState('');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscountAmount, setNewCouponDiscountAmount] = useState(0);
  const [newCouponDiscountPercent, setNewCouponDiscountPercent] = useState(0);
  const [newCouponMinOrderAmount, setNewCouponMinOrderAmount] = useState(0); // 최소 주문 금액 상태 추가
  const [newCouponExpiry, setNewCouponExpiry] = useState('');

  const [comments, setComments] = useState([]);  // 댓글 상태 추가

  //const userId = userInfo.id;  // userInfo.id를 userId로 할당


  useEffect(() => {
    if (userInfo?.id) {
      fetchUserInfo();
      fetchUserCoupons();
      fetchUserInterests(userInfo.id);
      fetchUserComments(userInfo.id);  // 댓글 가져오기
    }
  }, [userInfo]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/infofind`, null, {
        params: { userId: userInfo.email }
      });

      console.log("회원 정보:", response.data);
      setUserInfoState(response.data); // 상태 업데이트
    } catch (error) {
      console.error("회원 정보 가져오기 실패", error);
      alert("회원 정보를 불러올 수 없습니다.");
    }
  };

    // 사용자의 보유 쿠폰 리스트 가져오기
    const fetchUserCoupons = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/coupons/user/${userInfo.id}`);
        setCoupons(response.data);
      } catch (error) {
        console.error("쿠폰 조회 실패", error);
      }
    };
  
    // 쿠폰 생성 (관리자만 가능)
// 쿠폰 생성 (관리자만 가능)
const createCoupon = async () => {
  if (userInfo.email !== 'kimyk.test@gmail.com') {
    alert("관리자만 쿠폰을 생성할 수 있습니다.");
    return;
  }

  if (!newCouponCode || (!newCouponDiscountAmount && !newCouponDiscountPercent) || !newCouponExpiry || !newCouponMinOrderAmount) {
    alert("모든 필드를 채워주세요.");
    return;
  }

  if (newCouponDiscountAmount > 0 && newCouponDiscountPercent > 0) {
    alert("할인 금액과 할인 비율은 동시에 입력할 수 없습니다.");
    return;
  }

  const expiryDateWithTime = new Date(newCouponExpiry);
  expiryDateWithTime.setHours(0, 0, 0, 0);
  const formattedExpiryDate = expiryDateWithTime.toISOString().split('T')[0] + ' 00:00:00';

  try {
    const couponRequest = {
      userId: newCouponUserId || userInfo.id,  // 관리자일 경우 다른 사용자의 userId를 입력받음
      code: newCouponCode,
      discountAmount: newCouponDiscountAmount,
      discountPercent: newCouponDiscountPercent,
      minOrderAmount: newCouponMinOrderAmount,
      expiryDate: formattedExpiryDate
    };

    console.log("보낼 데이터:", couponRequest); // 콘솔에 출력

    await axios.post(`${BASE_URL}/coupons/create`, couponRequest);
    alert("쿠폰이 생성되었습니다.");
    setNewCouponCode('');
    setNewCouponDiscountAmount(0);
    setNewCouponDiscountPercent(0);
    setNewCouponExpiry('');
    setNewCouponMinOrderAmount(0);
    fetchUserCoupons();
  } catch (error) {
    console.error("쿠폰 생성 실패", error);
    console.error("응답 데이터:", error.response?.data); // 에러 응답 데이터 확인
    alert("쿠폰 생성 중 오류가 발생했습니다.");
  }
};

    const fetchUserInterests = async (id) => {
      try {
        const response = await axios.get(`${BASE_URL}/member/MyPage/${id}/interests`);
        setInterests(response.data || []);
      } catch (error) {
        console.error("관심 분야 가져오기 실패", error);
        setInterests([]);
      }
    };
  
    const addInterest = async () => {
      if (!newInterest.trim()) {
        alert("관심 분야를 입력하세요.");
        return;
      }
  
      if (!userInfoState || !userInfoState.id) {
        console.error("유저 정보가 올바르게 로드되지 않음", userInfoState);
        alert("유저 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
        return;
      }
  
      try {
        console.log("관심 분야 추가 요청:", userInfoState.id, newInterest); // 디버깅용 로그
  
        const response = await axios.post(
          `${BASE_URL}/member/MyPage/${userInfoState.id}/add_interests`,  // 🔥 숫자 ID 사용!
          null,
          { params: { genre: newInterest } }
        );
  
        if (response.status === 201) {
          setNewInterest('');
          fetchUserInterests(userInfoState.id); // 숫자 ID 사용!
        }
      } catch (error) {
        console.error("관심 분야 추가 실패", error.response?.data || error.message);
        alert(error.response?.data?.message || "관심 분야 추가 중 오류가 발생했습니다.");
      }
    };
  
    const deleteInterest = async (genre) => {
      try {
        await axios.delete(`${BASE_URL}/member/MyPage/${userInfoState.id}/delete_interests`, {
          params: { genre },
        });
        fetchUserInterests(userInfoState.id);
      } catch (error) {
        console.error("관심 분야 삭제 실패", error);
      }
    };

    const fetchUserComments = async (userId) => {
      try {
        const response = await axios.get(`${BASE_URL}/api/comments/user/${userId}`);
        setComments(response.data || []);
      } catch (error) {
        console.error("댓글 가져오기 실패", error);
      }
    };
  
    const handleCommentClick = (bookId) => {
      // 도서 상세 페이지로 이동
      navigate(`/book/${bookId}`);
    };
  
    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setUserInfoState({ ...userInfoState, [name]: value });
    };
  
    const calculateAge = (birthDate) => {
      if (!birthDate) return '';
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };
  
    const handleBirthDateChange = (e) => {
      const newBirthDate = e.target.value;
      setUserInfoState({
        ...userInfoState,
        birthDate: newBirthDate,
        age: calculateAge(newBirthDate), // 생년월일 변경 시 나이 자동 업데이트
      });
    };
  
    const formatPhoneNumber = (value) => {
      const cleaned = value.replace(/\D/g, ''); // 숫자만 남기고 제거
      if (cleaned.length <= 3) return cleaned;  // 3자리 이하일 때는 그냥 출력
      if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;  // 4~7자리까지는 첫 번째 하이픈 추가
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;  // 8자리 이상일 때 하이픈 두 개 추가
    };
  
    const handlePhoneNumberChange = (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setUserInfoState({ ...userInfoState, phoneNumber: formatted });
    };
  
    const toggleEditing = () => {
      setIsEditing(!isEditing);
    };
  
    const saveUserInfo = async () => {
      if (!password.trim()) {
        alert("비밀번호를 입력하세요.");
        return;
      }
      try {
        const token = localStorage.getItem("authToken"); // 로그인 토큰 가져오기
  
        const requestBody = {
          name: userInfoState.name,
          email: userInfoState.email,
          phoneNumber: userInfoState.phoneNumber,
          address: userInfoState.address,
          birthDate: userInfoState.birthDate,
          age: userInfoState.age, // 나이도 같이 저장
          cardType: userInfoState.cardType, // 결제 정보 추가
          cardNumber: userInfoState.cardNumber, // 결제 정보 추가
          bankAccount: userInfoState.bankAccount, // 계좌번호 추가
        };
  
        const response = await axios.put(
          `${BASE_URL}/member/MyPage/${userInfoState.email}?password=${password}`, // 비밀번호 포함
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
  
        console.log("회원 정보 수정 성공:", response);
        alert("회원 정보가 수정되었습니다.");
        setIsEditing(false);
        fetchUserInfo(); // 수정 후 정보 새로고침
      } catch (error) {
        //console.log("보내는 데이터:", userInfoState);
        //console.log("보내는 비밀번호:", password);
        console.error("회원 정보 수정 실패", error.response || error);
        alert("회원 정보 수정 실패: " + (error.response?.data?.message || "오류 발생"));
      }
    };
  
    const handleDeleteAccount = () => {
      navigate("/account-delete");
    };  

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>회원 정보 관리</h2>
      {userInfoState ? (
        <div className={styles.infoBox}>
          <div className={styles.infoItem}>
            <strong>이름:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="name" 
                value={userInfoState.name} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.name}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>생년월일:</strong>
            {isEditing ? (
              <input
                type="date"
                name="birthDate"
                value={userInfoState.birthDate}
                onChange={handleBirthDateChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.birthDate}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>나이:</strong>
            {isEditing ? (
              <input 
                type="number" 
                name="age" 
                value={userInfoState.age} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.age}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>이메일:</strong>
            {isEditing ? (
              <input 
                type="email" 
                name="email" 
                value={userInfoState.email} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.email}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>전화번호:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="phoneNumber" 
                value={userInfoState.phoneNumber} 
                onChange={handlePhoneNumberChange} 
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.phoneNumber}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>주소:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="address" 
                value={userInfoState.address} 
                onChange={handleEditChange} 
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.address}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>카드 타입:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="cardType" 
                value={userInfoState.cardType || ''} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.cardType || '등록된 카드 없음'}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>카드 번호:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="cardNumber" 
                value={userInfoState.cardNumber || ''} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.cardNumber ? `****-****-****-${userInfoState.cardNumber.slice(-4)}` : '등록된 카드 없음'}</span>
            )}
          </div>

          <div className={styles.infoItem}>
            <strong>계좌 번호:</strong>
            {isEditing ? (
              <input 
                type="text" 
                name="bankAccount" 
                value={userInfoState.bankAccount || ''} 
                onChange={handleEditChange}
                className={styles.input}
              />
            ) : (
              <span>{userInfoState.bankAccount || '등록된 계좌 없음'}</span>
            )}
          </div>

          {/* 비밀번호 부분, 편집 모드일 때만 보이도록 수정 */}
          {isEditing && (
            <div className={styles.infoItem}>
              <strong>비밀번호:</strong>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                className={styles.input}
              />
            </div>
          )}
<div className={styles.infoItem}>
  <strong>보유 쿠폰:</strong>
  {coupons.length > 0 ? (
    <ul className={styles.infoList}>
      {coupons.map((coupon) => {
        const isExpired = new Date(coupon.expiryDate) < new Date(); // 유효기간 지난 쿠폰 확인
        return (
          <li className={styles.commentItem} key={coupon.id}>
            {coupon.code} - {coupon.minOrderAmount}원 이상 구매 시 
            {coupon.discountAmount > 0 
              ? ` ${coupon.discountAmount}원 할인` 
              : ` ${coupon.discountPercent}% 할인`} 
            {coupon.used ? " (사용완료)" : isExpired ? " (사용불가)" : " (사용가능)"}
            <br />
            <span>유효기간: {new Date(coupon.expiryDate).toISOString().split("T")[0]}</span>
            <br />
          </li>
        );
      })}
    </ul>
  ) : (
    <p>보유한 쿠폰이 없습니다.</p>
  )}
</div>

          {userInfoState.email === 'kimyk.test@gmail.com' && (
            <div className={styles.createCouponForm}>
              <h3>쿠폰 생성</h3>
              <input 
                type="text" 
                placeholder="쿠폰 코드" 
                value={newCouponCode} 
                onChange={(e) => setNewCouponCode(e.target.value)} 
                className={styles.input} 
              />
              <strong>대상 사용자 ID:</strong>
              <input 
                type="text" 
                placeholder="대상 사용자 ID"
                value={newCouponUserId} 
                onChange={(e) => setNewCouponUserId(e.target.value)} // 새로운 state로 관리
                className={styles.input} 
              />
              <strong>할인 금액:</strong>
              <input 
                type="text" 
                placeholder="할인 금액" 
                value={newCouponDiscountAmount} 
                onChange={(e) => setNewCouponDiscountAmount(Number(e.target.value))} 
                className={styles.input} 
              />
              <strong>할인 비율(%):</strong>
              <input 
                type="text" 
                placeholder="할인 비율(%)" 
                value={newCouponDiscountPercent} 
                onChange={(e) => setNewCouponDiscountPercent(Number(e.target.value))} 
                className={styles.input} 
              />
              <strong>최소 주문 금액:</strong>
              <input 
                type="text" 
                placeholder="최소 주문 금액" 
                value={newCouponMinOrderAmount} 
                onChange={(e) => setNewCouponMinOrderAmount(Number(e.target.value))}  // 최소 주문 금액 상태 변경
                className={styles.input} 
              />
              <strong>만료 날짜:</strong>
              <input 
                type="date" 
                placeholder="만료 날짜" 
                value={newCouponExpiry} 
                onChange={(e) => setNewCouponExpiry(e.target.value)} 
                className={styles.input} 
              />
              <button onClick={createCoupon} className={styles.button}>쿠폰 생성</button>
            </div>
          )}

          <div className={styles.reviewsBox}>
          <h3 className={styles.h3}>작성한 댓글</h3>
            {comments.length > 0 ? (
              <ul className={styles.infoList}>
                {comments.map((comment) => (
                  <li
                    key={comment.commentId}
                    onClick={() => handleCommentClick(comment.book.bookId)}  // 댓글 클릭 시 도서 상세로 이동
                    className={styles.commentItem}
                  >
                    {comment.book.title}에 남긴 댓글: {comment.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p>작성한 댓글이 없습니다.</p>
            )}
          </div>
          
          <div className={styles.interestsBox}>
            <h3 className={styles.h3}>도서 관심 분야</h3>
              {interests.map((interest, index) => (
                <div key={index} className={styles.interestItem}>
                  <span>{interest}</span>
                  {isEditing && <button onClick={() => deleteInterest(interest)}>삭제</button>}
                </div>
              ))}

            {isEditing && (
              <div className={styles.interestsForm}>
                <input 
                  type="text" 
                  placeholder="새 관심 분야 추가"
                  value={newInterest} 
                  onChange={(e) => setNewInterest(e.target.value)} 
                  className={styles.input}
                />
                <button onClick={addInterest}>추가</button>
              </div>
            )}
          </div>

          <div className={styles.buttons}>
          <button onClick={toggleEditing} className={styles.toggleButton}>
            {isEditing ? '수정 완료' : '정보 수정'}
          </button>

          {isEditing && <button onClick={saveUserInfo} className={styles.toggleButton}>
            저장</button>}
          </div>
        </div>
      ) : (
        <p>로딩 중...</p>
      )}

      <div className={styles.deleteAccountContainer}>
        <span className={styles.deleteAccountText} onClick={handleDeleteAccount}>
          회원 탈퇴
        </span>
      </div>
    </div>
  );
};

export default MemberInfoPage;
