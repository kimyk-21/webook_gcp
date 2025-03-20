import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import axios from 'axios';
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const { setIsAuthenticated, setUserInfo } = useContext(AuthContext);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("로그인 시 아이디:", userId);
    console.log("로그인 시 비밀번호:", password);

    try {
      const response = await axios.post("http://3.94.201.0:8080/api/login", {
        userId,
        password,
      });

      console.log(response.data);
      if (response.status === 200 && response.data.success) { // 응답이 성공적일 경우
        const userId = response.data.userId;  // 응답에서 userId 가져오기
        
        // 로컬스토리지에 userId 저장
        localStorage.setItem("loggedInUserId", userId);

        // 사용자 정보 조회
        const userInfoResponse = await axios.post("/api/infofind", null, {
          params: { userId },
        });

        console.log("사용자 정보:", userInfoResponse.data);

        // 상태 업데이트
        setUserInfo(userInfoResponse.data); // 전역 상태에 userInfo 저장
        setIsAuthenticated(true);

        // 로그인 성공 후 홈으로 이동
        alert("환영합니다!");
        navigate("/");
      } else {
        setError(response.data.message || "로그인 실패. 다시 시도해주세요.");
      }
    } catch (err) {
      console.error("로그인 에러:", err.response ? err.response.data : err.message);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>로그인</h2>
      <form className={styles.form} onSubmit={handleLogin}>
        <label className={styles.label}>
          아이디
          <input
            type="text"
            className={styles.input}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          비밀번호
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          로그인
        </button>
      </form>
      <div className={styles.linkContainer}>
        <p>
          아직 회원이 아니신가요?{" "}
          <span className={styles.linkText} onClick={() => navigate("/signup")}>
            회원가입
          </span>
        </p>
        <p>
          <span>비밀번호를 잊으셨나요? </span>
          <span className={styles.linkText} onClick={() => navigate("/find-password")}>
            비밀번호 찾기
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
