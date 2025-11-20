import React, { useEffect, useState } from "react";
import "./teacher.css";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAddTeacherMutation,
  useGetTeachersQuery,
  useUpdateTeacherMutation,
} from "../../context/service/teacher.service";
import { Button } from "antd";

const AddTeacher = () => {
  const navigate = useNavigate();
  const [addTeacher, { isLoading, isSuccess, isError, error }] =
    useAddTeacherMutation();
  const { data = null, refetch } = useGetTeachersQuery();
  const { id } = useParams();

  const schoolId = localStorage.getItem("school_id");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [science, setScience] = useState("");
  const [price, setPrice] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login / Password
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [schedule, setSchedule] = useState({
    dushanba: 0,
    seshanba: 0,
    chorshanba: 0,
    payshanba: 0,
    juma: 0,
    shanba: 0,
  });

  const [updateTeacher] = useUpdateTeacherMutation();

  useEffect(() => {
    if (id && data) {
      const teacher = data.find((item) => item._id === id);

      if (teacher) {
        setFirstName(teacher?.firstName);
        setLastName(teacher?.lastName);
        setLogin(teacher?.login || "");
        setPassword(""); // EDIT rejimida parol bo‘sh turadi

        const formattedBirthDate = teacher.birthDate
          ? new Date(teacher.birthDate).toISOString().split("T")[0]
          : "";
        setBirthDate(formattedBirthDate);

        setPhoneNumber(teacher?.phoneNumber);
        setScience(teacher?.science);
        setPrice(teacher?.price);
        setEmployeeNo(teacher?.employeeNo || "");
        setSchedule(teacher?.schedule || {});
      }
    }
  }, [id, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hour = Object.values(schedule).reduce(
      (total, lessons) => total + Number(lessons || 0),
      0
    );

    const body = {
      firstName,
      lastName,
      birthDate,
      phoneNumber,
      science,
      employeeNo,
      hour,
      monthlySalary: hour * 4 * price,
      price: Number(price),
      schedule,
      schoolId,
      login,
      ...(password && { password }), // EDIT rejimida faqat yangi parol yuboriladi
    };

    try {
      if (id) {
        await updateTeacher({ id, body }).unwrap();
      } else {
        await addTeacher(body).unwrap();
        if (isSuccess) {
          alert("O'qituvchi muvaffaqiyatli qo'shildi!");
          refetch();
        }
      }
      navigate("/teacher");
    } catch (err) {
      console.error("Xatolik:", err);
    }
  };

  const handleScheduleChange = (day, value) => {
    setSchedule((prevSchedule) => ({
      ...prevSchedule,
      [day]: Number(value),
    }));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{id ? "O'qituvchini tahrirlash" : "O'qituvchi qo'shish"}</h1>
        <Button type="primary" onClick={() => navigate("/teacher")}>
          <FaChevronLeft />
        </Button>
      </div>

      <form autoComplete="off" className="form_body" onSubmit={handleSubmit}>
        <label>
          <p>Ismi</p>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>

        <label>
          <p>Familiyasi</p>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>

        <label>
          <p>Tug'ilgan sana</p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label>
          <p>Telefon raqam</p>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>

        <label>
          <p>Fan</p>
          <input
            type="text"
            value={science}
            onChange={(e) => setScience(e.target.value)}
          />
        </label>

        <label>
          <p>Employee No</p>
          <input
            type="text"
            value={employeeNo}
            onChange={(e) => setEmployeeNo(e.target.value)}
          />
        </label>

        <label>
          <p>Maosh (bitta dars uchun)</p>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        {/* Login */}
        <label>
          <p>Login</p>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </label>

        {/* Parol - ADD va EDIT rejimida ham bor */}
        <label>
          <p>{id ? "Yangi parol (ixtiyoriy)" : "Parol"}</p>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder={
                id ? "Agar parolni yangilamoqchi bo‘lsangiz kiriting" : ""
              }
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </span>
          </div>
        </label>

        {Object.keys(schedule)
          .filter((day) => day !== "_id")
          .map((day) => (
            <label key={day}>
              <p>{day}</p>
              <input
                type="number"
                min={0}
                max={24}
                value={schedule[day] || ""}
                onChange={(e) => handleScheduleChange(day, e.target.value)}
              />
            </label>
          ))}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Yuklanmoqda..." : id ? "Yangilash" : "Qo'shish"}
        </button>

        {isError && <p className="error">Xatolik: {error?.data?.message}</p>}
      </form>
    </div>
  );
};

export default AddTeacher;
