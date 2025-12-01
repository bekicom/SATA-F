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

const DAYS = [
  "dushanba",
  "seshanba",
  "chorshanba",
  "payshanba",
  "juma",
  "shanba",
];

// Boshlang'ich bo'sh jadval (inputlar bo'sh ko'rinadi)
const createEmptySchedule = () => {
  const obj = {};
  DAYS.forEach((d) => {
    obj[d] = "";
  });
  return obj;
};

// Backendga ketadigan real jadval (bo'sh => 0)
const normalizeScheduleForBackend = (schedule) => {
  const result = {};
  DAYS.forEach((day) => {
    const val = schedule[day];
    // "", null yoki undefined bo'lsa 0 bo'ladi, son bo'lsa Number()
    result[day] =
      val === "" || val === null || val === undefined ? 0 : Number(val);
  });
  return result;
};

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

  // Jadval: UI uchun string ko'rinishida, bo'sh bo'lishi mumkin
  const [schedule, setSchedule] = useState(createEmptySchedule());

  const [updateTeacher] = useUpdateTeacherMutation();

  // ✅ 4 xonali random son generatsiya qilish
  const generateEmployeeNo = () => {
    const min = 1000;
    const max = 9999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // ✅ Mavjud employeeNo larni tekshirish
  const getExistingEmployeeNos = () => {
    return data ? data.map((teacher) => teacher.employeeNo) : [];
  };

  // ✅ Takrorlanmas employeeNo generatsiya qilish
  const generateUniqueEmployeeNo = () => {
    const existingNos = getExistingEmployeeNos();
    let newEmployeeNo;

    do {
      newEmployeeNo = generateEmployeeNo().toString();
    } while (existingNos.includes(newEmployeeNo));

    return newEmployeeNo;
  };

  // ✅ Component yuklanganda yangi teacher bo'lsa employeeNo generatsiya qilish
  useEffect(() => {
    if (!id && data) {
      const newEmployeeNo = generateUniqueEmployeeNo();
      setEmployeeNo(newEmployeeNo);
      // Yangi o'qituvchi bo'lsa, jadvalni bo'sh holatga qo'yamiz
      setSchedule(createEmptySchedule());
    }
  }, [data, id]);

  // ✅ Edit rejimida data’ni formga yuklash
  useEffect(() => {
    if (id && data) {
      const teacher = data.find((item) => item._id === id);

      if (teacher) {
        setFirstName(teacher?.firstName || "");
        setLastName(teacher?.lastName || "");
        setLogin(teacher?.login || "");
        setPassword(""); // EDIT rejimida parol bo'sh turadi

        const formattedBirthDate = teacher.birthDate
          ? new Date(teacher.birthDate).toISOString().split("T")[0]
          : "";
        setBirthDate(formattedBirthDate);

        setPhoneNumber(teacher?.phoneNumber || "");
        setScience(teacher?.science || "");
        setPrice(teacher?.price || "");
        setEmployeeNo(teacher?.employeeNo || "");

        // Teacherning schedule'ini UI uchun string ko'rinishida beramiz
        const teacherSchedule = teacher?.schedule || {};
        const uiSchedule = createEmptySchedule();
        DAYS.forEach((day) => {
          const v = teacherSchedule[day];
          uiSchedule[day] =
            v === 0 || v === null || v === undefined ? "" : String(v);
        });
        setSchedule(uiSchedule);
      }
    }
  }, [id, data]);

  // ✅ Yangi employeeNo generatsiya qilish uchun funksiya
  const handleGenerateNewEmployeeNo = () => {
    const newEmployeeNo = generateUniqueEmployeeNo();
    setEmployeeNo(newEmployeeNo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ EmployeeNo bo'sh bo'lmasligini tekshirish
    if (!employeeNo) {
      alert("Iltimos, Employee No ni generatsiya qiling yoki kiriting!");
      return;
    }

    // UI dagi jadvalni backend uchun raqamga o'giramiz, bo'sh joylar 0 bo'ladi
    const normalizedSchedule = normalizeScheduleForBackend(schedule);

    const hour = Object.values(normalizedSchedule).reduce(
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
      monthlySalary: hour * 4 * Number(price || 0),
      price: Number(price),
      schedule: normalizedSchedule, // <-- har bir kun: son, bo'shlar 0
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

  // UI da faqat string saqlaymiz, user istasa 0 ham yozishi mumkin
  const handleScheduleChange = (day, value) => {
    // Manfiy son va 24 dan katta bo'lishiga yo'l qo‘ymaslik uchun oddiy filter
    let v = value;
    if (v === "") {
      // bo'sh qoldirsa, state bo'sh bo'ladi, backendga 0 ketadi
      setSchedule((prev) => ({ ...prev, [day]: "" }));
      return;
    }
    const num = Number(v);
    if (Number.isNaN(num) || num < 0) return;
    if (num > 24) return;
    setSchedule((prev) => ({ ...prev, [day]: v }));
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
            required
            autoComplete="off"
          />
        </label>

        <label>
          <p>Familiyasi</p>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="off"
          />
        </label>

        <label>
          <p>Tug'ilgan sana</p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label>
          <p>Telefon raqam</p>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label>
          <p>Fan</p>
          <input
            type="text"
            value={science}
            onChange={(e) => setScience(e.target.value)}
            required
            autoComplete="off"
          />
        </label>

        {/* Employee No - Yangilash tugmasi bilan */}
        <label>
          <p>Employee No</p>
          <div style={{ display: "flex", gap: "8px", width: "10%" }}>
            <input
              type="text"
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="Employee No generatsiya qiling"
              required
              style={{
                flex: 1,
                paddingLeft: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                height: "32px",
              }}
              autoComplete="off"
            />
            {!id && (
              <Button
                type="button"
                onClick={handleGenerateNewEmployeeNo}
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: "4px",
                  border: "1px solid #1890ff",
                  backgroundColor: "#fff",
                  color: "#1890ff",
                }}
              >
                Yangilash
              </Button>
            )}
          </div>
          {!id && (
            <small style={{ color: "#666", fontSize: "12px" }}>
              Employee No avtomatik generatsiya qilinadi, yangilash tugmasi
              bilan o&apos;zgartirishingiz mumkin
            </small>
          )}
        </label>

        <label>
          <p>Maosh (bitta dars uchun)</p>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            autoComplete="off"
          />
        </label>

        {/* Login */}
        <label>
          <p>Login</p>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete="off"
            id="teacher-login"
            name="teacher-login"
          />
        </label>

        {/* Parol */}
        <label>
          <p>{id ? "Yangi parol (ixtiyoriy)" : "Parol"}</p>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder={
                id ? "Agar parolni yangilamoqchi bo'lsangiz kiriting" : ""
              }
              onChange={(e) => setPassword(e.target.value)}
              required={!id}
              autoComplete="new-password"
              id="teacher-password"
              name="teacher-password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </span>
          </div>
        </label>

        {/* Haftalik jadval */}
        {DAYS.map((day) => (
          <label key={day}>
            <p>{day.charAt(0).toUpperCase() + day.slice(1)}</p>
            <input
              type="number"
              min={0}
              max={24}
              value={schedule[day]}
              placeholder="0"
              onChange={(e) => handleScheduleChange(day, e.target.value)}
              autoComplete="off"
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
