import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, message, Input, Modal, Space, Tag } from "antd";
import {
  useGetSalaryQuery,
  useGetTeachersQuery,
  usePaySalaryMutation,
} from "../../context/service/oylikberish.service";
import moment from "moment";
import { Loading } from "../../components/loading/loading";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { FaDownload } from "react-icons/fa";

const { Search } = Input;

const Oylikberish = () => {
  // ======= Queries =======
  const {
    data: teachers = [],
    error: fetchError,
    isLoading: fetchLoading,
  } = useGetTeachersQuery();

  const {
    data: salaryReport = [],
    error: salaryFetchError,
    isLoading: salaryFetchLoading,
  } = useGetSalaryQuery();

  const [paySalary, { isLoading: salaryLoading }] = usePaySalaryMutation();

  // ======= State =======
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [paymentMonth, setPaymentMonth] = useState(moment().format("YYYY-MM"));
  const [amount, setAmount] = useState("");

  // ======= Helpers =======
  const formatNumber = (num) => num.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const onlyDigits = (s) => (s || "").replace(/\D/g, "");

  const handleChange = (e) => {
    setAmount(formatNumber(onlyDigits(e.target.value)));
  };

  useEffect(() => {
    setFilteredTeachers(teachers);
  }, [teachers]);

  // `exchange_classes.month` uchun ikkala formatni qo'llab-quvvatlaymiz: "YYYY-MM" ham, "MM-YYYY" ham
  const isSameMonth = (value, monthYYYYMM) => {
    if (!value) return false;
    const tryA = moment(value, "YYYY-MM", true);
    const tryB = moment(value, "MM-YYYY", true);
    const base = moment(monthYYYYMM, "YYYY-MM", true);
    if (tryA.isValid() && tryA.format("YYYY-MM") === base.format("YYYY-MM"))
      return true;
    if (tryB.isValid() && tryB.format("YYYY-MM") === base.format("YYYY-MM"))
      return true;
    return false;
  };

  // Salary-reportdan bitta o'qituvchi + oy bo'yicha hujjatni topish
  const findSalaryDoc = (teacherId, monthYYYYMM) =>
    salaryReport.find(
      (r) =>
        String(r.teacherId) === String(teacherId) &&
        r.paymentMonth === monthYYYYMM
    );

  // logs dan earned va paid ni chiqarish
  const getEarnedAndPaidFromLogs = (salaryDoc) => {
    if (!salaryDoc || !Array.isArray(salaryDoc.logs))
      return { earned: 0, paid: 0 };
    let earned = 0;
    let paid = 0;
    for (const log of salaryDoc.logs) {
      const amt = Number(log?.amount || 0);
      if (log?.reason === "davomat") earned += amt;
      else if (log?.reason === "manual") paid += amt;
    }
    return { earned, paid };
  };

  // Qo'shimcha darslar (exchange_classes) summasi
  const getExtraCharge = (teacher, monthYYYYMM) => {
    if (!teacher || !Array.isArray(teacher.exchange_classes)) return 0;
    return teacher.exchange_classes.reduce((total, ex) => {
      if (isSameMonth(ex.month, monthYYYYMM)) {
        total += Number(ex.extra_charge || 0);
      }
      return total;
    }, 0);
  };

  // Ko'rinadigan qiymatlarni chiqarish (har bir o'qituvchi, joriy oy)
  const currentMonth = useMemo(() => moment().format("YYYY-MM"), []);
  const withComputed = useMemo(() => {
    return filteredTeachers.map((t) => {
      const sd = findSalaryDoc(t._id, currentMonth);
      const { earned, paid } = getEarnedAndPaidFromLogs(sd);
      const extra = getExtraCharge(t, currentMonth);
      const total = earned + extra; // Umumiy oylik (hisoblangan)
      const remaining = total - paid; // Qoldiq (to'lanishi kerak)
      return {
        ...t,
        _earned: earned,
        _paid: paid,
        _extra: extra,
        _total: total,
        _remaining: remaining,
      };
    });
  }, [filteredTeachers, salaryReport, currentMonth]);

  // To'lov modalini ochish
  const handleOpenModal = (teacher) => {
    setSelectedTeacher(teacher);
    setPaymentMonth(currentMonth); // default hozirgi oy
    setIsModalVisible(true);
  };

  // To'lov qilish
  const handlePay = async () => {
    try {
      if (!selectedTeacher) return;
      const plainNumber = Number(onlyDigits(amount));
      if (!plainNumber || !paymentMonth) {
        message.warning("Summani va oyni tanlang");
        return;
      }

      await paySalary({
        teacherId: selectedTeacher._id,
        salaryAmount: plainNumber,
        paymentMonth: paymentMonth, // YYYY-MM
      }).unwrap();

      message.success("Oylik muvaffaqiyatli to'landi");
      setIsModalVisible(false);
      setAmount("");
    } catch (error) {
      console.error(error);
      message.error("To'lovda xato yuz berdi");
    }
  };

  // Qidiruv
  const handleSearch = (value) => {
    const v = (value || "").toLowerCase();
    const filtered = teachers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(v) ||
        t.lastName.toLowerCase().includes(v) ||
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(v)
    );
    setFilteredTeachers(filtered);
  };

  // Excel export
  const exportToExcel = () => {
    const rows = withComputed.map((t, idx) => ({
      "#": idx + 1,
      Ism: t.firstName,
      Familiya: t.lastName,
      Fan: t.science || "",
      "Dars narxi": t.price || 0,
      "Haftalik soat": t.hour || 0,
      "Qo'shimcha (exchange)": t._extra || 0,
      "Davomatdan (earned)": t._earned || 0,
      "To'langan (paid)": t._paid || 0,
      "Umumiy (earned+extra)": t._total || 0,
      "Qoldiq (to'lash kerak)": t._remaining || 0,
      Oy: currentMonth,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Oylik");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fname = `oylik_${currentMonth}.xlsx`;
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fname);
  };

  // Jadval ustunlari
  const columns = [
    {
      title: "Ism / Familiya",
      key: "fio",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>
            <b>{record.firstName}</b>
          </span>
          <span>{record.lastName}</span>
        </Space>
      ),
      fixed: "left",
    },
    {
      title: "Fan",
      dataIndex: "science",
      key: "science",
      render: (v) => v || "-",
    },
    {
      title: "Dars narxi",
      dataIndex: "price",
      key: "price",
      render: (v) => Number(v || 0).toLocaleString(),
      align: "right",
    },
    {
      title: "Haftalik soat",
      dataIndex: "hour",
      key: "hour",
      render: (v) => Number(v || 0).toLocaleString(),
      align: "right",
    },
    {
      title: "Qo'shimcha ",
      key: "_extra",
      render: (_, r) => Number(r._extra || 0).toLocaleString(),
      align: "right",
    },
    {
      title: "Jami oylik ",
      key: "_extra",
      render: (_, r) => Number(r.monthlySalary || 0).toLocaleString(),
      align: "right",
    },
    {
      title: "Davomatdan ",
      key: "_earned",
      render: (_, r) => Number(r._earned || 0).toLocaleString(),
      align: "right",
    },
    {
      title: "To'langan",
      key: "_paid",
      render: (_, r) => Number(r._paid || 0).toLocaleString(),
      align: "right",
    },

    {
      title: "Qoldiq (to'lash kerak)",
      key: "_remaining",
      render: (_, r) => (
        <Tag color={r._remaining > 0 ? "red" : "green"}>
          {Number(r._remaining || 0).toLocaleString()}
        </Tag>
      ),
      align: "right",
    },
    {
      title: "Amallar",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Button
          icon={<i className="fas fa-dollar-sign" />}
          onClick={() => handleOpenModal(record)}
          type="primary"
          // disabled={Number(record._remaining || 0) <= 0}
        >
          To'lov
        </Button>
      ),
    },
  ];

  // Chek
  const printReceipt = (paymentDetails) => {
    const printWindow = window.open("", "", "width=600,height=400");
    printWindow.document.write(`
      <div style="padding-inline: 5mm; font-family:sans-serif;padding-block: 5mm; align-items:center; display: flex; flex-direction:column; gap:5mm; width:80mm">
        <img src="/logo.png" alt="logo" id="logo" />
        <b style="font-size: 1rem; text-align:center">Oylik berilganlik xaqida kvitansiya</b>
        -------------------------------------------------------
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>O'qituvchi:</b><span>${paymentDetails.teacher}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>To'lov miqdori:</b><span>${paymentDetails.amount} UZS</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>To'lov oyi:</b><span>${paymentDetails.paymentMonth}</span>
        </div>
        <div style="width:100%; display:flex; justify-content:space-between; align-items:center">
          <b>Sana:</b><span>${paymentDetails.date}</span>
        </div>
        -------------------------------------------------------
      </div>`);
    const logo = printWindow.document.getElementById("logo");
    logo.onload = () => {
      printWindow.document.close();
      printWindow.print();
    };
  };

  // UI Loading / Error
  if (fetchLoading || salaryFetchLoading) return <Loading />;
  if (fetchError || salaryFetchError) return <div>Xatolik yuz berdi</div>;

  return (
    <div className="page">
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>Oylik Beruvchi Sahifa</h2>
        <Space>
          <input
            type="month"
            value={paymentMonth || currentMonth}
            onChange={(e) => setPaymentMonth(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
            }}
          />
          <Button icon={<FaDownload />} onClick={exportToExcel}>
            Excel yuklab olish
          </Button>
        </Space>
      </Space>

      <Search
        placeholder="Ism yoki familiya bo'yicha qidiruv"
        onSearch={handleSearch}
        enterButton
        style={{ marginBottom: 20, maxWidth: 360 }}
      />

      <Table
        dataSource={withComputed}
        columns={columns}
        rowKey="_id"
        loading={fetchLoading || salaryLoading}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="To'lov qilish"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Bekor qilish
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={async () => {
              await handlePay();
              // Chek
              if (selectedTeacher) {
                printReceipt({
                  teacher: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
                  amount: Number(onlyDigits(amount) || 0).toLocaleString(),
                  paymentMonth: paymentMonth || currentMonth,
                  date: moment().format("DD-MM-YYYY HH:mm"),
                });
              }
            }}
            loading={salaryLoading}
          >
            To'lovni amalga oshirish
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="To'lov summasi"
            value={amount}
            onChange={handleChange}
          />
          <input
            type="month"
            value={paymentMonth || currentMonth}
            onChange={(e) => setPaymentMonth(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
            }}
            placeholder="Oyni tanlang"
          />
        </Space>
      </Modal>
    </div>
  );
};

export default Oylikberish;
