import React, { useState } from "react";
import {
  useAddTeacherDavomatMutation,
  useGetTeacherDavomatQuery,
  useGetTeachersQuery,
} from "../../context/service/teacher.service";
import { Table, Button, message, DatePicker } from "antd";
import { GiCancel } from "react-icons/gi";
import { FaChevronLeft, FaCircleCheck } from "react-icons/fa6";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const AddTeacherDavomat = () => {
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: teacherDavomat = [] } = useGetTeacherDavomatQuery();
  const [addTeacherDavomat, { isLoading }] = useAddTeacherDavomatMutation();
  const navigate = useNavigate();

  // 📅 Tanlangan sana
  const [selectedDate, setSelectedDate] = useState(moment());

  // 📅 Haftalik kunlar
  const uzbWeek = {
    1: "dushanba",
    2: "seshanba",
    3: "chorshanba",
    4: "payshanba",
    5: "juma",
    6: "shanba",
    0: "yakshanba", // moment.js da yakshanba = 0
  };

  const handleDateChange = (date) => {
    if (date) setSelectedDate(date);
  };

  // ✅ Davomat olish (keldi)
  const handleAttendance = async (teacher) => {
    if (
      !window.confirm(
        `${teacher.firstName} ${teacher.lastName}ni "Keldi" deb belgilaysizmi?`
      )
    )
      return;

    const daySchedule = teacher.schedule?.[uzbWeek[selectedDate.day()]] || 0;
    const summ = teacher.price * daySchedule;

    try {
      await addTeacherDavomat({
        teacherId: teacher._id,
        davomatDate: selectedDate.format("YYYY-MM-DD"),
        status: true,
        summ,
      }).unwrap();
      message.success("✅ Davomat olindi (Keldi)!");
    } catch (e) {
      message.error(e?.data?.message || "❌ Xatolik yuz berdi!");
    }
  };

  // ❌ Davomat olish (kelmadi)
  const handleAbsent = async (teacher) => {
    if (
      !window.confirm(
        `${teacher.firstName} ${teacher.lastName}ni "Kelmadi" deb belgilaysizmi?`
      )
    )
      return;

    try {
      await addTeacherDavomat({
        teacherId: teacher._id,
        davomatDate: selectedDate.format("YYYY-MM-DD"),
        status: false,
        summ: 0,
      }).unwrap();
      message.success("✅ Davomat olindi (Kelmadi)!");
    } catch (e) {
      message.error(e?.data?.message || "❌ Xatolik yuz berdi!");
    }
  };

  // 🔍 O'qituvchi tanlangan sanada davomat olganmi?
  const getDavomatStatus = (teacherId) => {
    return teacherDavomat.some(
      (item) =>
        String(item.teacherId?._id || item.teacherId) === String(teacherId) &&
        moment(item.davomatDate).format("YYYY-MM-DD") ===
          selectedDate.format("YYYY-MM-DD")
    );
  };

  // 📋 Jadval ustunlari
  const columns = [
    {
      title: "№",
      render: (_, __, index) => index + 1,
    },
    {
      title: "O'qituvchi to'liq ismi",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Telefon raqami",
      dataIndex: "phoneNumber",
    },
    {
      title: "Davomat olish",
      key: "action",
      render: (_, record) => {
        const alreadyTaken = getDavomatStatus(record._id);
        return (
          <>
            <Button
              type="primary"
              danger
              style={{
                opacity: alreadyTaken ? 0.5 : 1,
                marginRight: "8px",
              }}
              disabled={alreadyTaken}
              onClick={() => handleAbsent(record)}
              loading={isLoading}
            >
              <GiCancel />
            </Button>
            <Button
              type="primary"
              style={{
                background: "green",
                borderColor: "green",
                opacity: alreadyTaken ? 0.5 : 1,
              }}
              disabled={alreadyTaken}
              onClick={() => handleAttendance(record)}
              loading={isLoading}
            >
              <FaCircleCheck />
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <div className="page">
      {/* 📌 Header */}
      <div className="page-header">
        <h1>O'qituvchi uchun davomat olish</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
          className="header__actions"
        >
          <DatePicker
            onChange={handleDateChange}
            placeholder="Sana"
            format="DD-MM-YYYY"
          />
          <Button onClick={() => navigate("/davomat/teacher")} type="primary">
            <FaChevronLeft />
          </Button>
        </div>
      </div>

      {/* 📋 Jadval */}
      <Table
        dataSource={teachers.map((teacher, index) => ({
          ...teacher,
          key: index,
        }))}
        columns={columns}
        pagination={false}
      />
    </div>
  );
};

export default AddTeacherDavomat;
