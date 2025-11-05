import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Modal,
  Progress,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Avatar,
  Divider,
  Space,
  Typography,
  TimePicker,
  message,
  Popconfirm,
} from "antd";
import {
  FaChevronLeft,
  FaList,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaChartLine,
  FaCalendarAlt,
  FaGraduationCap,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { IoTimeOutline, IoExitOutline, IoStatsChart } from "react-icons/io5";
import { MdLogin, MdLogout } from "react-icons/md";
import moment from "moment";
import { useNavigate } from "react-router-dom";

// Services
import { useGetTeachersQuery } from "../../context/service/oylikberish.service";
import { 
  useGetTeacherDavomatQuery,
  useAddTeacherDavomatMutation 
} from "../../context/service/teacher.service";

// Custom table
import { Table } from "../../components/table/table";

const { Title, Text } = Typography;

const TeacherDavomat = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: davomatData = [], refetch } = useGetTeacherDavomatQuery();
  const [addTeacherDavomat, { isLoading }] = useAddTeacherDavomatMutation();

  const today = moment().format("DD-MM-YYYY");
  const [selectedDate, setSelectedDate] = useState(today);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("MM-YYYY")
  );

  // Qo'lda davomat olish uchun state'lar
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [leaveTime, setLeaveTime] = useState(null);
  const [attendanceType, setAttendanceType] = useState(""); // "arrive" yoki "leave"

  // ✅ Sana formatini standartlashtirish (YYYY-MM-DD)
  const normalizeDate = (date) => {
    return moment(date, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).format(
      "YYYY-MM-DD"
    );
  };

  const handleDateChange = (date, dateString) => {
    setSelectedDate(dateString || today);
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find((t) => t._id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Nomalum";
  };

  // ✅ O'qituvchi entry topish (sana formatiga barqaror)
  const findTeacherEntry = (teacherId, date) => {
    const normalizedDate = normalizeDate(date);

    const attendanceDoc = davomatData.find(
      (doc) =>
        normalizeDate(doc.date) === normalizedDate &&
        Array.isArray(doc.body) &&
        doc.body.some(
          (b) =>
            b &&
            b.teacher_id &&
            String(b.teacher_id._id || b.teacher_id) === String(teacherId)
        )
    );

    if (!attendanceDoc) return null;

    return attendanceDoc.body.find(
      (b) =>
        b &&
        b.teacher_id &&
        String(b.teacher_id._id || b.teacher_id) === String(teacherId)
    );
  };

  // ✅ Holatni chiqarish
  const getStatus = (teacherId, date) => {
    const entry = findTeacherEntry(teacherId, date);
    if (!entry) return "Kelmadi";
    return entry.status?.toLowerCase() === "keldi" ? "Keldi" : "Kelmadi";
  };

  const getArrivedTime = (teacherId) => {
    const entry = findTeacherEntry(teacherId, selectedDate);
    return entry?.time || "-";
  };

  const getQuittedTime = (teacherId) => {
    const entry = findTeacherEntry(teacherId, selectedDate);
    return entry?.quittedTime || "-";
  };

  // Qo'lda davomat belgilash funksiyasi
  const handleMarkAttendance = async (teacher, type) => {
    setCurrentTeacher(teacher);
    setAttendanceType(type);

    // Joriy vaqtni default qilib qo'yish
    const currentTime = moment();
    if (type === "arrive") {
      setArrivalTime(currentTime);
      setLeaveTime(null);
    } else {
      setLeaveTime(currentTime);
      // Kelgan vaqtni oldin belgilangan vaqtdan olish
      const existingEntry = findTeacherEntry(teacher._id, selectedDate);
      if (existingEntry && existingEntry.time) {
        setArrivalTime(moment(existingEntry.time, "HH:mm"));
      }
    }

    setAttendanceModal(true);
  };

  // Davomatni saqlash - mavjud API formatiga moslashtirish
  const saveAttendance = async () => {
    if (!currentTeacher || !arrivalTime) {
      message.error("O'qituvchi va kelish vaqti majburiy!");
      return;
    }

    try {
      // Mavjud API formatiga mos ma'lumot tayyorlash
      const attendanceData = {
        employeeNo: currentTeacher.employeeNo,
        davomatDate: normalizeDate(selectedDate),
        status: "keldi",
        time: arrivalTime.format("HH:mm"),
        quittedTime: leaveTime ? leaveTime.format("HH:mm") : undefined,
      };

      await addTeacherDavomat(attendanceData).unwrap();
      message.success(
        `${currentTeacher.firstName} ${currentTeacher.lastName} ning davomati belgilandi`
      );

      setAttendanceModal(false);
      setCurrentTeacher(null);
      setArrivalTime(null);
      setLeaveTime(null);
      setAttendanceType("");

      // Ma'lumotlarni yangilash
      refetch();
    } catch (error) {
      console.error("Davomat belgilashda xatolik:", error);
      message.error("Davomat belgilashda xatolik yuz berdi!");
    }
  };

  // Kelmagan deb belgilash
  const markAsAbsent = async (teacher) => {
    try {
      const attendanceData = {
        employeeNo: teacher.employeeNo,
        davomatDate: normalizeDate(selectedDate),
        status: "kelmadi",
      };

      await addTeacherDavomat(attendanceData).unwrap();
      message.success(
        `${teacher.firstName} ${teacher.lastName} kelmagan deb belgilandi`
      );
      refetch();
    } catch (error) {
      console.error("Davomat belgilashda xatolik:", error);
      message.error("Davomat belgilashda xatolik yuz berdi!");
    }
  };

  // ✅ Oylik hisobot hisoblash - zamonaviy versiya
  const getTeacherMonthlyStatus = (teacherId, monthString) => {
    if (!monthString) return;
    const [month, year] = monthString.split("-").map(Number);
    const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();

    const result = [];

    // O'zbekcha kun nomlari
    const uzbekDays = {
      Sunday: "Yakshanba",
      Monday: "Dushanba",
      Tuesday: "Seshanba",
      Wednesday: "Chorshanba",
      Thursday: "Payshanba",
      Friday: "Juma",
      Saturday: "Shanba",
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${year}-${month}-${day}`, "YYYY-MM-DD");
      const formattedDate = currentDate.format("DD-MM-YYYY");

      const entry = findTeacherEntry(teacherId, formattedDate);

      let status = "kelmadi";
      let time = "-";
      let quittedTime = "-";

      if (entry) {
        if (entry.status?.toLowerCase() === "keldi" || entry.time) {
          status = "keldi";
        }
        time = entry.time || time;
        quittedTime = entry.quittedTime || quittedTime;
      }

      result.push({
        key: formattedDate,
        date: formattedDate,
        day: uzbekDays[currentDate.format("dddd")],
        dayNumber: day,
        status,
        time,
        quittedTime,
        isWeekend: currentDate.day() === 0, // faqat Yakshanba dam olish kuni
        // Yakshanba va Shanba
      });
    }
    setMonthlyData(result);
  };

  // Statistikalarni hisoblash
  const getStatistics = () => {
    const totalDays = monthlyData.filter((d) => !d.isWeekend).length;
    const presentDays = monthlyData.filter(
      (d) => d.status === "keldi" && !d.isWeekend
    ).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalDays, presentDays, absentDays, attendanceRate };
  };

  const stats = getStatistics();

  return (
    <div className="page">
      {/* 🆕 Qo'lda davomat modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {attendanceType === "arrive" ? (
              <MdLogin style={{ color: "#52c41a", fontSize: "20px" }} />
            ) : (
              <MdLogout style={{ color: "#ff4d4f", fontSize: "20px" }} />
            )}
            <span>
              {attendanceType === "arrive" ? "Ishga kelish" : "Ishdan ketish"}
            </span>
          </div>
        }
        open={attendanceModal}
        onCancel={() => {
          setAttendanceModal(false);
          setCurrentTeacher(null);
          setArrivalTime(null);
          setLeaveTime(null);
          setAttendanceType("");
        }}
        footer={[
          <Button key="cancel" onClick={() => setAttendanceModal(false)}>
            Bekor qilish
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={isLoading}
            onClick={saveAttendance}
            style={{ background: "#52c41a" }}
          >
            Saqlash
          </Button>,
        ]}
      >
        {currentTeacher && (
          <div>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <Avatar
                size={64}
                style={{ background: "#f56a00", marginBottom: "12px" }}
                icon={<FaUser />}
              />
              <Title level={4} style={{ margin: 0 }}>
                {currentTeacher.firstName} {currentTeacher.lastName}
              </Title>
              <Text type="secondary">Sana: {selectedDate}</Text>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: "16px" }}>
                  <Text strong>Kelish vaqti:</Text>
                  <TimePicker
                    style={{ width: "100%", marginTop: "8px" }}
                    format="HH:mm"
                    value={arrivalTime}
                    onChange={setArrivalTime}
                    placeholder="Kelish vaqtini tanlang"
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: "16px" }}>
                  <Text strong>Ketish vaqti:</Text>
                  <TimePicker
                    style={{ width: "100%", marginTop: "8px" }}
                    format="HH:mm"
                    value={leaveTime}
                    onChange={setLeaveTime}
                    placeholder="Ketish vaqtini tanlang (ixtiyoriy)"
                  />
                </div>
              </Col>
            </Row>

            <div
              style={{
                background: "#f6ffed",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Text type="secondary" style={{ fontSize: "13px" }}>
                <FaClock style={{ marginRight: "6px" }} />
                Standart ish vaqti: 08:00 - 17:00
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* 📊 Zamonaviy O'qituvchi Oylik Hisobot Modal */}
      <Modal
        open={isModalVisible}
        title={null}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
        {/* Modal Header - O'qituvchi uchun maxsus */}
        <div
          style={{
            background: "linear-gradient(135deg, #4facfe 0%, #52c41a 100%)",
            color: "white",
            padding: "24px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar
              size={64}
              style={{ background: "rgba(255,255,255,0.2)", fontSize: "24px" }}
              icon={<FaGraduationCap />}
            />
            <div>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {selectedTeacher?.firstName} {selectedTeacher?.lastName}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}
              >
                <FaUser style={{ marginRight: "8px" }} />
                O'qituvchi
              </Text>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px" }}>
          {/* Oy tanlash va statistika */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col span={8}>
              <Card size="small">
                <DatePicker
                  picker="month"
                  format="MMMM YYYY"
                  style={{ width: "100%" }}
                  placeholder="Oyni tanlang"
                  onChange={(date, dateString) => {
                    const formattedMonth = moment(date).format("MM-YYYY");
                    setSelectedMonth(formattedMonth);
                    getTeacherMonthlyStatus(
                      selectedTeacher._id,
                      formattedMonth
                    );
                  }}
                  defaultValue={moment()}
                />
              </Card>
            </Col>
            <Col span={16}>
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Jami kunlar"
                      value={stats.totalDays}
                      prefix={<FaCalendarAlt style={{ color: "#1890ff" }} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Ishga kelgan"
                      value={stats.presentDays}
                      prefix={<FaCheckCircle style={{ color: "#52c41a" }} />}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Kelmagan"
                      value={stats.absentDays}
                      prefix={<FaTimesCircle style={{ color: "#f5222d" }} />}
                      valueStyle={{ color: "#f5222d" }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <div style={{ textAlign: "center" }}>
                      <Progress
                        type="circle"
                        size={60}
                        percent={stats.attendanceRate}
                        strokeColor={{
                          "0%": "#4facfe",
                          "100%": "#f5576c",
                        }}
                      />
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        Davomat foizi
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider />

          {/* Kalendar ko'rinishida jadval */}
          <Title level={4} style={{ marginBottom: "16px" }}>
            <IoStatsChart style={{ marginRight: "8px", color: "#f5576c" }} />
            Oylik Ish Davomat Kalendari
          </Title>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#fafafa",
                  zIndex: 1,
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    Sana
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    Kun
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    <IoTimeOutline style={{ marginRight: "4px" }} />
                    Kelish
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    <IoExitOutline style={{ marginRight: "4px" }} />
                    Ketish
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    Holat
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((item, index) => (
                  <tr
                    key={item.key}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
                      opacity: item.isWeekend ? 0.6 : 1,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff2f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#fafafa" : "white";
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontWeight: item.isWeekend ? "normal" : "500",
                      }}
                    >
                      {item.date}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                        color: item.isWeekend ? "#999" : "#333",
                      }}
                    >
                      {item.isWeekend ? (
                        <Tag color="orange" size="small">
                          {item.day}
                        </Tag>
                      ) : (
                        <Tag color="purple" size="small">
                          {item.day}
                        </Tag>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                        fontFamily: "monospace",
                      }}
                    >
                      {item.time !== "-" ? (
                        <Tag color="green" style={{ fontFamily: "monospace" }}>
                          <FaClock style={{ marginRight: "4px" }} />
                          {item.time}
                        </Tag>
                      ) : (
                        <span style={{ color: "#ccc" }}>-</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                        fontFamily: "monospace",
                      }}
                    >
                      {item.quittedTime !== "-" ? (
                        <Tag color="orange" style={{ fontFamily: "monospace" }}>
                          <FaClock style={{ marginRight: "4px" }} />
                          {item.quittedTime}
                        </Tag>
                      ) : (
                        <span style={{ color: "#ccc" }}>-</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                      }}
                    >
                      {item.isWeekend ? (
                        <Tag color="default" size="small">
                          Dam olish
                        </Tag>
                      ) : item.status === "keldi" ? (
                        <Tag color="success" size="small">
                          <FaCheckCircle style={{ marginRight: "4px" }} />
                          Ishga kelgan
                        </Tag>
                      ) : (
                        <Tag color="error" size="small">
                          <FaTimesCircle style={{ marginRight: "4px" }} />
                          Kelmagan
                        </Tag>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer statistika */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#fff2f0",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Space size="large">
              <div>
                <Text strong style={{ color: "#f5576c", fontSize: "18px" }}>
                  {stats.attendanceRate}%
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Ish davomati
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px" }} />
              <div>
                <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                  {stats.presentDays}/{stats.totalDays}
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Ishga kelgan kunlar
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px" }} />
              <div>
                <Text strong style={{ color: "#f5222d", fontSize: "16px" }}>
                  {stats.absentDays}
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Kelmagan kunlar
                </div>
              </div>
            </Space>
          </div>
        </div>
      </Modal>

      {/* 📌 Header */}
      <div className="page-header">
        <h1>O'qituvchilar davomati</h1>
        <div className="log-header">
          <DatePicker
            format="DD-MM-YYYY"
            onChange={handleDateChange}
            placeholder="Sana"
          />
          <Button type="primary" onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </Button>
          <Button type="primary" onClick={() => navigate("handle")}>
            <FaPlus />
          </Button>
          {role === "teacher" && (
            <Button
              danger
              type="primary"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
            >
              <FiLogOut />
            </Button>
          )}
        </div>
      </div>

      {/* 📋 Asosiy jadval */}
      <Table>
        <thead>
          <tr>
            <td>№</td>
            <td>O'qituvchi</td>
            <td>Sana</td>
            <td>Kelish vaqti</td>
            <td>Ketish vaqti</td>
            <td>Amallar</td>
            <td>Hisobot</td>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, index) => {
            const status = getStatus(teacher._id, selectedDate);
            const arrivedTime = getArrivedTime(teacher._id);
            const quittedTime = getQuittedTime(teacher._id);

            return (
              <tr key={teacher._id}>
                <td>{index + 1}</td>
                <td>{getTeacherName(teacher._id)}</td>
                <td>{selectedDate}</td>
                <td>{arrivedTime}</td>
                <td>{quittedTime}</td>

                <td>
                  <Space size="small">
                    {/* Ishga kelish tugmasi */}
                    <Button
                      type="primary"
                      size="small"
                      icon={<MdLogin />}
                      onClick={() => handleMarkAttendance(teacher, "arrive")}
                      style={{
                        background: "#52c41a",
                        borderColor: "#52c41a",
                        fontSize: "12px",
                        color: "black",
                      }}
                      disabled={arrivedTime !== "-"}
                    >
                      Keldi
                    </Button>

                    {/* Ishdan ketish tugmasi */}
                    <Button
                      type="primary"
                      size="small"
                      icon={<MdLogout />}
                      onClick={() => handleMarkAttendance(teacher, "leave")}
                      style={{
                        background: "#ff7a00",
                        borderColor: "#ff7a00",
                        fontSize: "12px",
                        color: "black",
                      }}
                      disabled={arrivedTime === "-" || quittedTime !== "-"}
                    >
                      Ketdi
                    </Button>

                    {/* Kelmadi tugmasi */}
                    <Popconfirm
                      title="O'qituvchini kelmagan deb belgilaysizmi?"
                      onConfirm={() => markAsAbsent(teacher)}
                      okText="Ha"
                      cancelText="Yo'q"
                    >
                      <Button
                        danger
                        size="small"
                        icon={<FaTimesCircle />}
                        style={{ fontSize: "12px" , color: "black" }}
                        disabled={arrivedTime !== "-"}
                      >
                        Kelmadi
                      </Button>
                    </Popconfirm>
                  </Space>
                </td>
                <td>
                  <Button
                    type="primary"
                    icon={<FaChartLine />}
                    size="small"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      const currentMonth = moment().format("MM-YYYY");
                      setSelectedMonth(currentMonth);
                      getTeacherMonthlyStatus(teacher._id, currentMonth);
                      setIsModalVisible(true);
                    }}
                    style={{ 
                      background: "#722ed1",
                       borderColor: "#722ed1",
                       width:"120px",
                       height:"34px",
                      
                      
                      }}
                  >
                    Hisobot
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default TeacherDavomat;