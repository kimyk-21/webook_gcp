import React, { useState, createContext, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchResults from "./pages/SearchResults";
import BookDetailPage from "./pages/BookDetailPage";
import LoginPage from "./pages/LoginPage";
import MemberInfoPage from "./pages/MemberInfoPage";
import AccountDeletePage from "./pages/AccountDeletePage";
import CartPage from "./pages/CartPage";
import OrderPage from "./pages/OrderPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import RefundPage from "./pages/RefundPage";
import SignUpPage from "./pages/SignUpPage";
import FindPasswordPage from "./pages/FindPasswordPage";
import Layout from "./components/Layout";
import axios from "./axios"; // axios 인스턴스 가져오기

export const AuthContext = createContext();

const BASE_URL = "https://swims.p-e.kr";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem("loggedInUserId");
      if (!userId) return;

      try {
        const response = await axios.post(`${BASE_URL}/api/infofind`, null, {
          params: { userId }
        });
        setUserInfo(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("회원 정보 가져오기 실패", error);
        setUserInfo(null);
        setIsAuthenticated(false);
      }
    };

    fetchUserInfo();
  }, []);

    // 로그아웃 함수
    const handleLogout = () => {
      localStorage.removeItem("loggedInUserId"); // 로그아웃 시 localStorage에서 userId 제거
      setIsAuthenticated(false);
      setUserInfo(null);
      setLoggedInUser(null);
    };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, userInfo, setUserInfo }}>
      <Router>
        <Layout handleLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/find-password" element={<FindPasswordPage />} />
            <Route path="/member-info" element={isAuthenticated ? <MemberInfoPage /> : <Navigate to="/login" />} />
            <Route path="/account-delete" element={<AccountDeletePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order-history" element={<OrderHistoryPage userId={loggedInUser?.id} />} />
            <Route path="/refund/:id" element={<RefundPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
