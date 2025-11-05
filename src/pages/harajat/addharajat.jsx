import React, { useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAddHarajatMutation } from "../../context/service/harajat.service";
import { Button, Select, message } from "antd";

const { Option } = Select;

const AddHarajat = () => {
  const navigate = useNavigate();
  const [addHarajat, { isLoading, isError, error }] = useAddHarajatMutation();

  // 🔹 Form state
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [summ, setSumm] = useState("");
  const [paymentType, setPaymentType] = useState("naqd");

  // 🔹 Summani formatlash (masalan: 200000 -> 200 000)
  const handleSummChange = (e) => {
    const rawValue = e.target.value.replace(/\s/g, "");
    if (!isNaN(rawValue)) {
      const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      setSumm(formattedValue);
    }
  };

  // 🔹 Formani yuborish
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !comment || !summ) {
      message.warning("Iltimos, barcha kerakli maydonlarni to‘ldiring!");
      return;
    }

    const body = {
      name,
      comment,
      summ: Number(summ.replace(/\s/g, "")),
      paymentType,
    };

    try {
      await addHarajat(body).unwrap();
      message.success("✅ Harajat muvaffaqiyatli qo‘shildi!");
      navigate("/harajat");
    } catch (err) {
      console.error("Xatolik:", err);
      message.error("Xatolik yuz berdi, qaytadan urinib ko‘ring!");
    }
  };

  const errorMessage = error?.data?.message || "Noma’lum xatolik yuz berdi.";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1>Yangi harajat qo‘shish</h1>
        <Button type="primary" onClick={() => navigate("/harajat")}>
          <FaChevronLeft />
        </Button>
      </div>

      {/* Form */}
      <form className="form_body" onSubmit={handleSubmit}>
        {/* Nomi */}
        <label htmlFor="name">
          <p>Harajat nomi</p>
          <input
            type="text"
            id="name"
            placeholder="Masalan: Maktab ta'miri"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {/* Sabab */}
        <label htmlFor="comment">
          <p>Sabab / Izoh</p>
          <input
            type="text"
            id="comment"
            placeholder="Masalan: Sinf derazalari uchun"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>

        {/* Summasi */}
        <label htmlFor="summ">
          <p>Harajat summasi</p>
          <input
            type="text"
            id="summ"
            value={summ}
            onChange={handleSummChange}
            placeholder="Masalan: 200 000"
          />
        </label>

        {/* To‘lov turi */}
        <label htmlFor="paymentType">
          <p>To‘lov turi</p>
          <Select
            id="paymentType"
            value={paymentType}
            onChange={(value) => setPaymentType(value)}
            style={{ width: "100%" }}
          >
            <Option value="naqd">Naqd</Option>
            <Option value="plastik">Plastik</Option>
            <Option value="bankshot">Xisob Raqam</Option>
          </Select>
        </label>

        {/* Yuborish tugmasi */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: "20px",
            background: "#1677ff",
            color: "white",
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isLoading ? "Yuklanmoqda..." : "Qo‘shish"}
        </button>

        {/* Xatolik xabari */}
        {isError && <p className="error">❌ Xatolik: {errorMessage}</p>}
      </form>
    </div>
  );
};

export default AddHarajat;
