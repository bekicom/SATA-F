import React, { useMemo, useState, useEffect } from "react";
import {
  useDeletePaymentMutation,
  useCreatePaymentMutation,
  useGetPaymentLogQuery,
  useCheckDebtStatusMutation,
} from "../../context/service/payment.service";
import { useGetClassQuery } from "../../context/service/class.service";
import { useGetCoinQuery } from "../../context/service/students.service";
import moment from "moment";
import { Button, DatePicker, message, Modal, Select, Table, Input } from "antd";
import { FaChevronLeft, FaDownload, FaPlus } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const { Option } = Select;
const { RangePicker } = DatePicker;

const PaymentLog = () => {
  const { data: payments = [] } = useGetPaymentLogQuery();
  const { data: groups = [] } = useGetClassQuery();
  const { data: students = [] } = useGetCoinQuery();

  const [createPayment] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const [checkDebtStatus] = useCheckDebtStatusMutation();

  const navigate = useNavigate();

  const [createModal, setCreateModal] = useState(false);

  const [dateRange, setDateRange] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");

  // ===== CREATE STATES =====
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentMonth, setPaymentMonth] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [qarzdorlik, setQarzdorlik] = useState({});

  const getMonth = (monthNumber) => {
    const months = {
      "01": "Yanvar",
      "02": "Fevral",
      "03": "Mart",
      "04": "Aprel",
      "05": "May",
      "06": "Iyun",
      "07": "Iyul",
      "08": "Avgust",
      "09": "Sentabr",
      10: "Oktabr",
      11: "Noyabr",
      12: "Dekabr",
    };

    return months[monthNumber] || "";
  };
  // ================= FILTER =================
  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const paymentTime = new Date(payment.createdAt).getTime();

        if (dateRange && dateRange.length === 2) {
          const fromTime = new Date(dateRange[0]).setHours(0, 0, 0, 0);
          const toTime = new Date(dateRange[1]).setHours(23, 59, 59, 999);
          if (paymentTime < fromTime || paymentTime > toTime) return false;
        }

        if (selectedClass && payment.user_group !== selectedClass) return false;

        return true;
      })
      .sort((a, b) =>
        (a.user_fullname || "").localeCompare(b.user_fullname || "", "uz", {
          sensitivity: "base",
        }),
      );
  }, [payments, dateRange, selectedClass]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce(
      (sum, item) => sum + (Number(item.payment_quantity) || 0),
      0,
    );
  }, [filteredPayments]);

  // ================= CHECK DEBT =================
  useEffect(() => {
    const fetchDebt = async () => {
      if (!selectedStudent || !paymentMonth) return;
      try {
        const res = await checkDebtStatus({
          studentId: selectedStudent._id,
          paymentMonth,
        }).unwrap();
        setQarzdorlik(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDebt();
  }, [selectedStudent, paymentMonth]);

  // ================= CREATE =================
  const handleCreatePayment = async () => {
    if (!selectedStudent || !paymentMonth || !paymentAmount) {
      message.error("Barcha maydonlarni to‘ldiring");
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

      await createPayment(obj).unwrap();

      message.success("To'lov muvaffaqiyatli qo'shildi");

      setCreateModal(false);
      setSelectedStudent(null);
      setPaymentAmount("");
      setPaymentMonth("");
    } catch {
      message.error("Xatolik yuz berdi");
    }
  };

  // ================= DELETE =================
  async function handleDeletePayment(id) {
    const password = prompt("Parolni kiriting");
    if (!password) return;

    try {
      await deletePayment({ id, password }).unwrap();
      message.success("To'lov o'chirildi!");
    } catch {
      message.error("Parol xato!");
    }
  }

  // ================= TABLE =================
  const columns = [
    {
      title: "F.I.Sh",
      dataIndex: "user_fullname",
    },
    {
      title: "Sinf",
      dataIndex: "user_group",
      render: (text) => groups.find((g) => g._id === text)?.name || text,
    },
    {
      title: "Summa",
      dataIndex: "payment_quantity",
      render: (text) => `${text.toLocaleString()} UZS`,
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      render: (text) => moment(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "O'chirish",
      render: (_, record) => (
        <Button danger onClick={() => handleDeletePayment(record._id)}>
          <MdDeleteForever />
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>To'lov jurnali</h1>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
          />

          <Select
            placeholder="Sinf"
            style={{ width: 180 }}
            value={selectedClass}
            allowClear
            onChange={(val) => setSelectedClass(val)}
          >
            {groups.map((g) => (
              <Option key={g._id} value={g._id}>
                {g.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={() => setCreateModal(true)}
          >
            To'lov qo'shish
          </Button>

          <Button onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </Button>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          marginBottom: 16,
          padding: 14,
          background: "#f6ffed",
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        💰 Jami summa: {totalAmount.toLocaleString()} UZS
      </div>

      <Table columns={columns} dataSource={filteredPayments} rowKey="_id" />

      {/* ================= CREATE MODAL ================= */}
      <Modal
        open={createModal}
        title="Yangi to'lov"
        onOk={handleCreatePayment}
        onCancel={() => setCreateModal(false)}
        okText="Saqlash"
      >
        <Select
          showSearch
          placeholder="O'quvchini tanlang"
          style={{ width: "100%", marginBottom: 12 }}
          optionFilterProp="label"
          filterOption={(input, option) =>
            option?.label?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={(id) =>
            setSelectedStudent(students.find((s) => s._id === id))
          }
        >
          {students.map((s) => (
            <Option
              key={s._id}
              value={s._id}
              label={`${s.firstName} ${s.lastName}`}
            >
              {s.firstName} {s.lastName}
            </Option>
          ))}
        </Select>

        <DatePicker
          picker="month"
          format="MM-YYYY"
          style={{ width: "100%", marginBottom: 12 }}
          onChange={(date, dateString) => setPaymentMonth(dateString)}
        />

        <Input
          placeholder="Summa"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Select
          value={paymentType}
          onChange={setPaymentType}
          style={{ width: "100%" }}
        >
          <Option value="cash">Naqd</Option>
          <Option value="card">Karta</Option>
          <Option value="bankshot">Bank orqali</Option>
        </Select>

        {qarzdorlik?.debt && !qarzdorlik?.invalid_month && (
          <div
            style={{
              marginBottom: 18,
              padding: "18px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fff1f0, #ffecec)",
              border: "1px solid #ffccc7",
              boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#ff4d4f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                !
              </div>

              <div>
                <div
                  style={{ fontSize: 16, fontWeight: 600, color: "#cf1322" }}
                >
                  Qarzdorlik mavjud
                </div>
                <div style={{ fontSize: 14, color: "#8c8c8c" }}>
                  {qarzdorlik.debt_month?.slice(3, 7)}-yil{" "}
                  {getMonth(qarzdorlik?.debt_month?.slice(0, 2))} oyi
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: "12px",
                borderRadius: "8px",
                background: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              <span>To'lanishi kerak:</span>
              <span style={{ fontSize: 18, color: "#ff4d4f" }}>
                {qarzdorlik?.debt_sum?.toLocaleString()} UZS
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentLog;
