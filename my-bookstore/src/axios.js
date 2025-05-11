import axios from "axios";

const instance = axios.create({
  baseURL: "https://34-64-72-234.nip.io", // 백엔드 주소
  withCredentials: true, // 쿠키 자동 포함
});

export default instance;
