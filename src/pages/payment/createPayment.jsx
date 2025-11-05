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

  const months = [
    { key: "01", name: "yanvar" },
    { key: "02", name: "fevral" },
    { key: "03", name: "mart" },
    { key: "04", name: "aprel" },
    { key: "05", name: "may" },
    { key: "06", name: "iyun" },
    { key: "07", name: "iyul" },
    { key: "08", name: "avgust" },
    { key: "09", name: "sentabr" },
    { key: "10", name: "oktabr" },
    { key: "11", name: "noyabr" },
    { key: "12", name: "dekabr" },
  ];

  function getMonth(monthNumber) {
    return months.find((m) => m.key === monthNumber).name;
  }

  useEffect(() => {
    if (selectedStudent && paymentMonth) {
      const getDebtStatus = async () => {
        try {
          const res = await checkDebtStatus({
            studentId: selectedStudent._id,
            paymentMonth: paymentMonth,
          }).unwrap();
          setQarzdorlik(res);
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
  };

  const handleOk = async () => {
    try {
      const obj = {
        user_id: selectedStudent._id,
        user_fullname:
          selectedStudent.firstName + " " + selectedStudent.lastName,
        user_group: selectedStudent.groupId,
        payment_quantity: Number(paymentAmount),
        payment_month: paymentMonth,
        payment_type: paymentType, // 🟩 endi "bankshot" ham ishlaydi
      };
      setIsModalVisible(false);
      await createPayment(obj).unwrap();
      setPaymentAmount("");
      setPaymentType("");

      message.success("To'lov muvaffaqiyatli amalga oshirildi");
      printReceipt(obj);
    } catch (err) {
      console.error("Xatolik:", err);
      message.error(err?.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
      render: (group) => group.name,
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
      render: (fee) => fee.toLocaleString(),
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

  // format number
  const formatNumberWithSpaces = (value) => {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>O'quvchilarni olishda xato yuz berdi</div>;

  const printReceipt = (paymentDetails) => {
    const printWindow = window.open("", "", "width=600,height=400");

    const paymentTypeText =
      paymentDetails.payment_type === "cash"
        ? "Naqd to'lov"
        : paymentDetails.payment_type === "card"
        ? "Karta to'lov"
        : "Bank orqali to'lov (BankShot)";

    printWindow.document.write(`
      <div style="padding-inline: 5mm; font-family:sans-serif;padding-block: 5mm; align-items:center; display: flex; flex-direction:column; gap:5mm; width:80mm">
        <img style="max-width:50%; object-fit:cover" src="${
          window.location.origin
        }/logo.png" alt="logo" />
        <b style="font-size: 1rem; text-align:center">
          To'lov qabul qilinganligi haqidagi kvitansiya
        </b>
        -------------------------------------------------------
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>Talaba:</b>
          <span>${paymentDetails.user_fullname}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>Sinf:</b>
          <span>${paymentDetails.user_group.name}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>To'lov miqdori:</b>
          <span>${paymentDetails.payment_quantity.toLocaleString()} UZS</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>To'lov oyi:</b>
          <span>${getMonth(paymentDetails.payment_month.slice(0, 2))}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>To'lov turi:</b>
          <span>${paymentTypeText}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>Sana:</b>
          <span>${moment().format("DD-MM-YYYY HH:mm")}</span>
        </div>
        -------------------------------------------------------
      </div>
    `);

    printWindow.document.close();
    printWindow.print();
  };

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
      />

      <Modal
        title={`To'lov - ${
          selectedStudent
            ? selectedStudent.firstName + " " + selectedStudent.lastName
            : ""
        }`}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Saqlash"
        cancelText="Bekor qilish"
        okButtonProps={{ disabled: qarzdorlik?.debt }}
      >
        <div>
          {qarzdorlik?.debt ? (
            <p style={{ color: "red" }}>
              {qarzdorlik.debt_month?.slice(3, 7)}-yil{" "}
              {getMonth(qarzdorlik?.debt_month?.slice(0, 2))} oyi uchun{" "}
              {qarzdorlik?.debt_sum?.toLocaleString()} UZS qarzdorlik mavjud!
            </p>
          ) : null}

          <Input
            value={formatNumberWithSpaces(paymentAmount)}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\s/g, "");
              setPaymentAmount(rawValue);
            }}
            placeholder="To'lov miqdori"
            style={{ marginBottom: 16 }}
            required
          />

          <DatePicker
            onChange={(date, dateString) => setPaymentMonth(dateString)}
            format="MM-YYYY"
            picker="month"
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="Oyni tanlang"
            required
          />

          <Select
            style={{ width: "100%" }}
            value={paymentType}
            onChange={(value) => setPaymentType(value)}
            placeholder="To'lov turi"
            required
          >
            <Option value="cash">Naqd to'lov</Option>
            <Option value="card">Karta to'lov</Option>
            <Option value="bankshot">Xisob Raqam</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default CreatePayment;
