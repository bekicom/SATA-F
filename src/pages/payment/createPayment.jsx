import React, { useState, useEffect } from "react";
import {
  Table,
  Popover,
  Input,
  Button,
  message,
  Modal,
  DatePicker,
  Select,
} from "antd";
import { FaChevronLeft, FaDollarSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGetCoinQuery } from "../../context/service/students.service";
import moment from "moment";
import {
  useCheckDebtStatusMutation,
  useCreatePaymentMutation,
} from "../../context/service/payment.service";
import { Loading } from "../../components/loading/loading";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import logo from "../../assets/svg/f.jpg"; // ✅ LOGO IMPORT QILINDI

const { Search } = Input;
const { Option } = Select;

const CreatePayment = () => {
  const navigate = useNavigate();
  const {
    data: students = [],
    error: fetchError,
    isLoading: fetchLoading,
  } = useGetCoinQuery();
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [qarzdorlik, setQarzdorlik] = useState({});
  const [createPayment] = useCreatePaymentMutation();
  const [checkDebtStatus] = useCheckDebtStatusMutation();
  const { data: schoolData = {} } = useGetSchoolQuery();
  const [paymentType, setPaymentType] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [disabledMonths, setDisabledMonths] = useState([]);
  const [paidMonths, setPaidMonths] = useState([]);

  const months = [
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

  const allMonthsList = Array.from({ length: 12 }, (_, i) => {
    const key = moment().month(i).format("MM");
    const name = months.find((m) => m.key === key)?.name || "";
    const year = moment().format("YYYY");

    return {
      key,
      name,
      year,
      value: `${key}-${year}`,
    };
  });

  useEffect(() => {
    if (selectedStudent) {
      const admission = moment(selectedStudent.admissionDate);

      const disabled = allMonthsList
        .filter((m) => {
          const monthDate = moment(`${m.key}-${m.year}`, "MM-YYYY");
          return monthDate.isBefore(admission, "month");
        })
        .map((m) => m.value);

      setDisabledMonths(disabled);
    }
  }, [selectedStudent]);

  useEffect(() => {
    const fetchPaid = async () => {
      if (!selectedStudent) return;
      try {
        const res = await checkDebtStatus({
          studentId: selectedStudent._id,
        }).unwrap();

        setPaidMonths(res.paidMonths || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPaid();
  }, [selectedStudent]);

  function getMonth(monthNumber) {
    return months.find((m) => m.key === monthNumber)?.name || "";
  }

  // 🟢 O'quvchi tanlanganda, uning qabul qilingan oyidan boshlab oylarni filtrlash
  useEffect(() => {
    if (selectedStudent) {
      const admissionDate = moment(selectedStudent.admissionDate);
      const currentDate = moment();
      const filteredMonths = [];

      let tempDate = admissionDate.clone();

      while (tempDate.isSameOrBefore(currentDate, "month")) {
        const monthKey = tempDate.format("MM");
        const year = tempDate.format("YYYY");
        const monthName = getMonth(monthKey);

        filteredMonths.push({
          key: monthKey,
          name: monthName,
          year: year,
          value: `${monthKey}-${year}`,
        });

        tempDate.add(1, "month");
      }

      setAvailableMonths(filteredMonths);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedStudent && paymentMonth) {
      const getDebtStatus = async () => {
        try {
          const res = await checkDebtStatus({
            studentId: selectedStudent._id,
            paymentMonth: paymentMonth,
          }).unwrap();
          setQarzdorlik(res);

          // 🟢 Agar invalid_month true bo'lsa, xabar ko'rsatish
          if (res.invalid_month) {
            message.warning("Talaba bu oyda hali qabul qilinmagan");
          }
        } catch (err) {
          console.error("Error fetching debt status:", err);
        }
      };
      getDebtStatus();
    }
  }, [selectedStudent, paymentMonth]);

  useEffect(() => {
    setFilteredStudents(students);
  }, [students]);

  const handleSearch = (value) => {
    const filtered = students.filter((student) =>
      (student.firstName + " " + student.lastName)
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handlePaymentClick = (student) => {
    setSelectedStudent(student);
    setIsModalVisible(true);
    setPaymentMonth("");
    setPaymentAmount("");
    setPaymentType("");
    setQarzdorlik({});
  };

  const handleOk = async () => {
    if (!paymentAmount || !paymentMonth || !paymentType) {
      message.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    try {
      const obj = {
        user_id: selectedStudent._id,
        user_fullname:
          selectedStudent.firstName + " " + selectedStudent.lastName,
        user_group: selectedStudent.groupId,
        payment_quantity: Number(paymentAmount),
        payment_month: paymentMonth,
        payment_type: paymentType,
      };
      setIsModalVisible(false);
      await createPayment(obj).unwrap();
      setPaymentAmount("");
      setPaymentType("");
      setPaymentMonth("");

      message.success("To'lov muvaffaqiyatli amalga oshirildi");
      printReceipt(obj);
    } catch (err) {
      console.error("Xatolik:", err);
      message.error(err?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setPaymentMonth("");
    setPaymentAmount("");
    setPaymentType("");
    setQarzdorlik({});
  };

  const columns = [
    {
      title: "№",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "FISH",
      dataIndex: "firstName",
      key: "firstName",
      render: (text, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "Sinf",
      dataIndex: "groupId",
      key: "groupId",
      render: (group) => group?.name || "N/A",
    },
    {
      title: "Tug'ilgan sana",
      dataIndex: "birthDate",
      key: "birthDate",
      render: (date) => moment(date).format("DD-MM-YYYY"),
    },
    {
      title: "Telefon raqam",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Ota onasining tel.",
      dataIndex: "guardianPhoneNumber",
      key: "guardianPhoneNumber",
    },
    {
      title: "Jinsi",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Umumiy oylik to'lov",
      dataIndex: "monthlyFee",
      key: "monthlyFee",
      render: (fee) => fee?.toLocaleString() || "0",
    },
    {
      title: "To'lov",
      key: "actions",
      render: (text, record) => (
        <Popover placement="bottom" content={"To'lovni amalga oshirish"}>
          <Button type="primary" onClick={() => handlePaymentClick(record)}>
            <FaDollarSign />
          </Button>
        </Popover>
      ),
    },
  ];

  const formatNumberWithSpaces = (value) => {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // ✅ YANGILANGAN PRINT RECEIPT FUNKSIYASI LOGO BILAN
  const printReceipt = (paymentDetails) => {
    const printWindow = window.open("", "", "width=600,height=600");

    const paymentTypeText =
      paymentDetails.payment_type === "cash"
        ? "Naqd to'lov"
        : paymentDetails.payment_type === "card"
        ? "Karta to'lov"
        : "Bank orqali to'lov";

    printWindow.document.write(`
      <html>
        <head>
          <title>To'lov kvitansiyasi</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 15mm;
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .receipt { 
              width: 80mm; 
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .logo-container {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #ccc;
            }
            .logo {
              max-width: 120px;
              max-height: 60px;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 15px;
              color: #1890ff;
            }
            .divider {
              border-top: 1px dashed #666;
              margin: 15px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 4px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
            .amount {
              color: #52c41a;
              font-weight: bold;
              font-size: 16px;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0; 
                background: white;
              }
              .receipt { 
                box-shadow: none; 
                border: none;
                width: 100%;
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="logo-container">
              <img class="logo" src="${logo}" alt="School Logo" />
            </div>
            <div class="header">TO'LOV KVITANSIYASI</div>
            <div class="divider"></div>
            <div class="row">
              <strong>Talaba:</strong>
              <span>${paymentDetails.user_fullname}</span>
            </div>
            <div class="row">
              <strong>Sinf:</strong>
              <span>${paymentDetails.user_group?.name || "N/A"}</span>
            </div>
            <div class="row">
              <strong>To'lov miqdori:</strong>
              <span class="amount">${paymentDetails.payment_quantity.toLocaleString()} UZS</span>
            </div>
            <div class="row">
              <strong>To'lov oyi:</strong>
              <span>${getMonth(
                paymentDetails.payment_month.slice(0, 2)
              )} ${paymentDetails.payment_month.slice(3, 7)}</span>
            </div>
            <div class="row">
              <strong>To'lov turi:</strong>
              <span>${paymentTypeText}</span>
            </div>
            <div class="row">
              <strong>Sana:</strong>
              <span>${moment().format("DD-MM-YYYY HH:mm")}</span>
            </div>
            <div class="divider"></div>
            <div class="footer">
              <p><strong>To'lov muvaffaqiyatli amalga oshirildi</strong></p>
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

  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>O'quvchilarni olishda xato yuz berdi</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>To'lov yaratish</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => handleSearch(e.target.value)}
            enterButton
            style={{ width: "300px" }}
          />
          <Button type="primary" onClick={() => navigate("/payment")}>
            <FaChevronLeft />
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="_id"
        loading={fetchLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaDollarSign style={{ color: "#52c41a" }} />
            <span>
              To'lov -{" "}
              {selectedStudent
                ? selectedStudent.firstName + " " + selectedStudent.lastName
                : ""}
            </span>
          </div>
        }
        open={isModalVisible}
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
        <div>
          {selectedStudent && (
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
              {moment(selectedStudent.admissionDate).format("DD-MM-YYYY")}
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
              {getMonth(qarzdorlik?.debt_month?.slice(0, 2))} oyi uchun
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
              onChange={(value) => setPaymentMonth(value)}
              placeholder="Oyni tanlang"
              disabled={!selectedStudent}
            >
              {allMonthsList.map((m) => {
                const isDisabled =
                  disabledMonths.includes(m.value) ||
                  paidMonths.includes(m.value);

                return (
                  <Option key={m.value} value={m.value} disabled={isDisabled}>
                    {m.name} {m.year}
                    {paidMonths.includes(m.value) && " (to'langan)"}
                    {disabledMonths.includes(m.value) && " (qabul qilinmagan)"}
                  </Option>
                );
              })}
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
              value={formatNumberWithSpaces(paymentAmount)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\s/g, "");
                setPaymentAmount(rawValue);
              }}
              placeholder="Masalan: 500000"
              style={{ width: "100%" }}
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
            >
              <Option value="cash">💵 Naqd to'lov</Option>
              <Option value="card">💳 Karta to'lov</Option>
              <Option value="bankshot">🏦 Xisob Raqam</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreatePayment;
