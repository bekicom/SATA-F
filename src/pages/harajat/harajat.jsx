import React, { useState, useEffect } from "react";
import { Table, Input, Button, Select, DatePicker, Tag } from "antd";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGetHarajatQuery } from "../../context/service/harajat.service";
import moment from "moment";
import { Loading } from "../../components/loading/loading";

const { Option } = Select;

const Harajat = () => {
  const navigate = useNavigate();

  // 🔹 API dan ma'lumotlarni olish
  const {
    data = [],
    error: fetchError,
    isLoading: fetchLoading,
  } = useGetHarajatQuery();

  // 🔹 Local state’lar
  const [filteredHarajat, setFilteredHarajat] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // 🔹 Boshlang‘ich yuklanish
  useEffect(() => {
    setFilteredHarajat(data);
    calculateTotal(data);
  }, [data]);

  // 🔹 To‘lov turiga ko‘ra filter
  useEffect(() => {
    if (filterType === "all") {
      setFilteredHarajat(data);
      calculateTotal(data);
    } else {
      const filteredData = data.filter(
        (item) => item.paymentType === filterType
      );
      setFilteredHarajat(filteredData);
      calculateTotal(filteredData);
    }
  }, [filterType, data]);

  // 🔹 Sanaga ko‘ra filter
  const onChange = (date, dateString) => {
    if (dateString) {
      const filteredData = data.filter(
        (item) => moment(item.createdAt).format("DD-MM-YYYY") === dateString
      );
      setFilteredHarajat(filteredData);
      calculateTotal(filteredData);
      setSelectedDate(dateString);
    } else {
      setSelectedDate("");
      setFilteredHarajat(data);
      calculateTotal(data);
    }
  };

  // 🔹 Jami hisoblash
  const calculateTotal = (list) => {
    const total = list.reduce((acc, item) => acc + (item.summ || 0), 0);
    setTotalAmount(total);
  };

  // 🔹 To‘lov turi rangli tag bilan
  const renderPaymentTag = (type) => {
    switch (type) {
      case "naqd":
        return <Tag color="green">Naqd</Tag>;
      case "plastik":
        return <Tag color="blue">Plastik</Tag>;
      case "bankshot":
        return <Tag color="purple">Xisob Raqam</Tag>;
      default:
        return <Tag color="default">Noma'lum</Tag>;
    }
  };

  // 🔹 Jadval ustunlari
  const columns = [
    {
      title: "№",
      key: "index",
      align: "center",
      render: (text, record, index) => index + 1,
      width: 60,
    },
    {
      title: "Nomi",
      dataIndex: "name",
      key: "name",
      width: 180,
    },
    {
      title: "Sababi / Izoh",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
    {
      title: "Summasi (UZS)",
      dataIndex: "summ",
      key: "summ",
      align: "right",
      render: (summ) => (summ ? summ.toLocaleString("uz-UZ") : "0"),
    },
    {
      title: "To‘lov turi",
      dataIndex: "paymentType",
      key: "paymentType",
      align: "center",
      render: (type) => renderPaymentTag(type),
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      align: "center",
      render: (date) => moment(date).format("DD-MM-YYYY HH:mm"),
      width: 160,
    },
  ];

  // 🔹 Yuklanish yoki xato holatlari
  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>❌ Harajatlarni olishda xato yuz berdi</div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1>Harajatlar</h1>
        <div
          className="page-header__actions"
          style={{ display: "flex", gap: "10px" }}
        >
          <DatePicker
            format="DD-MM-YYYY"
            onChange={onChange}
            placeholder="Sanani tanlang"
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 140 }}
          >
            <Option value="all">Hammasi</Option>
            <Option value="naqd">Naqd</Option>
            <Option value="plastik">Plastik</Option>
            <Option value="bankshot">Xisob Raqam</Option>
          </Select>
          <Button
            type="primary"
            onClick={() => navigate("create")}
            style={{
              background: "#1677ff",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaPlus /> Harajat qo‘shish
          </Button>
        </div>
      </div>

      {/* Jadval */}
      <Table
        dataSource={filteredHarajat}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        bordered
        size="middle"
      />

      {/* Jami summa */}
      <div
        style={{
          textAlign: "right",
          fontSize: "18px",
          marginTop: "16px",
          fontWeight: 600,
        }}
      >
        Jami harajat:{" "}
        <span style={{ color: "#d4380d" }}>
          {totalAmount.toLocaleString("uz-UZ")} so‘m
        </span>
      </div>
    </div>
  );
};

export default Harajat;
