import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import styles from './SignUpPage.module.css';

function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate(); 

  const handleBirthDateChange = (e) => {
    const birthYear = new Date(e.target.value).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - birthYear;

    setBirthDate(e.target.value);
    setAge(calculatedAge);  // 생년월일에 따라 자동으로 나이 계산
  };

  const handleAgeChange = (e) => {
    setAge(e.target.value);  // 사용자가 나이를 수정할 수 있게 처리
  };

  // 이메일 중복 확인 함수
  const checkEmailExists = async () => {
    if (!email) {
      alert("이메일을 입력하세요.");
      return;
    }

    try {
      const response = await axios.post(
        'https://swims.p-e.kr/api/Id_such', 
        email, 
        {
          headers: { 'Content-Type': 'text/plain' },
        }
      );

      if (response.status === 200) {
        setEmailExists(true);
        setEmailChecked(false);
        alert('이미 존재하는 이메일입니다.');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setEmailExists(false);
        setEmailChecked(true);
        alert('사용 가능한 이메일입니다.');
      } else {
        console.error(error);
        alert('중복 확인 중 오류가 발생했습니다.');
      }
    }
  };

  // 회원가입 처리
  const handleSignUp = async () => {
    const errors = {};

    if (!name) errors.name = '이름을 입력하세요.';
    if (!email) errors.email = '이메일을 입력하세요.';
    if (!emailChecked) errors.emailChecked = '이메일 중복 확인을 해주세요.';
    if (!password) errors.password = '비밀번호를 입력하세요.';
    if (password !== confirmPassword) errors.passwordMatch = '비밀번호가 일치하지 않습니다.';
    if (!phoneNumber) errors.phoneNumber = '전화번호를 입력하세요.';
    if (!address) errors.address = '주소를 입력하세요.';
    if (!gender) errors.gender = '성별을 선택하세요.';
    if (!birthDate) errors.birthDate = '생년월일을 입력하세요.';
    if (!age) errors.age = '나이가 올바르지 않습니다.';

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await axios.post('https://swims.p-e.kr/api/register', {
        userId: email,
        email,
        password,
        name,
        phoneNumber,
        address,
        gender,
        birthDate,
        age,
      });

      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('회원가입에 실패했습니다.');
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneNumberChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className={styles.signupContainer}>
      <h2 className={styles.title}>회원가입</h2>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.name}
        />
        {fieldErrors.name && <span className={styles.errorText}>{fieldErrors.name}</span>}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.emailContainer}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            className={styles.email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailChecked(false);
            }
          }
          />
          <button onClick={checkEmailExists} className={styles.checkEmailButton}>
            중복 확인
          </button>
        </div>
        {fieldErrors.email && <span className={styles.errorText}>{fieldErrors.email}</span>}
        {fieldErrors.emailChecked && <span className={styles.errorText}>{fieldErrors.emailChecked}</span>}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          className={styles.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {fieldErrors.password && <span className={styles.errorText}>{fieldErrors.password}</span>}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          className={styles.password}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {fieldErrors.passwordMatch && <span className={styles.errorText}>{fieldErrors.passwordMatch}</span>}
      </div>

      <div className={styles.inputContainer}>
        <input 
          type="text"
          placeholder="전화번호"
          value={phoneNumber}
          className={styles.phoneNumber}
          onChange={handlePhoneNumberChange}
        />
        {fieldErrors.phoneNumber && <span className={styles.errorText}>{fieldErrors.phoneNumber}</span>}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="주소"
          value={address}
          className={styles.address}
          onChange={(e) => setAddress(e.target.value)}
        />
        {fieldErrors.address && <span className={styles.errorText}>{fieldErrors.address}</span>}
      </div>

      <div className={styles.inputContainer}>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={styles.input}
        >
          <option value="">성별 선택</option>
          <option value="F">여성</option>
          <option value="M">남성</option>
        </select>
        {fieldErrors.gender && <span className={styles.errorText}>{fieldErrors.gender}</span>}
      </div>

      <div className={styles.inputContainer}>
        <input
          type="date"
          placeholder="생년월일"
          value={birthDate}
          onChange={handleBirthDateChange}
          className={styles.birthDate}
        />
        {fieldErrors.birthDate && <span className={styles.errorText}>{fieldErrors.birthDate}</span>}
      </div>
      
      <div className={styles.inputContainer}>
        <input
          type="number"
          placeholder="나이"
          value={age}
          onChange={handleAgeChange}  // 나이를 수정할 수 있게 처리
          className={styles.age}
        />
        {fieldErrors.age && <span className={styles.errorText}>{fieldErrors.age}</span>}
      </div>

      <button className={styles.signupButton} onClick={handleSignUp}>회원가입</button>
    </div>
  );
}

export default SignUpPage;
