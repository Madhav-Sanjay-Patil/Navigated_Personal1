import React from 'react';
import LetterAvatar from "../../../Components/LetterAvatar";
// import '../css/UserInfo.css';

const UserInfo = ({ setIsLoggedIn, children }) => {
  return (
    <div className='bar'>
      <div className='intro'>
        <h1>Hello, {localStorage.getItem("name")}</h1>
        <h6>Learn Courses better on Navigated Learning</h6>
      </div>
      {children}
      <div>
        <LetterAvatar setIsLoggedIn={setIsLoggedIn} />
        <h6>{localStorage.getItem("name")}</h6>

      </div>
    </div>
  )
}

export default UserInfo