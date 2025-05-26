import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./OrderPage.module.css";

const BASE_URL = "https://34-64-72-234.nip.io"

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [receiver, setReceiver] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [customPayment, setCustomPayment] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const { user, items = [] } = location.state || { user: null, items: [] };

  useEffect(() => {
    if (user) {
      setUserData(user);
      setReceiver(user.name || "");
      setAddress(user.address || "");
  
      // 결제 방법 자동 설정
      if (user.cardNumber) {
        setPaymentMethod("카드");
        setCustomPayment(user.cardNumber);
      } else if (user.bankAccount) {
        setPaymentMethod("계좌이체");
        setCustomPayment(user.bankAccount);
      } else {
        setPaymentMethod("custom");
        setCustomPayment("");
      }
  
      // 쿠폰 조회 API 호출
      const fetchCoupons = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/coupons/user/${user.id}`, {
            withCredentials: true
          });
          console.log("받아온 쿠폰 데이터:", response.data); // 쿠폰 데이터 확인
      
          const now = new Date();
          const validCoupons = response.data.filter(coupon => {
            //console.log(`쿠폰 코드: ${coupon.code}, 만료일: ${coupon.expiryDate}, 변환된 날짜:`, new Date(coupon.expiryDate));
            return !coupon.used && new Date(coupon.expiryDate) > now;
          });
      
          setUserData(prevData => ({
            ...prevData,
            coupons: validCoupons,
          }));
      
          setSelectedCoupon(validCoupons.length > 0 ? validCoupons[0] : null);
          console.log("유효한 쿠폰:", validCoupons);
        } catch (error) {
          console.error("쿠폰 데이터 가져오기 실패:", error);
        }
      };    
  
      fetchCoupons();
  
      // 예상 배송일 설정
      const today = new Date();
      const deliveryOffset = Math.floor(Math.random() * 2) + 3; // 3~4일 랜덤
      today.setDate(today.getDate() + deliveryOffset);
      const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD 형식
      setExpectedDeliveryDate(formattedDate);
    }
  }, [user]);  

  const handlePaymentChange = (e) => {
    const selectedMethod = e.target.value;
    setPaymentMethod(selectedMethod);

    if (selectedMethod === "카드" && userData?.cardNumber) {
      setCustomPayment(userData.cardNumber);
    } else if (selectedMethod === "계좌이체" && userData?.bankAccount) {
      setCustomPayment(userData.bankAccount);
    } else {
      setCustomPayment(""); // 직접 입력 가능
    }
  };
  
  // 총 가격 계산 (쿠폰 적용)
  const calculateTotalPrice = () => {
    let totalPrice = items.reduce((sum, item) => sum + (item.price || item.book.price) * item.quantity, 0);
    
    if (selectedCoupon && totalPrice >= selectedCoupon.minOrderAmount) {
      if (selectedCoupon.discountAmount > 0) {
        totalPrice -= selectedCoupon.discountAmount;
      }
      if (selectedCoupon.discountPercent > 0) {
        totalPrice -= totalPrice * (selectedCoupon.discountPercent / 100);
      }
    }
    
    return totalPrice;
  }; 

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
  
    if (isSubmitting) return; // 중복 요청 방지
    setIsSubmitting(true);
  
    if (!userData || !userData.id) {
      alert("로그인이 필요합니다.");
      setIsSubmitting(false);
      return;
    }
  
    if (selectedCoupon && calculateTotalPrice() < selectedCoupon.minOrderAmount) {
      alert(`쿠폰을 사용하려면 최소 ${selectedCoupon.minOrderAmount}원 이상 주문해야 합니다.`);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const orderResponse = await axios.post(
        `${BASE_URL}/orders/create`,
        {
          totalPrice: calculateTotalPrice(),
          couponCode: selectedCoupon ? selectedCoupon.code : null,
          items: items.map(item => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
          //receiver: receiver,  // 받는 사람
          address: address,
        },
        { params: { userId: userData.id }, withCredentials: true }
      );  
  
      // orderResponse.data가 문자열이라면 JSON으로 변환
      let orderData = orderResponse.data;
      if (typeof orderData === "string") {
        try {
          orderData = orderData.replace(/,\s*"genres":\s*\]}/g, '}');
          orderData = JSON.parse(orderData);
        } catch (error) {
          console.error("❌ JSON 파싱 오류:", error);
          setIsSubmitting(false);
          return;
        }
      }
  
      // orderId 추출
      const orderId = orderData?.id; // 안전한 접근
      console.log("orderId:", orderId);
      console.log("주문 성공:", orderResponse.data);
  
      // 2️⃣ 결제 요청
      const paymentResponse = await axios.post(
        `${BASE_URL}/payments/pay_process`,
        null,
        {
          params: {
            orderId,
            method: paymentMethod,
            userId: userData.id,
            couponCode: selectedCoupon ? selectedCoupon.code : null
          },
          withCredentials: true,
        }
      );
  
      console.log("결제 성공:", paymentResponse.data);
      setPaymentStatus("결제가 완료되었습니다.");
      setTimeout(() => navigate("/order-history"), 2000);
    } catch (error) {
      console.error("결제 실패:", error.response?.data || error.message);
      setPaymentStatus("결제 실패. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>도서 구매</h1>

      {items.length > 0 ? (
        <div className={styles.itemsContainer}>
          {items.map((item, index) => (
            <div key={item.bookId || index} className={styles.item}>
              <h3>{item.title || item.book.title}</h3>
              <div className={styles.itemDetails}>
                <p className={styles.quantity}>수량: {item.quantity}</p>
                <p className={styles.price}>가격: {(item.price || item.book.price) * item.quantity}원</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>구매할 도서가 없습니다.</p>
      )}

      {/* 결제 폼 */}
      <form onSubmit={handleOrderSubmit} className={styles.orderForm}>
        <div className={styles.formGroup}>
          <label htmlFor="receiver">받는 사람</label>
          <input id="receiver" type="text" value={receiver} onChange={(e) => setReceiver(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address">주소</label>
          <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>

        {/* 결제 방법 */}
        <div className={styles.formGroup}>
          <label htmlFor="paymentMethod">결제 방법</label>
          <select id="paymentMethod" value={paymentMethod} onChange={handlePaymentChange} required>
          {userData?.cardNumber && (
      <option value="카드">신용카드 ({userData.cardType || "카드"})</option>
    )}
    {userData?.bankAccount && (
      <option value="계좌이체">은행 이체</option>
    )}
    {!(userData?.cardNumber || userData?.bankAccount) && (
      <option value="custom">직접 입력</option>
    )}
          </select>
        </div>

<div className={styles.formGroup}>
  <label htmlFor="paymentInfo">결제 정보</label>
  <input
    id="paymentInfo"
    type="text"
    value={customPayment}
    onChange={(e) => setCustomPayment(e.target.value)}
    placeholder="카드 번호 또는 계좌 번호 입력"
    required
  />
</div>
        
{/* 쿠폰 선택 */}
<div className={styles.formGroup}>
        <label htmlFor="coupon">쿠폰 선택</label>
        <select
          id="coupon"
          value={selectedCoupon?.code || ""}
          onChange={(e) => {
            const coupon = userData?.coupons?.find(c => c.code === e.target.value);
            setSelectedCoupon(coupon || null);
          }}
        >
          <option value="">쿠폰 없음</option>
          {userData?.coupons?.map((coupon) => (
            <option key={coupon.code} value={coupon.code}>
              {coupon.code} - 
              {coupon.discountPercent > 0 
                ? `${coupon.discountPercent}% 할인` 
                : `${coupon.discountAmount}원 할인`}
            </option>
          ))}
        </select>
      </div>

        <div className={styles.formGroup}>
          <p>예상 배송일: {expectedDeliveryDate}</p>
        </div>

        {/* 총 금액 */}
        <div className={styles.formGroup}>
          <p>총 금액: {calculateTotalPrice()}원</p>
        </div>

        <div className={styles.buttons}>
          <button type="button" onClick={() => navigate("/cart")} className={styles.cancelButton}>
            결제 취소
          </button>
          <button type="submit" className={styles.submitButton}>
            결제 진행하기
          </button>
        </div>
      </form>

      {paymentStatus && <p>{paymentStatus}</p>}
    </div>
  );
};

export default OrderPage;