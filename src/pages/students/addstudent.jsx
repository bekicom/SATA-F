import React, { useState, useEffect } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAddStudentMutation,
  useGetCoinQuery,
  useUpdateStudentMutation,
} from "../../context/service/students.service";
import { useGetClassQuery } from "../../context/service/class.service";
import { Button, message } from "antd";

const AddStudent = () => {
  const navigate = useNavigate();
  const [addStudent, { isLoading, isSuccess }] = useAddStudentMutation();
  const { id } = useParams();
  const { data = [], refetch } = useGetClassQuery();
  const { data: studentData = [], refetch: refetchStudents } =
    useGetCoinQuery();
  const [updateStudent] = useUpdateStudentMutation();

  // States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState("");
  const [gender, setGender] = useState("O'g'ilbola");
  const [source, setSource] = useState("Telegram");
  const [groupId, setGroupId] = useState(null);
  const [admissionDate, setAdmissionDate] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const schoolId = localStorage.getItem("school_id");

  useEffect(() => {
    if (id) {
      const editingStudent = studentData.find((student) => student._id === id);
      if (editingStudent) {
        setFirstName(editingStudent.firstName);
        setLastName(editingStudent.lastName);
        setMiddleName(editingStudent.middleName);
        setPhoneNumber(editingStudent.phoneNumber);
        setGuardianPhoneNumber(editingStudent.guardianPhoneNumber);
        setGender(editingStudent.gender);
        setSource(editingStudent.source);
        setPassportNumber(editingStudent.passportNumber);
        setGroupId(editingStudent.groupId._id);
        setMonthlyFee(editingStudent.monthlyFee);
        setEmployeeNo(editingStudent.employeeNo || "");

        const formattedBirthDate = editingStudent.birthDate
          ? new Date(editingStudent.birthDate).toISOString().split("T")[0]
          : "";
        const formattedAdmissionDate = editingStudent.admissionDate
          ? new Date(editingStudent.admissionDate).toISOString().split("T")[0]
          : "";
        setBirthDate(formattedBirthDate);
        setAdmissionDate(formattedAdmissionDate);
      }
    }
  }, [id, studentData]);

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !phoneNumber || !groupId || !employeeNo) {
      message.error("Iltimos, barcha kerakli maydonlarni to'ldiring.");
      return;
    }

    const body = {
      firstName,
      lastName,
      middleName,
      birthDate,
      phoneNumber,
      guardianPhoneNumber,
      gender,
      source,
      groupId,
      admissionDate,
      passportNumber,
      schoolId,
      monthlyFee,
      employeeNo,
    };

    if (id) {
      try {
        await updateStudent({ id: id, body: body }).unwrap();
        message.success("O'quvchi muvaffaqiyatli yangilandi!");
        await refetchStudents(); // ✅ Cache yangilash
        navigate("/student");
      } catch (err) {
        console.error("Xatolik:", err);
        message.error("O'quvchini yangilashda xatolik yuz berdi!");
      }
    } else {
      try {
        await addStudent(body).unwrap();
        message.success("O'quvchi muvaffaqiyatli qo'shildi!");
        await refetchStudents(); // ✅ Cache yangilash
        navigate("/student");
      } catch (err) {
        console.error("Xatolik:", err);
        message.error("O'quvchini qo'shishda xatolik yuz berdi!");
      }
    }
  };

  useEffect(() => {
    if (!id && data.length > 0) {
      setGroupId("");
    }
  }, [id, data]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>{id ? "O'quvchini tahrirlash" : "O'quvchi qo'shish"}</h1>
        <Button type="primary" onClick={() => navigate("/student")}>
          <FaChevronLeft />
        </Button>
      </div>

      <form className="form_body" autoComplete="off" onSubmit={handleSubmit}>
        <label htmlFor="employeeNo">
          <p>Employee No (QR uchun)</p>
          <input
            autoComplete="off"
            type="text"
            id="employeeNo"
            value={employeeNo}
            onChange={(e) => setEmployeeNo(e.target.value)}
          />
        </label>

        <label htmlFor="firstName">
          <p>Ismi</p>
          <input
            autoComplete="off"
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>

        <label htmlFor="lastName">
          <p>Familiyasi</p>
          <input
            autoComplete="off"
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>

        <label htmlFor="middleName">
          <p>Otasining ismi</p>
          <input
            autoComplete="off"
            type="text"
            id="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />
        </label>

        <label htmlFor="birthDate">
          <p>Tug'ilgan sana</p>
          <input
            autoComplete="off"
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label htmlFor="phoneNumber">
          <p>Telefon raqam</p>
          <input
            autoComplete="off"
            type="number"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>

        <label htmlFor="guardianPhoneNumber">
          <p>Ota onasining telefon raqam</p>
          <input
            autoComplete="off"
            type="number"
            id="guardianPhoneNumber"
            value={guardianPhoneNumber}
            onChange={(e) => setGuardianPhoneNumber(e.target.value)}
          />
        </label>

        <label htmlFor="admissionDate">
          <p>Qabul sanasi</p>
          <input
            autoComplete="off"
            type="date"
            id="admissionDate"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
          />
        </label>

        <label htmlFor="passportNumber">
          <p>Seriya</p>
          <input
            autoComplete="off"
            type="text"
            id="passportNumber"
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
          />
        </label>

        <label htmlFor="monthlyFee">
          <p>Oylik to'lov</p>
          <input
            autoComplete="off"
            type="text"
            id="monthlyFee"
            value={monthlyFee}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setMonthlyFee(value);
              }
            }}
          />
        </label>

        <label htmlFor="gender">
          <p>Jins</p>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            defaultValue={"O'g'ilbola"}
          >
            <option value="O'g'ilbola">O'g'ilbola</option>
            <option value="Qizbola">Qizbola</option>
          </select>
        </label>

        <label htmlFor="source">
          <p>Qayerdan bildi</p>
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            defaultValue={"Telegram"}
          >
            <option value="Telegram">Telegram</option>
            <option value="Instagram">Instagram</option>
            <option value="Sayt">Sayt</option>
            <option value="Do'st">Do'st</option>
            <option value="Reklama">Reklama</option>
            <option value="Banner">Banner</option>
          </select>
        </label>

        <label htmlFor="groupId">
          <p>Guruhi</p>
          <select
            id="groupId"
            value={groupId || ""}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="" disabled>
              Guruhni tanlang
            </option>
            {data.length > 0 &&
              data.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Yuklanmoqda..." : "Saqlash"}
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
