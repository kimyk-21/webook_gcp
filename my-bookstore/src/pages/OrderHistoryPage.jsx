import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./OrderHistoryPage.module.css";
import { AuthContext } from "../App"; // AuthContext 가져오기

const BASE_URL = "https://34-64-72-234.nip.io"; 

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext); // userInfo 전역 상태 가져오기

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userInfo || !userInfo.id) {
        console.warn("userId가 없습니다. 로그인 필요");
        setLoading(false);
        return;
      }

      try {
        console.log("주문 내역 요청 userId:", userInfo.id);
        // 주문 내역 API 호출
        const response = await axios.get(`${BASE_URL}/orders/user/${userInfo.id}`);
        const ordersData = response.data;

        // 사용자의 쿠폰 목록 가져오기
        const couponResponse = await axios.get(`${BASE_URL}/coupons/user/${userInfo.id}`);
        const userCoupons = couponResponse.data; // 사용자가 사용한 쿠폰 목록

        // 배송 정보 및 환불 상태 업데이트, 쿠폰 적용 여부 확인
        const updatedOrders = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // 배송 정보 API 호출
              const deliveryResponse = await axios.get(`${BASE_URL}/api/delivery/order/${order.id}`);
              
              // 환불된 주문이면 배송 상태를 "환불 완료"로 처리
              const updatedDeliveryStatus = order.status === "환불 완료" 
                ? "환불 완료" 
                : deliveryResponse.data.deliveryStatus || "배송 정보 없음";

              // 쿠폰 적용 여부 확인
              const isCouponUsed = userCoupons.some(coupon => coupon.usedInOrderId === order.id);
              
              // 환불 상태: 환불 완료된 주문은 "환불 불가"
              const refundStatus = order.status === "환불 완료" 
                ? "환불 불가" 
                : isCouponUsed ? "환불 불가" : "환불 가능";
        
              return {
                ...order,
                deliveryStatus: updatedDeliveryStatus,
                trackingNumber: deliveryResponse.data.trackingNumber || "배송 추적번호 없음",
                refundStatus: refundStatus, // 환불 가능 여부
              };
            } catch (error) {
              console.error(`배송 정보 오류 (주문 ${order.id}):`, error);
              return { 
                ...order, 
                deliveryStatus: "배송 정보 없음", 
                trackingNumber: "N/A", 
                refundStatus: "환불 불가" 
              };
            }
          })
        );           
        //console.log("전체 주문 데이터:", JSON.stringify(response.data, null, 2));
        //console.log("첫 번째 주문의 orderItems:", JSON.stringify(response.data[0]?.orderItems, null, 2));
        setOrders(updatedOrders);
      } catch (error) {
        console.error("주문 내역을 불러오는 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchOrders();
    }
  }, [userInfo]);

  const handleRefund = (orderId) => {
    navigate(`/refund/${orderId}`);
  };

  if (loading) {
    return <p>주문 내역을 불러오는 중...</p>;
  }

  if (!userInfo || !userInfo.id) {
    return <p>로그인이 필요합니다.</p>;
  }

  if (orders.length === 0) {
    return <p>구매 내역이 없습니다.</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>구매 내역</h1>
      <div className={styles.purchaseList}>
      {orders.map((order) => {
          const items = Array.isArray(order.orderItems) 
          ? order.orderItems.filter(item => Object.keys(item).length > 0) // 빈 객체 제거
          : [];
        
          return (
            <div key={order.id} className={styles.purchaseCard}>
              <h3 className={styles.bookTitle}>{new Date(order.orderDate).toISOString().split("T")[0]} (주문 번호: {order.id})</h3>
              {/* <p>구매일: {new Date(order.orderDate).toISOString().split("T")[0]}</p> */}
              <hr></hr>
              <p>
                배송 상태:{" "}
                <span className={styles.status}>{order.deliveryStatus} </span>
                <span>({order.trackingNumber})</span>
              </p>

              <hr></hr>

              <div className={styles.bookInfo}>
              {/* 주문한 책 정보 표시 */}
              {items.length > 0 ? ( //현재 order_items 불러올 수 있는 방법 없음
                items.map((item, index) => (
                  <div key={index}>
                    <p>{item.bookTitle || "제목 없음"}</p>
                    <p>수량: {item.quantity || 1}개</p>
                    <p>주문 금액: {" "}
                      {item.price ? `${(item.price * (item.quantity || 1)).toLocaleString()}원` : "정보 없음"}</p>
                  <hr></hr>
                  </div>
                ))
              ) : (
                <p>주문한 책 정보를 불러오지 못했습니다.</p>
              )}

              <p>결제 금액: {order.discountedAmount.toLocaleString()}원</p>
              </div>

              <p>
                환불 상태:{" "}
                <span
                  className={
                    order.refundStatus === "환불 가능"
                      ? styles.refundable
                      : styles.nonRefundable
                  }
                >
                  {order.refundStatus}
                </span>
              </p>
              {order.refundStatus === "환불 가능" && (
                <button
                  className={styles.refundButton}
                  onClick={() => handleRefund(order.id)}
                >
                  환불 요청
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistoryPage;