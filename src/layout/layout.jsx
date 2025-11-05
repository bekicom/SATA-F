import React, { memo, useState, useRef } from "react";
import {
  Outlet,
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./layout.css";
import { FaUser, FaCalendarCheck } from "react-icons/fa";
import { IoSchoolSharp } from "react-icons/io5";
import {
  MdClass,
  MdOutlineAttachMoney,
  MdOutlineSpaceDashboard,
  MdPayments,
  MdQrCodeScanner,
} from "react-icons/md";
import { FaRegCircleUser } from "react-icons/fa6";
import { CloseModal } from "../utils/closemodal";
import { apiSlice } from "../context/service/api.service";
import { useDispatch } from "react-redux";
import moment from "moment";
import { RiMoneyDollarBoxFill } from "react-icons/ri";
import { PiStudentDuotone } from "react-icons/pi";
import { TbReportAnalytics } from "react-icons/tb";
import { GiCardExchange } from "react-icons/gi";
import { MdOutlineIncompleteCircle } from "react-icons/md";
import { BookOutlined } from "@ant-design/icons";

export const Layout = memo(() => {
  const admin = JSON.parse(localStorage.getItem("admin") || "null");
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [menu, setMenu] = useState(false);
  const toggleMenu = () => setMenu(!menu);
  const menuRef = useRef(null);
  moment.utc(5);

  const logout = () => {
    localStorage.clear();
    dispatch(apiSlice.util.resetApiState());
    window.location.href = "/";
  };

  CloseModal({ modalRef: menuRef, onClose: () => setMenu(false) });

  return (
    <main className="main">
      <aside className="aside">
        <div className="aside__logo">
          <Link to="/">
            <IoSchoolSharp />
            <span>STANFORD</span>
          </Link>
        </div>

        <ol className="aside__menu">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MdOutlineSpaceDashboard />
              <span>Statistika</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/class"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MdClass />
              <span>Sinflar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/teacher"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaUser />
              <span>O'qituvchilar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/student"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <PiStudentDuotone />
              <span>O'quvchilar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/davomat"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <FaCalendarCheck />
              <span>Davomat</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/oylik"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <RiMoneyDollarBoxFill />
              <span>Oylik berish</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/fan"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <BookOutlined />
              <span>Fanlar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/drasjadval"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <BookOutlined />
              <span>DarsJadval</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hisobot"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <TbReportAnalytics />
              <span>Maosh hisobot</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/payment"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MdOutlineAttachMoney />
              <span>To'lov</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/debtor"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MdOutlineIncompleteCircle />
              <span>Qarzdorlar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/harajat"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <MdPayments />
              <span>Harajatlar</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/change"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <GiCardExchange />
              <span>Almashtirish</span>
            </NavLink>
          </li>
        </ol>
      </aside>

      <div className="navigation">
        <div
          onClick={() => navigate("/")}
          className={`navigation_item ${
            location.pathname === "/" ? "link_active" : ""
          }`}
        >
          <MdOutlineSpaceDashboard />
        </div>
        <div
          onClick={() => navigate("/class")}
          className={`navigation_item ${
            location.pathname === "/class" ? "link_active" : ""
          }`}
        >
          <MdClass />
        </div>
        <div
          onClick={() => navigate("/teacher")}
          className={`navigation_item ${
            location.pathname === "/teacher" ? "link_active" : ""
          }`}
        >
          <FaUser />
        </div>
        <div
          onClick={() => navigate("/student")}
          className={`navigation_item ${
            location.pathname === "/student" ? "link_active" : ""
          }`}
        >
          <PiStudentDuotone />
        </div>
        <div
          onClick={() => navigate("/davomat")}
          className={`navigation_item ${
            location.pathname === "/davomat" ? "link_active" : ""
          }`}
        >
          <FaCalendarCheck />
        </div>
        <div
          onClick={() => navigate("/scan")}
          className={`navigation_item ${
            location.pathname === "/scan" ? "link_active" : ""
          }`}
        >
          <MdQrCodeScanner />
        </div>
      </div>

      <header className="header">
        <h1></h1>

        <div className="header__user" ref={menuRef}>
          <span>{admin?.fullname}</span>
          <button onClick={toggleMenu}>
            <FaRegCircleUser />
          </button>

          <div className={`header__user-info ${menu ? "active" : ""}`}>
            <ol>
              <li onClick={toggleMenu}>
                <Link to="/profile">Profil</Link>
              </li>
              <li>
                <p>
                  <span>Роль:</span>
                  <span>{admin?.role}</span>
                </p>
              </li>
              <li>
                <button onClick={logout}>Chiqish</button>
              </li>
            </ol>
          </div>
        </div>
      </header>

      <section className="section">
        <Outlet />
      </section>
    </main>
  );
});
