import React, { useState, useMemo } from "react";
import {
  Button,
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
  Spin,
} from "antd";
import {
  FaChevronLeft,
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
  useAddTeacherDavomatMutation,
} from "../../context/service/teacher.service";

// Custom table
import { Table } from "../../components/table/table";

const { Title, Text } = Typography;

const TeacherDavomat = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
const [searchTerm, setSearchTerm] = useState("");
  const { data: teachers = [], isLoading: teachersLoading } =
    useGetTeachersQuery();
  const {
    data: davomatData = [],
    refetch,
    isLoading: davomatLoading,
  } = useGetTeacherDavomatQuery();
  const [addTeacherDavomat, { isLoading }] = useAddTeacherDavomatMutation();

  const today = moment().format("YYYY-MM-DD");

  // State management
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM"),
  );

  // Qo'lda davomat olish uchun state'lar
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [leaveTime, setLeaveTime] = useState(null);
  const [attendanceType, setAttendanceType] = useState("");

  // Sana formatini standartlashtirish
  const normalizeDate = (date) => {
    return moment(date, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).format(
      "YYYY-MM-DD",
    );
  };

  // O'qituvchi ismini olish
  const getTeacherName = (id) => {
    const teacher = teachers.find((t) => t._id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Noma'lum";
  };
const filteredTeachers = useMemo(() => {
  return [...teachers]
    .filter((teacher) => {
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();

      return fullName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();

      return nameA.localeCompare(nameB, "uz", { sensitivity: "base" });
    });
}, [teachers, searchTerm]);

  // O'qituvchi entry topish - optimized with useMemo
  const findTeacherEntry = useMemo(() => {
    return (teacherId, date) => {
      const normalizedDate = normalizeDate(date);

      const attendanceDoc = davomatData.find(
        (doc) =>
          normalizeDate(doc.date) === normalizedDate &&
          Array.isArray(doc.body) &&
          doc.body.some(
            (b) =>
              b &&
              b.teacher_id &&
              String(b.teacher_id._id || b.teacher_id) === String(teacherId),
          ),
      );

      if (!attendanceDoc) return null;

      return attendanceDoc.body.find(
        (b) =>
          b &&
          b.teacher_id &&
          String(b.teacher_id._id || b.teacher_id) === String(teacherId),
      );
    };
  }, [davomatData]);

  // Status olish
  const getStatus = (teacherId, date) => {
    const entry = findTeacherEntry(teacherId, date);
    if (!entry) return null;

    if (entry.status?.toLowerCase() === "kelmadi") {
      return "Kelmadi";
    }

    if (entry.status?.toLowerCase() === "keldi" || entry.time) {
      return "Keldi";
    }

    return null;
  };

  const getArrivedTime = (teacherId) => {
    const entry = findTeacherEntry(teacherId, startDate);
    return entry?.time || "-";
  };

  const getQuittedTime = (teacherId) => {
    const entry = findTeacherEntry(teacherId, startDate);
    return entry?.quittedTime || "-";
  };

  // Qo'lda davomat belgilash
  const handleMarkAttendance = (teacher, type) => {
    setCurrentTeacher(teacher);
    setAttendanceType(type);

    const currentTime = moment();

    if (type === "arrive") {
      setArrivalTime(currentTime);
      setLeaveTime(null);
    } else {
      setLeaveTime(currentTime);
      const existingEntry = findTeacherEntry(teacher._id, startDate);
      if (existingEntry?.time) {
        setArrivalTime(moment(existingEntry.time, "HH:mm"));
      } else {
        message.warning("Avval kelish vaqtini belgilang!");
        return;
      }
    }

    setAttendanceModal(true);
  };
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();

      return nameA.localeCompare(nameB, "uz", { sensitivity: "base" });
    });
  }, [teachers]);

  // Davomatni saqlash
const saveAttendance = async () => {
  if (!currentTeacher) {
    message.error("O'qituvchi tanlanmagan!");
    return;
  }

  try {
    const attendanceData = {
      employeeNo: currentTeacher.employeeNo,
      davomatDate: normalizeDate(startDate),
    };

    // 🔥 KELDI
    if (attendanceType === "arrive") {
      attendanceData.status = "keldi";
    }

    // 🔥 KETDI (hech qanday vaqt yubormaymiz)
    if (attendanceType === "leave") {
      attendanceData.status = "leave";
    }

    await addTeacherDavomat(attendanceData).unwrap();

    const actionText = attendanceType === "arrive" ? "kelish" : "ketish";

    message.success(
      `${currentTeacher.firstName} ${currentTeacher.lastName} ning ${actionText} vaqti belgilandi`,
    );

    setAttendanceModal(false);
    setCurrentTeacher(null);
    setArrivalTime(null);
    setLeaveTime(null);
    setAttendanceType("");

    await refetch();
  } catch (error) {
    console.error("Davomat belgilashda xatolik:", error);
    message.error(
      error?.data?.message || "Davomat belgilashda xatolik yuz berdi!",
    );
  }
};

  // Kelmagan deb belgilash
  const markAsAbsent = async (teacher) => {
    try {
      const attendanceData = {
        employeeNo: teacher.employeeNo,
        davomatDate: normalizeDate(startDate),
        status: "kelmadi",
      };

      await addTeacherDavomat(attendanceData).unwrap();

      message.success(
        `${teacher.firstName} ${teacher.lastName} kelmagan deb belgilandi`,
      );

      await refetch();
    } catch (error) {
      console.error("Davomat belgilashda xatolik:", error);
      message.error(error?.data?.message || "Xatolik yuz berdi!");
    }
  };

  // Oylik hisobot
  const getTeacherMonthlyStatus = (teacherId, monthString) => {
    if (!monthString) return;

    const [year, month] = monthString.split("-").map(Number);
    const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();

    const result = [];

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
      const formattedDate = currentDate.format("YYYY-MM-DD");

      const entry = findTeacherEntry(teacherId, formattedDate);

      let status = "none";
      let time = "-";
      let quittedTime = "-";

      if (entry) {
        if (entry.status?.toLowerCase() === "keldi" || entry.time) {
          status = "keldi";
        } else if (entry.status?.toLowerCase() === "kelmadi") {
          status = "kelmadi";
        }

        time = entry.time || "-";
        quittedTime = entry.quittedTime || "-";
      }

      result.push({
        key: formattedDate,
        date: currentDate.format("DD-MM-YYYY"),
        day: uzbekDays[currentDate.format("dddd")],
        dayNumber: day,
        status,
        time,
        quittedTime,
        // 🔥 Shanba + Yakshanba
        isWeekend: currentDate.day() === 0 || currentDate.day() === 6,
      });
    }

    setMonthlyData(result);
  };

  // Statistika - optimized with useMemo
  const getStatistics = useMemo(() => {
    const workingDays = monthlyData.filter((d) => !d.isWeekend);
    const totalDays = workingDays.length;
    const presentDays = workingDays.filter((d) => d.status === "keldi").length;
    const absentDays = totalDays - presentDays;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalDays, presentDays, absentDays, attendanceRate };
  }, [monthlyData]);

  // Loading state
  if (teachersLoading || davomatLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" tip="Yuklanmoqda..." />
      </div>
    );
  }

  return (
    <div className="page">
      {/* Qo'lda davomat modal */}
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
          <Button
            key="cancel"
            onClick={() => {
              setAttendanceModal(false);
              setCurrentTeacher(null);
              setArrivalTime(null);
              setLeaveTime(null);
              setAttendanceType("");
            }}
          >
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
                style={{ background: "#1890ff", marginBottom: "12px" }}
                icon={<FaGraduationCap />}
              />
              <Title level={4} style={{ margin: 0 }}>
                {currentTeacher.firstName} {currentTeacher.lastName}
              </Title>
              <Text type="secondary">
                Sana: {moment(startDate).format("DD-MM-YYYY")}
              </Text>
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
                    placeholder="Ketish vaqtini tanlang"
                    disabled={attendanceType === "arrive"}
                  />
                </div>
              </Col>
            </Row>

            <div
              style={{
                background: "#e6f7ff",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #91d5ff",
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

      {/* Oylik hisobot modal */}
      <Modal
        open={isModalVisible}
        title={null}
        onCancel={() => {
          setIsModalVisible(false);
          setMonthlyData([]);
        }}
        footer={null}
        width={1000}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
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

        <div style={{ padding: "24px" }}>
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col span={8}>
              <Card size="small">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedMonth(value);
                    getTeacherMonthlyStatus(selectedTeacher._id, value);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    fontSize: "14px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
              </Card>
            </Col>
            <Col span={16}>
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Jami kunlar"
                      value={getStatistics.totalDays}
                      prefix={<FaCalendarAlt style={{ color: "#1890ff" }} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Ishga kelgan"
                      value={getStatistics.presentDays}
                      prefix={<FaCheckCircle style={{ color: "#52c41a" }} />}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Kelmagan"
                      value={getStatistics.absentDays}
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
                        percent={getStatistics.attendanceRate}
                        strokeColor={{ "0%": "#4facfe", "100%": "#52c41a" }}
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

          <Title level={4} style={{ marginBottom: "16px" }}>
            <IoStatsChart style={{ marginRight: "8px", color: "#1890ff" }} />
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
                      textAlign: "left",
                    }}
                  >
                    Sana
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
                      textAlign: "center",
                    }}
                  >
                    Kun
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e8e8e8",
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
                      backgroundColor: item.isWeekend
                        ? "#fff7e6"
                        : index % 2 === 0
                          ? "#fafafa"
                          : "white",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e6f7ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = item.isWeekend
                        ? "#fff7e6"
                        : index % 2 === 0
                          ? "#fafafa"
                          : "white")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      {item.date}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                      }}
                    >
                      {item.isWeekend ? (
                        <Tag color="default">Dam olish</Tag>
                      ) : item.status === "keldi" ? (
                        <Tag color="success">
                          <FaCheckCircle style={{ marginRight: "4px" }} />
                          Kelgan
                        </Tag>
                      ) : item.status === "kelmadi" ? (
                        <Tag color="error">
                          <FaTimesCircle style={{ marginRight: "4px" }} />
                          Kelmagan
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
                        <Tag color="default">Dam olish</Tag>
                      ) : item.status === "keldi" ? (
                        <Tag color="success">
                          <FaCheckCircle style={{ marginRight: "4px" }} />
                          Kelgan
                        </Tag>
                      ) : item.status === "kelmadi" ? (
                        <Tag color="error">
                          <FaTimesCircle style={{ marginRight: "4px" }} />
                          Kelmagan
                        </Tag>
                      ) : (
                        <Tag color="default">kelmadi</Tag>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#f8f9fa",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Space size="large">
              <div>
                <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                  {getStatistics.attendanceRate}%
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Ish davomati
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px" }} />
              <div>
                <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                  {getStatistics.presentDays}/{getStatistics.totalDays}
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Ishga kelgan kunlar
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px" }} />
              <div>
                <Text strong style={{ color: "#f5222d", fontSize: "16px" }}>
                  {getStatistics.absentDays}
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Kelmagan kunlar
                </div>
              </div>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="page-header">
        <h1>
          <FaGraduationCap style={{ marginRight: "12px" }} />
          O'qituvchilar davomati
        </h1>
        <div
          className="log-header"
          style={{ display: "flex", gap: "12px", alignItems: "center" }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="O'qituvchi ismi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                minWidth: "220px",
              }}
            />
            <label style={{ fontSize: "14px", fontWeight: "500" }}>Dan:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            />

     
          </div>

          <Button type="primary" onClick={() => navigate(-1)}>
            <FaChevronLeft /> Orqaga
          </Button>

          <Button type="primary" onClick={() => navigate("handle")}>
            <FaPlus /> Qo'shish
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
              <FiLogOut /> Chiqish
            </Button>
          )}
        </div>
      </div>

      {/* Asosiy jadval */}
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
          {teachers.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">Ma'lumot topilmadi</Text>
              </td>
            </tr>
          ) : (
            filteredTeachers.map((teacher, index) => {
              const status = getStatus(teacher._id, startDate);
              const arrivedTime = getArrivedTime(teacher._id);
              const quittedTime = getQuittedTime(teacher._id);

              const tagConfig = {
                Keldi: { color: "success", icon: <FaCheckCircle /> },
                Kelmadi: { color: "error", icon: <FaTimesCircle /> },
                kelmadi: { color: "default", icon: null },
              };
              const { color: tagColor, icon: tagIcon } =
                tagConfig[status] || tagConfig["kelmadi"];

              return (
                <tr key={teacher._id}>
                  <td>{index + 1}</td>
                  <td>
                    <Space>
                      <Avatar
                        size="small"
                        style={{ background: "#1890ff" }}
                        icon={<FaGraduationCap />}
                      />
                      {getTeacherName(teacher._id)}
                    </Space>
                  </td>
                  <td>{moment(startDate).format("DD-MM-YYYY")}</td>
                  <td>
                    {arrivedTime !== "-" ? (
                      <Tag color="green" style={{ fontFamily: "monospace" }}>
                        <FaClock style={{ marginRight: "4px" }} />
                        {arrivedTime}
                      </Tag>
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </td>
                  <td>
                    {quittedTime !== "-" ? (
                      <Tag color="orange" style={{ fontFamily: "monospace" }}>
                        <FaClock style={{ marginRight: "4px" }} />
                        {quittedTime}
                      </Tag>
                    ) : (
                      <span style={{ color: "#ccc" }}>-</span>
                    )}
                  </td>
                  {/* <td>
                    <Tag color={tagColor} icon={tagIcon}>
                      {status}
                    </Tag>
                  </td> */}
                  <td>
                    <Space size="small">
                      <Button
                        type="primary"
                        size="small"
                        icon={<MdLogin />}
                        onClick={() => handleMarkAttendance(teacher, "arrive")}
                        style={{
                          background: "#52c41a",
                          borderColor: "#52c41a",
                        }}
                        disabled={arrivedTime !== "-" || status === "Kelmadi"}
                      >
                        Keldi
                      </Button>

                      <Button
                        type="primary"
                        size="small"
                        icon={<MdLogout />}
                        onClick={() => handleMarkAttendance(teacher, "leave")}
                        style={{
                          background: "#ff7a00",
                          borderColor: "#ff7a00",
                        }}
                        disabled={
                          arrivedTime === "-" ||
                          quittedTime !== "-" ||
                          status === "Kelmadi"
                        }
                      >
                        Ketdi
                      </Button>

                      <Popconfirm
                        title="Kelmagan deb belgilash"
                        description="O'qituvchini kelmagan deb belgilaysizmi?"
                        onConfirm={() => markAsAbsent(teacher)}
                        okText="Ha"
                        cancelText="Yo'q"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          size="small"
                          icon={<FaTimesCircle />}
                          disabled={status === "Kelmadi" || arrivedTime !== "-"}
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
                        const currentMonth = moment().format("YYYY-MM");
                        setSelectedMonth(currentMonth);
                        getTeacherMonthlyStatus(teacher._id, currentMonth);
                        setIsModalVisible(true);
                      }}
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        minWidth: "100px",
                      }}
                    >
                      Hisobot
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TeacherDavomat;
