import React, { useState } from 'react';
import axios from 'axios';
import styles from './FindPasswordPage.module.css';

function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    try {
      const response = await axios.post(
        'https://swims.p-e.kr/api/password_such',
        null,
        { params: { email } }
      );
      console.log('서버 응답:', response.data);
      alert('인증 코드가 이메일로 전송되었습니다.');
      setCodeSent(true);
      setError('');
    } catch (error) {
      console.error('에러 발생:', error);
      setError(error.response?.data?.message || '서버 오류 발생!');
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('인증 코드를 입력해주세요.');
      return;
    }
    try {
      const response = await axios.post(
        'https://swims.p-e.kr/api/verify-code',
        null,
        { params: { email, authenticationCode: code } }
      );
      console.log('서버 응답:', response.data);
      setPassword(response.data.password);
      setVerified(true);
      setError('');
    } catch (error) {
      console.error('에러 발생:', error);
      setError(error.response?.data?.message || '인증 코드가 올바르지 않습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>비밀번호 찾기</h2>
      <input
        type="email"
        placeholder="이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <button onClick={handleSendCode} className={styles.button}>
        인증 코드 받기
      </button>
      
      {codeSent && (
  <div className={styles.codeContainer}>
    <input
      type="text"
      placeholder="인증 코드 입력"
      value={code}
      onChange={(e) => setCode(e.target.value)}
      className={styles.input}
    />
    <button onClick={handleVerifyCode} className={styles.button}>
      인증하기
    </button>
  </div>
)}

      
      {verified && password && (
        <div className={styles.passwordDisplay}>
          <p>비밀번호: {password}</p>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default FindPasswordPage;
