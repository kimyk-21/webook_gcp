import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CartPage.module.css";

const BASE_URL = "http://3.94.201.0:8080"; // 백엔드 URL

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(true);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem("loggedInUserId");
        const response = await axios.post(`${BASE_URL}/api/infofind`, null, {
          params: { userId },
        });
        setUserInfo(response.data);
      } catch (error) {
        console.error("사용자 정보 가져오기 실패", error);
      }
    };

    fetchUserInfo();
  }, []);

  // 장바구니 정보 가져오기
  useEffect(() => {
    const fetchCart = async () => {
      if (!userInfo?.id) return;
  
      try {
        const response = await axios.get(`${BASE_URL}/api/cart/${userInfo.id}`);
        console.log(response.data); // 응답 데이터 로깅
        setCartItems(response.data.items || []);
        setSelectedItems(response.data.items.map((item) => item.book.bookId)); // 수정된 부분
      } catch (error) {
        console.error("장바구니 조회 실패:", error);
      }
    };
  
    if (userInfo) {
      fetchCart();
    }
  }, [userInfo]);

  // 수량 변경
  const handleQuantityChange = async (bookId, newQuantity) => {
    try {
      await axios.put(`${BASE_URL}/api/cart/update/${bookId}`, null, {
        params: { userId: userInfo.id, quantity: newQuantity },
      });

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.book.bookId === bookId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error("수량 변경 실패:", error);
    }
  };

  // 장바구니 항목 삭제
  const handleRemoveFromCart = async () => {
    try {
      await Promise.all(
        selectedItems.map((bookId) =>
          axios.delete(`${BASE_URL}/api/cart/remove/${bookId}`, {
            params: { userId: userInfo.id },
          })
        )
      );

      setCartItems(cartItems.filter((item) => !selectedItems.includes(item.book.bookId)));
      setSelectedItems([]);
    } catch (error) {
      console.error("장바구니 삭제 실패:", error);
    }
  };

  // 항목 선택
  const handleSelectItem = (bookId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(bookId)
        ? prevSelected.filter((id) => id !== bookId)
        : [...prevSelected, bookId]
    );
  };

  // 전체 선택
  const handleSelectAll = () => {
    setIsSelectAll(!isSelectAll);
    setSelectedItems(isSelectAll ? [] : cartItems.map((item) => item.book.bookId));
  };

  // 선택된 상품 구매
  const handleBuySelectedItems = () => {
    const selectedBooks = cartItems.filter((item) =>
      selectedItems.includes(item.book.bookId)
    );
  
    if (selectedBooks.length === 0) {
      alert("선택된 상품이 없습니다.");
      return;
    }
  
    if (!userInfo || !userInfo.id) {
      alert("사용자 정보를 불러올 수 없습니다.");
      return;
    }
  
    console.log("🔍 구매 페이지로 이동할 사용자 정보:", userInfo);
  
    navigate("/order", {
      state: {
        userId: userInfo.id,
        user: userInfo,
        items: selectedBooks.map(item => ({
          bookId: item.book.bookId, // ✅ bookId만 사용하도록 변환
          title: item.book.title,
          price: item.book.price,
          quantity: item.quantity,
        })),
      },
    });
  };  

  // 전체 구매
  const handleBuyAllItems = () => {
    if (cartItems.length === 0) {
      alert("장바구니가 비어 있습니다.");
      return;
    }
  
    if (!userInfo || !userInfo.id) {
      alert("사용자 정보를 불러올 수 없습니다.");
      return;
    }
  
    console.log("🔍 구매 페이지로 이동할 사용자 정보:", userInfo);
  
    navigate("/order", {
      state: {
        userId: userInfo.id,
        user: userInfo,
        items: cartItems.map(item => ({
          bookId: item.book.bookId, // ✅ bookId만 사용하도록 변환
          title: item.book.title,
          price: item.book.price,
          quantity: item.quantity,
        })),
      },
    });
  };
  

  // 총 금액 계산
  const calculateTotalPrice = () => {
    return selectedItems.reduce((total, id) => {
      const item = cartItems.find((item) => item.book.bookId === id);
      return total + (item?.book.price || 0) * (item?.quantity || 1);
    }, 0);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>장바구니</h2>
      {cartItems.length > 0 ? (
        <>
          <div className={styles.selectAllContainer}>
            <div className={styles.selectAllLeft}>
              <input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} />
              <label>전체 선택</label>
            </div>
            <div className={styles.selectAllRight}>
              <button className={styles.deleteCartButton} onClick={handleRemoveFromCart}>
                삭제
              </button>
            </div>
          </div>
          {cartItems.map((item) => (
            <div key={item.book.bookId} className={styles.cartItem}>
              <input
                type="checkbox"
                checked={selectedItems.includes(item.book.bookId)}
                onChange={() => handleSelectItem(item.book.bookId)}
              />
              <p><strong>도서명:</strong> {item.book.title}</p>
              <p>
                <strong>수량:</strong>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) => handleQuantityChange(item.book.bookId, +e.target.value)}
                  className={styles.quantityInput}
                />
              </p>
              <p><strong>가격:</strong> {item.book.price * item.quantity}원</p>
            </div>
          ))}
          <div className={styles.actions}>
            <button className={styles.buySelectedButton} onClick={handleBuySelectedItems}>
              선택 구매
            </button>
            <button className={styles.buyAllButton} onClick={handleBuyAllItems}>
              전체 구매
            </button>
          </div>
          <div className={styles.totalPrice}>
            <strong>총 금액: </strong>{calculateTotalPrice()}원
          </div>
        </>
      ) : (
        <p className={styles.emptyMessage}>장바구니가 비어 있습니다.</p>
      )}
    </div>
  );
};

export default CartPage;
