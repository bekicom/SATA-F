import React, { useEffect, useState } from "react";
import "./payment.css";
import {
  useCheckDebtStatusMutation,
  useCreatePaymentMutation,
  useGetUncompletedPaymentQuery,
} from "../../context/service/payment.service";
import { Table, Modal, Button, Input, Select, message, Popover } from "antd";
import { FaList, FaPlus, FaDollarSign, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGetClassQuery } from "../../context/service/class.service";
import { useGetCoinQuery } from "../../context/service/students.service";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import logo from "../../assets/svg/f.jpg"; // ✅ TO'G'RILANDI
import moment from "moment";

const { Search } = Input;
const { Option } = Select;

export const Debt = () => {
  const { data = [] } = useGetUncompletedPaymentQuery();
  const navigate = useNavigate();
  const { data: classData = [] } = useGetClassQuery();
  const { data: studentData = [] } = useGetCoinQuery();
  const { data: schoolData = {} } = useGetSchoolQuery();

  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [createPayment] = useCreatePaymentMutation();
  const [checkDebtStatus] = useCheckDebtStatusMutation();
  const [qarzdorlik, setQarzdorlik] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);

  const monthsList = [
    { key: "01", name: "Yanvar" },
    { key: "02", name: "Fevral" },
    { key: "03", name: "Mart" },
    { key: "04", name: "Aprel" },
    { key: "05", name: "May" },
    { key: "06", name: "Iyun" },
    { key: "07", name: "Iyul" },
    { key: "08", name: "Avgust" },
    { key: "09", name: "Sentabr" },
    { key: "10", name: "Oktabr" },
    { key: "11", name: "Noyabr" },
    { key: "12", name: "Dekabr" },
  ];

  const getMonthName = (monthNumber) =>
    monthsList.find((m) => m.key === monthNumber)?.name || "";

  // 🟢 Barcha oylarni generatsiya qilish
  useEffect(() => {
    generateAllMonths();
  }, []);

  const generateAllMonths = () => {
    const currentYear = moment().year();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const allMonths = [];

    years.forEach((year) => {
      monthsList.forEach((month) => {
        allMonths.push({
          key: `${month.key}-${year}`,
          name: `${month.name} ${year}`,
          value: `${month.key}-${year}`,
          year: year.toString(),
          month: month.key,
        });
      });
    });

    setAvailableMonths(allMonths.reverse());
  };

  // 🟢 Ma'lumotlarni transform qilish
  useEffect(() => {
    const transformed = transformPaymentsData(data);
    setDebts(transformed);
    setFilteredDebts(transformed);
  }, [data]);

  // 🟢 Filtrlash
  useEffect(() => {
    const filtered = debts.filter((debt) => {
      const matchesSearch = debt.user_fullname
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesClass =
        !selectedClass || debt.user_groupId === selectedClass;

      return matchesSearch && matchesClass;
    });
    setFilteredDebts(filtered);
  }, [searchTerm, selectedClass, debts]);

  // 🟢 Talaba tanlanganda oylarni filtrlash
  useEffect(() => {
    if (!selectedStudent) {
      return;
    }

    const student = studentData.find((s) => s._id === selectedStudent.user_id);
    if (!student?.admissionDate) {
      return;
    }

    const admissionDate = moment(student.admissionDate).startOf("month");
    const currentDate = moment().startOf("month");

    const filteredMonths = availableMonths.filter((monthObj) => {
      const monthDate = moment(`01-${monthObj.value}`, "DD-MM-YYYY");
      return (
        monthDate.isSameOrAfter(admissionDate) &&
        monthDate.isSameOrBefore(currentDate)
      );
    });

    setAvailableMonths(filteredMonths);
  }, [selectedStudent, studentData]);

  // 🟢 Qarzdorlikni tekshirish
  useEffect(() => {
    if (selectedStudent && paymentMonth) {
      const getDebtStatus = async () => {
        try {
          const res = await checkDebtStatus({
            studentId: selectedStudent.user_id,
            paymentMonth: paymentMonth,
          }).unwrap();
          setQarzdorlik(res);
          if (res.invalid_month) {
            message.warning("Talaba bu oyda hali qabul qilinmagan");
          }
        } catch (err) {
          console.error("Qarzdorlik tekshirishda xato:", err);
        }
      };
      getDebtStatus();
    }
  }, [selectedStudent, paymentMonth, checkDebtStatus]);

  const transformPaymentsData = (payments) => {
    if (!Array.isArray(payments)) return [];

    const groupedByStudent = payments.reduce((acc, payment) => {
      const studentId = payment.user_id;

      if (!acc[studentId]) {
        acc[studentId] = {
          ...payment,
          key: studentId,
          debtSum: 0,
          debts: {},
          allPayments: [],
        };
      }

      const debtAmount =
        payment.debt_amount ||
        payment.student_monthlyFee - payment.payment_quantity;

      acc[studentId].debtSum += debtAmount;
      acc[studentId].debts[payment.payment_month] = debtAmount;
      acc[studentId].allPayments.push(payment);

      return acc;
    }, {});

    return Object.values(groupedByStudent);
  };

  const handlePaymentClick = (student) => {
    setSelectedStudent(student);
    setPaymentModal(true);
    setPaymentMonth("");
    setPaymentAmount("");
    setPaymentType("");
    setQarzdorlik({});
    generateAllMonths(); // Oylarni qayta yuklash
  };

  const handleOk = async () => {
    if (!paymentAmount || !paymentMonth || !paymentType) {
      message.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    if (!selectedStudent) {
      message.error("Talaba tanlanmagan");
      return;
    }

    try {
      const group = classData.find(
        (g) => g._id === selectedStudent.user_groupId
      );

      const obj = {
        user_id: selectedStudent.user_id,
        user_fullname: selectedStudent.user_fullname,
        user_group: group?._id,
        payment_quantity: Number(paymentAmount),
        payment_month: paymentMonth,
        payment_type: paymentType,
      };

      setPaymentModal(false);
      await createPayment(obj).unwrap();

      setPaymentAmount("");
      setPaymentType("");
      setPaymentMonth("");
      setSelectedStudent(null);

      message.success("To'lov muvaffaqiyatli amalga oshirildi");
      printReceipt(obj, group);
    } catch (err) {
      console.error("To'lov qilishda xato:", err);
      message.error(err?.data?.message || "To'lov qilishda xatolik yuz berdi");
    }
  };

  const handleCancel = () => {
    setPaymentModal(false);
    setPaymentAmount("");
    setPaymentMonth("");
    setPaymentType("");
    setQarzdorlik({});
    setSelectedStudent(null);
    generateAllMonths(); // Oylarni qayta yuklash
  };

  const showDebtsModal = (data) => {
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      message.warning("Qarzdorlik ma'lumotlari mavjud emas");
      return;
    }
    setModalData(data);
    setIsModalVisible(true);
  };

  const totalDebt = filteredDebts.reduce(
    (acc, debt) => acc + (debt.debtSum || 0),
    0
  );

  const printReceipt = (paymentDetails, group) => {
    const printWindow = window.open("", "", "width=600,height=600");
    const paymentTypeText =
      paymentDetails.payment_type === "cash"
        ? "Naqd to'lov"
        : paymentDetails.payment_type === "card"
        ? "Karta to'lov"
        : "Bank orqali to'lov (BankShot)";

    // ✅ LOGO QO'SHILDI
    const logoHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <img src="${logo}" alt="Logo" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>To'lov kvitansiyasi</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 15mm;
              margin: 0;
            }
            .receipt { 
              width: 80mm; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              font-weight: bold; 
              margin-bottom: 15px;
              font-size: 16px;
            }
            .divider { 
              border-top: 2px dashed #000; 
              margin: 15px 0; 
            }
            .row { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0;
              padding: 2px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${logoHTML}
            <div class="header">TO'LOV KVITANSIYASI</div>
            <div class="divider"></div>
            <div class="row">
              <b>Talaba:</b>
              <span>${paymentDetails.user_fullname}</span>
            </div>
            <div class="row">
              <b>Sinf:</b>
              <span>${group?.name || "N/A"}</span>
            </div>
            <div class="row">
              <b>To'lov miqdori:</b>
              <span style="font-weight: bold;">${paymentDetails.payment_quantity.toLocaleString()} UZS</span>
            </div>
            <div class="row">
              <b>To'lov oyi:</b>
              <span>${getMonthName(
                paymentDetails.payment_month.slice(0, 2)
              )} ${paymentDetails.payment_month.slice(3, 7)}</span>
            </div>
            <div class="row">
              <b>To'lov turi:</b>
              <span>${paymentTypeText}</span>
            </div>
            <div class="row">
              <b>Sana:</b>
              <span>${moment().format("DD-MM-YYYY HH:mm")}</span>
            </div>
            <div class="divider"></div>
            <div class="footer">
              <p>To'lov muvaffaqiyatli amalga oshirildi</p>
              <p>Rahmat!</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Logo yuklanishini kutish
    setTimeout(() => {
      printWindow.print();
      // printWindow.close(); // Agar avtomatik yopish kerak bo'lsa
    }, 1000);
  };

  const columns = [
    {
      title: "№",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
      width: 60,
    },
    {
      title: "To'liq ismi",
      dataIndex: "user_fullname",
      key: "user_fullname",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text}</div>
          <small style={{ color: "#666", fontSize: "12px" }}>
            {record.allPayments?.length || 0} ta qarzdor oy
          </small>
        </div>
      ),
    },
    {
      title: "Sinfi",
      dataIndex: "user_group",
      key: "user_group",
      render: (group) => {
        if (typeof group === "string") {
          const groupInfo = classData.find((g) => g._id === group);
          return groupInfo?.name || group;
        }
        return group?.name || "Noma'lum";
      },
    },
    {
      title: "Ota-onasining tel. raq.",
      key: "user_phone",
      render: (record) => {
        const student = studentData?.find(
          (item) => item._id === record?.user_id
        );
        return student?.guardianPhoneNumber || "Noma'lum";
      },
    },
    {
      title: "Qarz summasi",
      dataIndex: "debtSum",
      key: "debt",
      render: (text) => (
        <span style={{ color: "red", fontWeight: "bold" }}>
          {text?.toLocaleString() || "0"} UZS
        </span>
      ),
    },
    {
      title: "Qarzdor oylar",
      key: "payment_month",
      render: (text, record) => (
        <Popover
          content={
            <div style={{ maxWidth: "300px" }}>
              <strong>Qarzdor oylar:</strong>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                {Object.entries(record.debts || {}).map(([month, debt]) => (
                  <li key={month}>
                    {getMonthName(month.slice(0, 2))} {month.slice(3, 7)}:{" "}
                    <strong>{debt.toLocaleString()} UZS</strong>
                  </li>
                ))}
              </ul>
            </div>
          }
          trigger="hover"
        >
          <Button
            type="default"
            onClick={() => showDebtsModal(record.debts)}
            disabled={!record.debts || Object.keys(record.debts).length === 0}
            icon={<FaList />}
          >
            ({Object.keys(record.debts || {}).length})
          </Button>
        </Popover>
      ),
    },
    {
      title: "To'lov",
      key: "actions",
      render: (text, record) => (
        <Popover content="To'lovni amalga oshirish">
          <Button
            type="primary"
            onClick={() => handlePaymentClick(record)}
            icon={<FaDollarSign />}
          >
            To'lash
          </Button>
        </Popover>
      ),
    },
  ];

  return (
    <div className="page">
      {/* To'lov Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaDollarSign style={{ color: "#52c41a" }} />
            <span>To'lov - {selectedStudent?.user_fullname || ""}</span>
          </div>
        }
        open={paymentModal}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="To'lov qilish"
        cancelText="Bekor qilish"
        okButtonProps={{
          disabled: qarzdorlik?.debt || qarzdorlik?.invalid_month,
          style: { background: "#52c41a", borderColor: "#52c41a" },
        }}
        width={500}
      >
        {selectedStudent?.user_id && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#f0f8ff",
              borderRadius: "6px",
              border: "1px solid #1890ff",
            }}
          >
            <strong style={{ color: "#1890ff" }}>
              📅 Qabul qilingan sana:
            </strong>{" "}
            {moment(
              studentData.find((s) => s._id === selectedStudent.user_id)
                ?.admissionDate
            ).format("DD-MM-YYYY")}
          </div>
        )}

        {qarzdorlik?.debt && !qarzdorlik?.invalid_month && (
          <div
            style={{
              color: "red",
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#fff2f0",
              borderRadius: "6px",
              border: "1px solid #ffccc7",
            }}
          >
            ⚠️ <strong>Qarzdorlik mavjud!</strong>
            <br />
            {qarzdorlik.debt_month?.slice(3, 7)}-yil{" "}
            {getMonthName(qarzdorlik?.debt_month?.slice(0, 2))} oyi uchun
            <br />
            <strong>{qarzdorlik?.debt_sum?.toLocaleString()} UZS</strong>{" "}
            qarzdorlik to'lanishi kerak
          </div>
        )}

        {qarzdorlik?.invalid_month && (
          <div
            style={{
              color: "orange",
              marginBottom: 16,
              padding: "12px",
              backgroundColor: "#fff7e6",
              borderRadius: "6px",
              border: "1px solid #ffd591",
            }}
          >
            ⚠️ <strong>To'lov qila olmaysiz!</strong>
            <br />
            Talaba bu oyda hali qabul qilinmagan
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            📅 To'lov oyini tanlang:
          </label>
          <Select
            style={{ width: "100%" }}
            value={paymentMonth}
            onChange={setPaymentMonth}
            placeholder="Oyni tanlang"
            disabled={!selectedStudent}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            suffixIcon={<FaCalendarAlt />}
          >
            {availableMonths.map((month) => (
              <Option key={month.value} value={month.value}>
                {month.name}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            💰 To'lov miqdori (UZS):
          </label>
          <Input
            value={paymentAmount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            onChange={(e) =>
              setPaymentAmount(e.target.value.replace(/\s/g, ""))
            }
            placeholder="Masalan: 500000"
            style={{ width: "100%" }}
            size="large"
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            💳 To'lov turi:
          </label>
          <Select
            style={{ width: "100%" }}
            value={paymentType}
            onChange={(value) => setPaymentType(value)}
            placeholder="To'lov turini tanlang"
            size="large"
          >
            <Option value="cash">💵 Naqd to'lov</Option>
            <Option value="card">💳 Karta to'lov</Option>
            <Option value="bankshot">🏦 Xisob Raqam</Option>
          </Select>
        </div>
      </Modal>

      {/* Qarzdor oylar Modal */}
      <Modal
        title="Qarzdor oylar"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Yopish
          </Button>,
        ]}
        width={400}
      >
        {modalData &&
        typeof modalData === "object" &&
        Object.keys(modalData).length > 0 ? (
          <div>
            <p>
              <strong>
                Jami qarzdor oylar: {Object.keys(modalData).length} ta
              </strong>
            </p>
            <ul
              style={{
                listStyle: "none",
                marginTop: 10,
                gap: 10,
                display: "flex",
                flexDirection: "column",
                maxHeight: "400px",
                overflowY: "auto",
                padding: 0,
              }}
            >
              {Object.entries(modalData).map(([month, debt], index) => (
                <li
                  key={index}
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e8e8e8",
                    backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                  }}
                >
                  <strong>
                    {getMonthName(month.slice(0, 2))} {month.slice(3, 7)}
                  </strong>
                  <span style={{ color: "red", fontWeight: "bold" }}>
                    {debt.toLocaleString()} UZS
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Qarzdorlik ma'lumotlari mavjud emas</p>
        )}
      </Modal>

      {/* Asosiy sahifa */}
      <div className="page-header">
        <h1>Qarzlar</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300, marginRight: 10 }}
            allowClear
          />
          <Select
            onChange={(value) => setSelectedClass(value)}
            style={{ width: 180 }}
            placeholder="Barcha sinf"
            value={selectedClass}
            allowClear
          >
            <Option value="">Barcha sinf</Option>
            {classData.map((classItem) => (
              <Option key={classItem._id} value={classItem._id}>
                {classItem.name}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={() => navigate("/payment/create")}
            icon={<FaPlus />}
          >
            To'lov qo'shish
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredDebts}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredDebts.length,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={(pagination) => {
          setCurrentPage(pagination.current);
          setPageSize(pagination.pageSize);
        }}
        loading={!data}
        scroll={{ x: 800 }}
      />

      <div
        className="total-payment"
        style={{
          marginTop: 20,
          padding: "16px",
          backgroundColor: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: "6px",
        }}
      >
        <h3 style={{ margin: 0, color: "#389e0d" }}>
          Jami qarz: {totalDebt.toLocaleString()} UZS
        </h3>
        <p style={{ margin: "8px 0 0 0", color: "#389e0d" }}>
          Jami qarzdor talabalar: {filteredDebts.length} ta
        </p>
      </div>
    </div>
  );
};

export default Debt;
