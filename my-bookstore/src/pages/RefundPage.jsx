import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from "../App";
import axios from 'axios';
import styles from './RefundPage.module.css';

const BASE_URL = "https://34-64-72-234.nip.io";

const RefundPage = () => {
  const { id } = useParams(); // URL에서 주문 ID 가져오기
  const [message, setMessage] = useState(''); // 메시지 상태
  const { userInfo } = useContext(AuthContext);
  
  const userId = userInfo.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 환불 요청을 백엔드로 전송
      const response = await axios.post(
        `${BASE_URL}/payments/refund_process`,
        null, // 본문에 추가할 데이터가 없으므로 null
        {
          params: {
            orderId: id,  // 주문 ID
            userId: userId, // 사용자 ID
          },
          withCredentials: true, // 쿠키 전송 옵션
        }
      );
      
      // 성공 시 메시지 표시
      setMessage('환불 요청이 성공적으로 접수되었습니다. 처리 상태를 확인하려면 고객센터에 문의하세요.');
    } catch (error) {
      console.error('환불 실패:', error.response?.data || error.message);
      setMessage('환불 요청에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>환불 요청</h2>
      <p>구매 ID: {id}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <button type="submit" className={styles.submitButton}>환불 요청하기</button>
      </form>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default RefundPage;
