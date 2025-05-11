import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // AuthContext 가져오기
import axios from 'axios';
import styles from './AccountDeletePage.module.css';

const BASE_URL = "https://34-64-72-234.nip.io";

const AccountDeletePage = () => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // 로컬 스토리지에서 userId를 가져옵니다.
  const userId = localStorage.getItem('loggedInUserId');

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleDeleteAccount = async () => {
    try {
      if (!userId) {
        setErrorMessage("사용자 정보가 존재하지 않습니다.");
        return;
      }

      // DELETE 요청을 보낼 때, 비밀번호를 요청 본문에 포함
      const response = await axios.delete(`${BASE_URL}/member/MyPage/${userId}`, {
        params: { password }, // 쿼리 파라미터로 비밀번호 전달
      });

      if (response.status === 200) {
        // 탈퇴 성공 시 로컬스토리지에서 사용자 정보 삭제
        localStorage.removeItem('loggedInUserId');
        setIsAuthenticated(false); // 인증 상태를 false로 설정
        alert("회원 탈퇴가 완료되었습니다.");
        navigate("/"); // 메인 페이지로 리다이렉트
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setErrorMessage("아이디나 비밀번호가 잘못되었습니다.");
      } else {
        setErrorMessage("회원 탈퇴 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>회원 탈퇴</h2>
      <div className={styles.inputContainer}>
        <label className={styles.message}>비밀번호를 입력하세요:</label>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className={styles.input}
        />
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      <button onClick={handleDeleteAccount} className={styles.deleteButton}>탈퇴하기</button>
    </div>
  );
};

export default AccountDeletePage;
