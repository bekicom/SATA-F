import React, { useEffect, useState } from "react";
import { useGetClassQuery } from "../../context/service/class.service";
import {
  useGetDavomatQuery,
  useAddDavomatByScanMutation,
} from "../../context/service/oquvchiDavomati.service";
import { useGetCoinQuery } from "../../context/service/students.service";
import {
  Button,
  DatePicker,
  Select,
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
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaChartLine,
} from "react-icons/fa";
import { IoTimeOutline, IoExitOutline, IoStatsChart } from "react-icons/io5";
import { MdLogin, MdLogout } from "react-icons/md";
import moment from "moment";
import { Table } from "../../components/table/table";

const { Title, Text } = Typography;

const Davomat = () => {
  const today = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // qo'lda davomat modal
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);
  const [leaveTime, setLeaveTime] = useState(null);
  const [attendanceType, setAttendanceType] = useState("");

  const navigate = useNavigate();
  const { data: classData = [] } = useGetClassQuery();
  const { data: davomatData = [], refetch } = useGetDavomatQuery();
  const { data: studentData = [] } = useGetCoinQuery();
  const [addDavomatByScan, { isLoading }] = useAddDavomatByScanMutation();

  // sinf bo‘yicha filter
  useEffect(() => {
    if (selectedClass) {
      setFilteredStudents(
        studentData.filter((item) => item.groupId._id === selectedClass)
      );
    } else {
      setFilteredStudents(studentData);
    }
  }, [selectedClass, studentData]);

  const onChange = (date, dateString) => {
    setSelectedDate(dateString || today);
  };

  // bitta student uchun shu kunga tegishli yozuv
  const getStudentEntry = (studentId) => {
    const entryForDay = davomatData?.find(
      (item) =>
        moment(item.date).format("YYYY-MM-DD") ===
        moment(selectedDate).format("YYYY-MM-DD")
    );
    if (!entryForDay || !Array.isArray(entryForDay.body)) return null;

    return entryForDay.body.find(
      (s) => String(s.student_id?._id || s.student_id) === String(studentId)
    );
  };

  // asosiy jadval uchun status matnini qaytarish
  const getStatus = (studentId) => {
    const entry = getStudentEntry(studentId);

    if (!entry) return "Belgilanmagan";

    if (entry.status === "keldi") return "Keldi";
    if (entry.status === "ketdi") return "Ketdi";
    if (entry.status === "kelmadi") return "Kelmadi";

    return "Belgilanmagan";
  };

  const getArrivedTime = (studentId) => {
    const entry = getStudentEntry(studentId);
    return entry?.time || "-";
  };

  const getQuittedTime = (studentId) => {
    const entry = getStudentEntry(studentId);
    return entry?.quittedTime || "-";
  };

  // qo'lda Keldi / Ketdi belgilash
  const handleMarkAttendance = (student, type) => {
    setCurrentStudent(student);
    setAttendanceType(type);

    const currentTime = moment();
    if (type === "arrive") {
      setArrivalTime(currentTime);
      setLeaveTime(null);
    } else {
      setLeaveTime(currentTime);
      const existingEntry = getStudentEntry(student._id);
      if (existingEntry && existingEntry.time) {
        setArrivalTime(moment(existingEntry.time, "HH:mm"));
      }
    }

    setAttendanceModal(true);
  };

  // qo'lda Keldi/Ketdi saqlash
  const saveAttendance = async () => {
    if (!currentStudent || !arrivalTime) {
      message.error("Student va kelish vaqti majburiy!");
      return;
    }

    try {
      const attendanceData = {
        employeeNo: currentStudent.employeeNo,
        date: moment(selectedDate).format("YYYY-MM-DD"),
        status: "keldi",
        time: arrivalTime.format("HH:mm"),
        quittedTime: leaveTime ? leaveTime.format("HH:mm") : undefined,
      };

      await addDavomatByScan(attendanceData).unwrap();
      message.success(
        `${currentStudent.firstName} ${currentStudent.lastName} ning davomati belgilandi`
      );

      setAttendanceModal(false);
      setCurrentStudent(null);
      setArrivalTime(null);
      setLeaveTime(null);
      setAttendanceType("");
      refetch();
    } catch (error) {
      console.error("Davomat belgilashda xatolik:", error);
      message.error("Davomat belgilashda xatolik yuz berdi!");
    }
  };

  // Kelmadi bosilganda – backendga status: "kelmadi"
  const markAsAbsent = async (student) => {
    try {
      const attendanceData = {
        employeeNo: student.employeeNo,
        date: moment(selectedDate).format("YYYY-MM-DD"),
        status: "kelmadi",
      };

      const res = await addDavomatByScan(attendanceData).unwrap();
      console.log("Kelmadi javobi:", res);

      message.success(
        `${student.firstName} ${student.lastName} kelmagan deb belgilandi`
      );
      refetch();
    } catch (error) {
      console.error("Davomat belgilashda xatolik:", error);
      message.error("Davomat belgilashda xatolik yuz berdi!");
    }
  };

  // Oylik hisobot – endi 3 ta holat: keldi / kelmadi / belgilanmagan
  const getMonthlyStatus = (student_id, month) => {
    const [monthPart, yearPart] = month.split("-").map(Number);
    const daysInMonth = new Date(yearPart, monthPart, 0).getDate();

    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(
        `${yearPart}-${monthPart}-${day}`,
        "YYYY-MM-DD"
      );

      const entryForDay = davomatData.find(
        (d) =>
          moment(d.date).format("YYYY-MM-DD") ===
          currentDate.format("YYYY-MM-DD")
      );

      let status = "none"; // yozuv yo‘q – belgilanmagan
      let time = "-";
      let quittedTime = "-";

      if (entryForDay && Array.isArray(entryForDay.body)) {
        entryForDay.body.forEach((item) => {
          if (
            String(item.student_id?._id || item.student_id) ===
            String(student_id)
          ) {
            if (item.status === "keldi") status = "keldi";
            else if (item.status === "kelmadi") status = "kelmadi";

            time = item.time || time;
            quittedTime = item.quittedTime || quittedTime;
          }
        });
      }

      const uzbekDays = {
        Sunday: "Yakshanba",
        Monday: "Dushanba",
        Tuesday: "Seshanba",
        Wednesday: "Chorshanba",
        Thursday: "Payshanba",
        Friday: "Juma",
        Saturday: "Shanba",
      };

      result.push({
        key: currentDate.format("DD-MM-YYYY"),
        date: currentDate.format("DD-MM-YYYY"),
        day: uzbekDays[currentDate.format("dddd")],
        status,
        time,
        quittedTime,
        isWeekend: currentDate.day() === 0,
      });
    }

    setMonthlyData(result);
  };

  // statistikalar – keldi va kelmadi alohida
  const getStatistics = () => {
    const workingDays = monthlyData.filter((d) => !d.isWeekend);
    const totalDays = workingDays.length;
    const presentDays = workingDays.filter((d) => d.status === "keldi").length;
    const absentDays = workingDays.filter((d) => d.status === "kelmadi").length;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalDays, presentDays, absentDays, attendanceRate };
  };

  const stats = getStatistics();

  return (
    <div className="page">
      {/* Qo‘lda davomat modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {attendanceType === "arrive" ? (
              <MdLogin style={{ color: "#52c41a", fontSize: "20px" }} />
            ) : (
              <MdLogout style={{ color: "#ff4d4f", fontSize: "20px" }} />
            )}
            <span>
              {attendanceType === "arrive" ? "Darsga kelish" : "Darsdan ketish"}
            </span>
          </div>
        }
        open={attendanceModal}
        onCancel={() => {
          setAttendanceModal(false);
          setCurrentStudent(null);
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
        {currentStudent && (
          <div>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <Avatar
                size={64}
                style={{ background: "#f56a00", marginBottom: "12px" }}
                icon={<FaUser />}
              />
              <Title level={4} style={{ margin: 0 }}>
                {currentStudent.firstName} {currentStudent.lastName}
              </Title>
              <Text type="secondary">
                {currentStudent.groupId?.name} - ID: {currentStudent.employeeNo}{" "}
                - Sana: {selectedDate}
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
                Dars vaqti: 08:00 - 17:00
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Oylik hisobot modal */}
      <Modal
        open={isModalVisible}
        title={null}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={1000}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "24px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar
              size={64}
              style={{ background: "rgba(255,255,255,0.2)", fontSize: "24px" }}
              icon={<FaUser />}
            />
            <div>
              <Title level={3} style={{ color: "white", margin: 0 }}>
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </Title>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}
              >
                <FaCalendarAlt style={{ marginRight: "8px" }} />
                {selectedStudent?.groupId?.name} guruhi - ID:{" "}
                {selectedStudent?.employeeNo}
              </Text>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col span={8}>
              <Card size="small">
                <DatePicker
                  picker="month"
                  format="MMMM YYYY"
                  style={{ width: "100%" }}
                  placeholder="Oyni tanlang"
                  onChange={(date) => {
                    const formattedMonth = moment(date).format("MM-YYYY");
                    getMonthlyStatus(selectedStudent._id, formattedMonth);
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
                      title="Kelgan"
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
                        strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
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
            Oylik Davomat Kalendari
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
                  <th style={{ padding: "12px 8px", textAlign: "left" }}>
                    Sana
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>
                    Kun
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>
                    <IoTimeOutline style={{ marginRight: "4px" }} />
                    Kelish
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>
                    <IoExitOutline style={{ marginRight: "4px" }} />
                    Ketish
                  </th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>
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
                        <Tag color="orange" size="small">
                          {item.day}
                        </Tag>
                      ) : (
                        <Tag color="blue" size="small">
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
                          Kelgan
                        </Tag>
                      ) : item.status === "kelmadi" ? (
                        <Tag color="error" size="small">
                          <FaTimesCircle style={{ marginRight: "4px" }} />
                          Kelmagan
                        </Tag>
                      ) : (
                        <Tag color="default" size="small">
                          Belgilangan emas
                        </Tag>
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
                  {stats.attendanceRate}%
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Umumiy davomat
                </div>
              </div>
              <Divider type="vertical" style={{ height: "40px" }} />
              <div>
                <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                  {stats.presentDays}/{stats.totalDays}
                </Text>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Kelgan kunlar
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

      {/* Header */}
      <div className="page-header">
        <h1>O'quvchilar davomati</h1>
        <div className="log-header" style={{ display: "flex", gap: "8px" }}>
          <Select
            onChange={(value) => setSelectedClass(value)}
            defaultValue=""
            style={{ minWidth: "180px" }}
          >
            <Select.Option value="">Barcha sinflar</Select.Option>
            {classData.map((item) => (
              <Select.Option key={item._id} value={item._id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
          <DatePicker
            format="YYYY-MM-DD"
            onChange={onChange}
            placeholder="Sana"
          />
          <Button onClick={() => navigate("teacher")} type="primary">
            O'qituvchi davomati
          </Button>
        </div>
      </div>

      {/* Asosiy jadval */}
      <Table>
        <thead>
          <tr>
            <td>№</td>
            <td>O'quvchi</td>
            <td>Sinf</td>
            <td>ID</td>
            <td>Sana</td>
            <td>Kelish vaqti</td>
            <td>Ketish vaqti</td>
            <td>Holati</td>
            <td>Amallar</td>
            <td>Hisobot</td>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student, index) => {
            const status = getStatus(student._id);
            const arrivedTime = getArrivedTime(student._id);
            const quittedTime = getQuittedTime(student._id);

            let tagColor = "default";
            if (status === "Keldi") tagColor = "success";
            else if (status === "Ketdi") tagColor = "processing";
            else if (status === "Kelmadi") tagColor = "error";

            const tagIcon =
              status === "Keldi" ? (
                <FaCheckCircle />
              ) : status === "Ketdi" ? (
                <FaClock />
              ) : status === "Kelmadi" ? (
                <FaTimesCircle />
              ) : null;

            return (
              <tr key={student._id}>
                <td>{index + 1}</td>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.groupId?.name}</td>
                <td>{student.employeeNo}</td>
                <td>{selectedDate}</td>
                <td>{arrivedTime}</td>
                <td>{quittedTime}</td>
                <td>
                  <Tag color={tagColor} icon={tagIcon}>
                    {status}
                  </Tag>
                </td>
                <td>
                  <Space size="small">
                    <Button
                      type="primary"
                      size="small"
                      icon={<MdLogin />}
                      onClick={() => handleMarkAttendance(student, "arrive")}
                      style={{
                        background: "#52c41a",
                        borderColor: "#52c41a",
                        fontSize: "12px",
                      }}
                      disabled={arrivedTime !== "-" || status === "Kelmadi"}
                    >
                      Keldi
                    </Button>

                    <Button
                      type="primary"
                      size="small"
                      icon={<MdLogout />}
                      onClick={() => handleMarkAttendance(student, "leave")}
                      style={{
                        background: "#ff7a00",
                        borderColor: "#ff7a00",
                        fontSize: "12px",
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
                      title="O'quvchini kelmagan deb belgilaysizmi?"
                      onConfirm={() => markAsAbsent(student)}
                      okText="Ha"
                      cancelText="Yo'q"
                    >
                      <Button
                        danger
                        size="small"
                        icon={<FaTimesCircle />}
                        style={{ fontSize: "12px" }}
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
                      setSelectedStudent(student);
                      const currentMonth = moment().format("MM-YYYY");
                      getMonthlyStatus(student._id, currentMonth);
                      setIsModalVisible(true);
                    }}
                    style={{
                      width: "120px",
                      height: "37px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
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

export default Davomat;
