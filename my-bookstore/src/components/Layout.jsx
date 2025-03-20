// Layout.js
import React from "react";
import Header from "../pages/Header";

const Layout = ({ children }) => {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
