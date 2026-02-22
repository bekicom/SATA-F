import React, { useState } from "react";
import {
  useAddTeacherDavomatMutation,
  useGetTeacherDavomatQuery,
  useGetTeachersQuery,
} from "../../context/service/teacher.service";
import { Table, Button, message, DatePicker, Tag } from "antd";
import { GiCancel } from "react-icons/gi";
import { FaChevronLeft, FaCircleCheck } from "react-icons/fa6";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const AddTeacherDavomat = () => {
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: teacherDavomat = [] } = useGetTeacherDavomatQuery();
  const [addTeacherDavomat, { isLoading }] = useAddTeacherDavomatMutation();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(moment());

  const uzbWeek = {
    1: "dushanba",
    2: "seshanba",
    3: "chorshanba",
    4: "payshanba",
    5: "juma",
    6: "shanba",
    0: "yakshanba",
  };

  const handleDateChange = (date) => {
    if (date) setSelectedDate(date);
  };

  // ✅ teacherDavomat strukturasi: [{dateKey, body: [{teacher_id, status}]}]
  const getDavomatStatus = (teacherId) => {
    const dateKey = selectedDate.format("YYYY-MM-DD");

    // Shu kunga tegishli hujjatni topamiz
    const dayDoc = teacherDavomat.find((doc) => doc.dateKey === dateKey);
    if (!dayDoc || !Array.isArray(dayDoc.body)) return null;

    // Body ichidan o'qituvchini topamiz
    const entry = dayDoc.body.find(
      (e) => String(e.teacher_id?._id || e.teacher_id) === String(teacherId),
    );
    if (!entry) return null;

    if (entry.status === "keldi" || entry.status === true) return true;
    if (entry.status === "kelmadi" || entry.status === false) return false;
    return null;
  };

  // ✅ Keldi
  const handleAttendance = async (teacher) => {
    if (
      !window.confirm(
        `${teacher.firstName} ${teacher.lastName}ni "Keldi" deb belgilaysizmi?`,
      )
    )
      return;

    const daySchedule = teacher.schedule?.[uzbWeek[selectedDate.day()]] || 0;
    const summ = teacher.price * daySchedule;

    try {
      await addTeacherDavomat({
        teacherId: teacher._id,
        employeeNo: teacher.employeeNo, // ✅ eski controller uchun ham yuboriladi
        davomatDate: selectedDate.format("YYYY-MM-DD"),
        status: true,
        summ,
      }).unwrap();
      message.success("✅ Davomat olindi (Keldi)!");
    } catch (e) {
      message.error(e?.data?.message || "❌ Xatolik yuz berdi!");
    }
  };

  // ✅ Kelmadi
  const handleAbsent = async (teacher) => {
    if (
      !window.confirm(
        `${teacher.firstName} ${teacher.lastName}ni "Kelmadi" deb belgilaysizmi?`,
      )
    )
      return;

    try {
      await addTeacherDavomat({
        teacherId: teacher._id,
        employeeNo: teacher.employeeNo, // ✅ eski controller uchun ham yuboriladi
        davomatDate: selectedDate.format("YYYY-MM-DD"),
        status: false,
        summ: 0,
      }).unwrap();
      message.success("✅ Davomat olindi (Kelmadi)!");
    } catch (e) {
      message.error(e?.data?.message || "❌ Xatolik yuz berdi!");
    }
  };

  const columns = [
    { title: "№", render: (_, __, index) => index + 1, width: 50 },
    {
      title: "O'qituvchi to'liq ismi",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    { title: "Telefon raqami", dataIndex: "phoneNumber" },
    {
      title: "Holat",
      key: "status",
      render: (_, record) => {
        const status = getDavomatStatus(record._id);
        if (status === null) return <Tag color="default">—</Tag>;
        if (status === true) return <Tag color="green">Keldi ✅</Tag>;
        if (status === false) return <Tag color="red">Kelmadi ❌</Tag>;
      },
    },
    {
      title: "Davomat olish",
      key: "action",
      render: (_, record) => {
        const status = getDavomatStatus(record._id);
        const alreadyTaken = status !== null;

        return (
          <>
            <Button
              type="primary"
              danger
              style={{ opacity: alreadyTaken ? 0.4 : 1, marginRight: "8px" }}
              disabled={alreadyTaken}
              onClick={() => handleAbsent(record)}
              loading={isLoading}
            >
              <GiCancel />
            </Button>
            <Button
              type="primary"
              style={{
                background: alreadyTaken ? "#d9d9d9" : "green",
                borderColor: alreadyTaken ? "#d9d9d9" : "green",
                opacity: alreadyTaken ? 0.4 : 1,
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
      <div className="page-header">
        <h1>O'qituvchi uchun davomat olish</h1>
        <div
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
          className="header__actions"
        >
          <DatePicker
            onChange={handleDateChange}
            placeholder="Sana"
            format="DD-MM-YYYY"
            defaultValue={moment()}
          />
          <Button onClick={() => navigate("/davomat/teacher")} type="primary">
            <FaChevronLeft />
          </Button>
        </div>
      </div>

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
