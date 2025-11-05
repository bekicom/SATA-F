import React, { useEffect, useState } from "react";
import "./payment.css";
import { useCheckDebtStatusMutation, useCreatePaymentMutation, useGetUncompletedPaymentQuery } from "../../context/service/payment.service";
import { Table, Modal, Button, Input, Select, message, Popover, DatePicker } from "antd";
import { FaList, FaPlus, FaDollarSign } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGetClassQuery } from "../../context/service/class.service";
import { useGetCoinQuery } from "../../context/service/students.service";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import moment from "moment";
const { Search } = Input;
const { Option } = Select;

export const Debt = () => {
  const { data = [] } = useGetUncompletedPaymentQuery();

  const navigate = useNavigate();
  const { data: classData = [] } = useGetClassQuery();
  const { data: studentData = [] } = useGetCoinQuery();
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState({});
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [createPayment] = useCreatePaymentMutation();
  const [checkDebtStatus] = useCheckDebtStatusMutation();
  const [qarzdorlik, setQarzdorlik] = useState({});
  const { data: schoolData = {} } = useGetSchoolQuery();

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
            studentId: selectedStudent.user_id,
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
    const transformed = transformPaymentsData(data);
    setDebts(transformed);
    setFilteredDebts(transformed);
  }, [data]);

  useEffect(() => {
    filterDebts();
  }, [searchTerm, selectedClass, debts]);

  const transformPaymentsData = (payments) => {
    if (!Array.isArray(payments)) return [];

    const groupedPayments = payments.reduce((acc, payment) => {
      if (!acc[payment.user_id]) {
        acc[payment.user_id] = {
          ...payment,
          debtSum: 0,
          debts: {},
        };
      }
      acc[payment.user_id].debtSum +=
        payment.student_monthlyFee - payment.payment_quantity;
      acc[payment.user_id].debts[payment.payment_month] =
        payment.student_monthlyFee - payment.payment_quantity;
      return acc;
    }, {});

    return Object.values(groupedPayments);
  };

  const filterDebts = () => {
    const filtered = debts.filter((debt) => {
      const matchesSearch = debt.user_fullname
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesClass =
        !selectedClass || debt.user_groupId === selectedClass;

      return matchesSearch && matchesClass;
    });
    setFilteredDebts(filtered);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handlePaymentClick = (student) => {
    setSelectedStudent(student);
    setPaymentModal(true);
  };
  const handleOk = async () => {
    try {
      const obj = {
        user_id: selectedStudent.user_id,
        user_fullname:
          selectedStudent.firstName + " " + selectedStudent.lastName,
        user_group: selectedStudent.groupId,
        payment_quantity: Number(paymentAmount),
        payment_month: paymentMonth,
        payment_type: paymentType,
      };
      setPaymentModal(false);
      await createPayment(obj).unwrap();
      setPaymentAmount("");
      setPaymentType("");

      printReceipt(obj);
    } catch (err) {
      console.error("Xatolik:", err);
      message?.error(err?.data?.message);
    }
  };

  const handleCancel = () => {
    setPaymentModal(false);
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "To'liq ismi",
      dataIndex: "user_fullname",
      key: "user_fullname",
    },
    {
      title: "Sinfi",
      dataIndex: "user_group",
      key: "user_group",
    },
    {
      title: "Ota-onasining tel. raq.",
      key: "user_phone",
      render: (record) =>
        studentData?.find((item) => item._id === record?.user_id)
          ?.guardianPhoneNumber,
    },
    {
      title: "Qarz summasi",
      dataIndex: "debtSum",
      key: "debt",
      render: (text) => text.toLocaleString(),
    },

    {
      title: "Qarzdor oylar",
      dataIndex: "payment_month",
      key: "payment_month",
      render: (text, record) => (
        <Button onClick={() => showDebtsModal(record.debts)}>
          <FaList />
        </Button>
      ),
    },
    {
      title: "To'lov",
      key: "actions",
      render: (text, record) => (
        <>
          <Popover placement="bottom" content={"To'lovni amalga oshirish"}>
            <Button type="primary" onClick={() => handlePaymentClick(record)}>
              <FaDollarSign />
            </Button>
          </Popover>
        </>
      ),
    },
  ];
  const formatNumberWithSpaces = (value) => {
    return value
      .replace(/\D/g, "") // Remove non-digit characters
      .replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Add spaces for thousands
  };
  const showDebtsModal = (data) => {
    setModalData(data);
    setIsModalVisible(true);
  };

  const totalDebt = filteredDebts.reduce(
    (acc, debt) => acc + (debt.debtSum || 0),
    0
  );
  const printReceipt = (paymentDetails) => {
    const printWindow = window.open("", "", "width=600,height=400");

    printWindow.document.write(`
      <div style="padding-inline: 5mm; font-family:sans-serif;padding-block: 5mm; align-items:center; display: flex; flex-direction:column; gap:5mm; width:80mm">
      ${schoolData?._id === "67ab141bdd6062f2e4cf4ce5" ? `<img style="max-width:50%; object-fit:cover" src="https://i.ibb.co/WWGNLxhq/buxred.jpg" alt="logo" id="logo" />` : ""}
      <b style="font-size: 1rem; text-align:center">
      To'lov qabul qilinganligi haqidagi kvitansiya
      </b>-------------------------------------------------------<div style="width:100%; display:flex; justify-content:space-between; align-items:center"><b>
      Talaba:
      </b>
      <span>
      ${paymentDetails.user_fullname}
      </span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
      <b>
      Sinf:
      </b>
      <span>
      ${paymentDetails.user_group.name}
      </span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
      <b>
      To'lov miqdori:
      </b>
      <span>
      ${paymentDetails.payment_quantity} UZS
      </span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
      <b>
      To'lov oyi:
      </b>
      <span>
      ${getMonth(paymentDetails.payment_month.slice(0, 2))} 
      </span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
      <b>
      To'lov turi:
      </b>
      <span>
      ${paymentDetails.payment_type === "cash" ? "Naqd to'lov" : "Karta to'lov"}
      </span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
      <b>
      Sana:
      </b>
      <span>
      ${moment().format("DD-MM-YYYY HH:mm")}
      </span>
      </div>-------------------------------------------------------
  
      </div>`);

    if (schoolData._id === "67ab141bdd6062f2e4cf4ce5") {
      const logo = printWindow.document.getElementById("logo");
      logo.onload = () => {
        printWindow.document.close();
        printWindow.print();
      };
    } else {
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="page">
      <Modal
        title={`To'lov - ${
          selectedStudent
            ? selectedStudent.firstName + " " + selectedStudent.lastName
            : ""
        }`}
        visible={paymentModal}
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
              const rawValue = e.target.value.replace(/\s/g, ""); // Remove spaces
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
          </Select>
        </div>
      </Modal>
      <Modal
        title="Qarzdor oylar"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Yopish
          </Button>,
        ]}
      >
        {modalData && Object.entries(modalData).length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {Object.entries(modalData).map(([month, debt], index) => (
              <li
                key={index}
                style={{
                  height: "50px",
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid black",
                }}
              >
                <strong>
                  {monthName(month.slice(0, 2))} {month.slice(3, 7)}
                </strong>
                ={debt.toLocaleString()} UZS
              </li>
            ))}
          </ul>
        ) : (
          <p>Ma'lumot mavjud emas</p>
        )}
      </Modal>

      <div className="page-header">
        <h1>Qarzlar</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "300px", marginRight: "10px" }}
          />
          <Select
            onChange={(value) => setSelectedClass(value)}
            style={{ width: 180 }}
            placeholder="Barcha sinf"
          >
            <Option value="">Barcha sinf</Option>
            {classData.map((classItem) => (
              <Option key={classItem._id} value={classItem._id}>
                {classItem.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => navigate("/payment/create")}>
            <FaPlus /> To'lov qo'shish
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredDebts
          .slice() // 🔥 array'ni kopiyasi olinadi (asosiy massiv buzilmaydi)
          .reverse() // 🔥 teskari qilib beradi
          .map((debt, index) => ({
            ...debt,
            key: debt.user_id || index,
          }))}
        pagination={{ current: currentPage, pageSize: pageSize }}
        onChange={handleTableChange}
      />

      <div className="total-payment">
        <h3>Jami qarz: {totalDebt.toLocaleString()} UZS</h3>
      </div>
    </div>
  );
};

const monthName = (month) => {
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];
  return months[Number(month) - 1] || "Noma'lum oy";
};
