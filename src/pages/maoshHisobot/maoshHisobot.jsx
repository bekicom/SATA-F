import React, { useMemo, useState } from "react";
import "../payment/payment.css";
import { Table } from "../../components/table/table";
import moment from "moment";
import {
  Button,
  Input,
  Select,
  Modal,
  message,
  Pagination,
  InputNumber,
} from "antd";
import {
  useGetSalaryQuery,
  useUpdateSalaryLogMutation, // 🆕 log edit uchun
} from "../../context/service/oylikberish.service";
import { MdEdit } from "react-icons/md";
import { FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Search } = Input;
const { Option } = Select;

export const MaoshHisobot = () => {
  const { data: salaryDocs = [] } = useGetSalaryQuery();
  const [updateSalaryLog, { isLoading: logUpdating }] =
    useUpdateSalaryLogMutation();

  // Filtrlar
  const [searchValue, setSearchValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MM"));
  const [selectedDate, setSelectedDate] = useState("");

  // To'lovlar modali
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [paymentsModalTitle, setPaymentsModalTitle] = useState("");
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentsPageSize = 5;

  // 🆕 Log edit modali
  const [isEditLogOpen, setIsEditLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null); // { docId, logIndex, amount, date, teacherName }
  const [editAmount, setEditAmount] = useState(0);

  // 1) Manual loglar
  const manualRows = useMemo(() => {
    const rows = [];

    for (const doc of salaryDocs) {
      const logs = Array.isArray(doc.logs) ? doc.logs : [];
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log?.reason === "manual") {
          rows.push({
            _rowId: `${doc._id}_${i}`,
            docId: doc._id,
            logIndex: i, // 🆕 log indexi (backendga yuborish uchun)
            logId: log._id, // ✅ shu qatorni qo'sh
            teacher_fullname: doc.teacher_fullname,
            teacherId: String(doc.teacherId),
            amount: Number(log.amount || 0),
            paymentMonth: doc.paymentMonth,
            date: log.date,
            paymentType: log.paymentType || "",
          });
        }
      }
    }
    return rows;
  }, [salaryDocs]);

  // 2) Filtrlash
  const filteredPayments = useMemo(() => {
    const s = (searchValue || "").toLowerCase();
    return manualRows.filter((r) => {
      const matchesSearch = (r.teacher_fullname || "")
        .toLowerCase()
        .includes(s);
      const logMonth = moment(r.date).format("MM");
      const matchesMonth = logMonth === selectedMonth;
      const matchesDate = selectedDate
        ? moment(r.date).format("DD.MM.YYYY") === selectedDate
        : true;
      return matchesSearch && matchesMonth && matchesDate;
    });
  }, [manualRows, searchValue, selectedMonth, selectedDate]);

  // 3) Jamlash
  const grouped = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((r) => {
      const key = `${r.teacherId}|${r.paymentMonth}`;
      const curr = map.get(key) || {
        teacherId: r.teacherId,
        teacher_fullname: r.teacher_fullname,
        paymentMonth: r.paymentMonth,
        count: 0,
        total: 0,
        payments: [],
      };
      curr.count += 1;
      curr.total += Number(r.amount || 0);
      curr.payments.push({
        amount: Number(r.amount || 0),
        date: r.date,
        docId: r.docId,
        logIndex: r.logIndex,
        logId: r.logId, // ✅ shu qatorni qo'sh
        paymentType: r.paymentType,
        teacher_fullname: r.teacher_fullname,
      });
      map.set(key, curr);
    });

    const rows = Array.from(map.values())
      .map((g) => ({
        ...g,
        payments: g.payments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      }))
      .sort((a, b) => a.teacher_fullname.localeCompare(b.teacher_fullname));

    const grand = rows.reduce((s, x) => s + x.total, 0);
    return { rows, grand };
  }, [filteredPayments]);

  // 4) To'lovlar modalini ochish
  const openPaymentsModal = (groupRow) => {
    const title = `${groupRow.teacher_fullname} — ${moment(
      groupRow.paymentMonth,
      "YYYY-MM",
    ).format("MMMM YYYY")}`;
    setPaymentsModalTitle(title);
    setPaymentsList(groupRow.payments);
    setPaymentsPage(1);
    setIsPaymentsOpen(true);
  };

  // 🆕 5) Log edit modalini ochish
  const openEditLog = (payment) => {
    setEditingLog(payment);
    setEditAmount(payment.amount);
    setIsEditLogOpen(true);
  };

  // 🆕 6) Log saqlash
  const saveLogEdit = async () => {
    if (!editingLog) return;
    try {
      await updateSalaryLog({
        salaryId: editingLog.docId,
        logIndex: editingLog.logIndex, // ✅ logId → logIndex
        newAmount: editAmount,
      }).unwrap();
      message.success("To'lov summasi yangilandi");
      setIsEditLogOpen(false);
      setEditingLog(null);
      // To'lovlar ro'yxatini yangilash uchun modalni yopamiz
      setIsPaymentsOpen(false);
    } catch {
      message.error("Xatolik yuz berdi");
    }
  };

  // 7) Excel eksport
  const exportToExcel = () => {
    const monthTitle = grouped.rows[0]
      ? moment(grouped.rows[0].paymentMonth, "YYYY-MM").format("MMMM YYYY")
      : moment().format("MMMM YYYY");

    const aoa1 = [];
    aoa1.push([`Oylik vedomosi — ${monthTitle}`]);
    aoa1.push([`Sana: ${moment().format("DD.MM.YYYY")}`]);
    aoa1.push([]);
    aoa1.push([
      "№",
      "O'qituvchi",
      "To'lov summasi (UZS)",
      "To'lov oyi",
      "To'lov sanasi",
      "Imzo",
    ]);
    filteredPayments.forEach((r, idx) => {
      aoa1.push([
        idx + 1,
        r.teacher_fullname,
        Number(r.amount || 0),
        moment(r.paymentMonth, "YYYY-MM").format("MMMM YYYY"),
        moment(r.date).format("DD.MM.YYYY HH:mm"),
        "",
      ]);
    });
    const total1 = filteredPayments.reduce(
      (s, r) => s + Number(r.amount || 0),
      0,
    );
    aoa1.push([]);
    aoa1.push(["Jami:", "", total1, "", "", ""]);
    aoa1.push([]);
    aoa1.push(["", "Qabul qildi (o'qituvchi):", "", "", "", "______________"]);
    aoa1.push(["", "Bosh hisobchi:", "", "", "", "______________"]);
    aoa1.push(["", "Direktor:", "", "", "", "______________"]);

    const ws1 = XLSX.utils.aoa_to_sheet(aoa1);
    ws1["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
    ];
    ws1["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    const aoa2 = [];
    aoa2.push([`Jamlangan — ${monthTitle}`]);
    aoa2.push([]);
    aoa2.push(["№", "O'qituvchi", "To'lovlar soni", "Jami to'lov (UZS)", "Oy"]);
    grouped.rows.forEach((g, idx) => {
      aoa2.push([
        idx + 1,
        g.teacher_fullname,
        g.count,
        Number(g.total || 0),
        moment(g.paymentMonth, "YYYY-MM").format("MMMM YYYY"),
        g.payments
          .map(
            (p) =>
              `${moment(p.date).format("DD.MM.YYYY HH:mm")}: ${p.amount.toLocaleString()} UZS`,
          )
          .join("; "),
      ]);
    });
    aoa2.push([]);
    aoa2.push(["Umumiy jami:", "", "", grouped.grand, "", ""]);

    const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
    ws2["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 50 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Vedomost");
    XLSX.utils.book_append_sheet(wb, ws2, "Jamlangan");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `Oylik_vedomoti_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`,
    );
  };

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

  const paymentTypeLabel = (type) =>
    type === "naqd"
      ? "💵 Naqd"
      : type === "karta"
        ? "💳 Karta"
        : type === "bank"
          ? "🏦 Bank"
          : "—";

  return (
    <div className="page">
      {/* 🆕 Log Edit Modali */}
      <Modal
        open={isEditLogOpen}
        title="To'lov summasini tahrirlash"
        onCancel={() => {
          setIsEditLogOpen(false);
          setEditingLog(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsEditLogOpen(false);
              setEditingLog(null);
            }}
          >
            Bekor qilish
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={logUpdating}
            onClick={saveLogEdit}
          >
            Saqlash
          </Button>,
        ]}
      >
        {editingLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}
            >
              <div>
                <b>O'qituvchi:</b> {editingLog.teacher_fullname}
              </div>
              <div>
                <b>Sana:</b>{" "}
                {moment(editingLog.date).format("DD.MM.YYYY HH:mm")}
              </div>
              <div>
                <b>To'lov turi:</b> {paymentTypeLabel(editingLog.paymentType)}
              </div>
            </div>
            <div>
              <label
                style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
              >
                Yangi summa (UZS)
              </label>
              <InputNumber
                style={{ width: "100%" }}
                size="large"
                min={0}
                value={editAmount}
                onChange={(val) => setEditAmount(val)}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                parser={(v) => v.replace(/\s/g, "")}
                prefix="UZS"
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#888",
                fontSize: 13,
              }}
            >
              <span>
                Eski summa: <b>{editingLog.amount.toLocaleString()} UZS</b>
              </span>
              <span>
                Yangi summa:{" "}
                <b style={{ color: "#1890ff" }}>
                  {(editAmount || 0).toLocaleString()} UZS
                </b>
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* To'lovlar (detal) modali */}
      <Modal
        open={isPaymentsOpen}
        title={paymentsModalTitle}
        onCancel={() => setIsPaymentsOpen(false)}
        footer={[
          <Pagination
            key="p"
            current={paymentsPage}
            pageSize={paymentsPageSize}
            total={paymentsList.length}
            onChange={(p) => setPaymentsPage(p)}
            style={{ textAlign: "right", width: "100%" }}
            size="small"
          />,
        ]}
        width={500}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 6px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                Sana
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                Tur
              </th>
              <th
                style={{
                  textAlign: "right",
                  padding: "8px 6px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                Summa
              </th>
              <th
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {/* 🆕 Edit ustuni */}
                Amal
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentsList
              .slice(
                (paymentsPage - 1) * paymentsPageSize,
                paymentsPage * paymentsPageSize,
              )
              .map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 6px" }}>
                    {moment(p.date).format("DD.MM.YYYY HH:mm")}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px 6px" }}>
                    {paymentTypeLabel(p.paymentType)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "8px 6px",
                      fontWeight: 500,
                    }}
                  >
                    {p.amount.toLocaleString()} UZS
                  </td>
                  <td style={{ textAlign: "center", padding: "8px 6px" }}>
                    {/* 🆕 Edit tugmasi */}
                    <Button
                      size="small"
                      icon={<MdEdit />}
                      onClick={() => openEditLog(p)}
                      title="Summani tahrirlash"
                    />
                  </td>
                </tr>
              ))}
            {paymentsList.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", padding: 12, color: "#999" }}
                >
                  To'lov topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Modal>

      {/* Filtrlar + eksport */}
      <div className="page-header">
        <h1>Berilgan maoshlar — jamlangan ko'rinish</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => setSearchValue(e.target.value)}
            enterButton
            style={{ width: 300, marginRight: 10 }}
          />
          <Select
            value={selectedMonth}
            style={{ width: 120, marginRight: 10 }}
            onChange={setSelectedMonth}
          >
            {months.map((m) => (
              <Option key={m.key} value={m.key}>
                {m.name}
              </Option>
            ))}
          </Select>
          <input
            type="date"
            value={
              selectedDate
                ? moment(selectedDate, "DD.MM.YYYY").format("YYYY-MM-DD")
                : ""
            }
            onChange={(e) => {
              setSelectedDate(
                e.target.value
                  ? moment(e.target.value).format("DD.MM.YYYY")
                  : "",
              );
            }}
            style={{
              marginRight: 10,
              padding: "8px",
              border: "1px solid #d9d9d9",
              borderRadius: "4px",
            }}
          />
          <Button onClick={exportToExcel} type="primary" icon={<FaDownload />}>
            Excelga yuklab olish
          </Button>
        </div>
      </div>

      {/* Jadval */}
      <div id="printableArea">
        <Table>
          <thead>
            <tr>
              <th>№</th>
              <th>O'qituvchi</th>
              <th>To'lovlar soni</th>
              <th>Jami to'lov</th>
              <th>Oy</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {grouped.rows.map((g, idx) => (
              <tr key={`${g.teacherId}-${g.paymentMonth}`}>
                <td>{idx + 1}</td>
                <td>{g.teacher_fullname}</td>
                <td style={{ textAlign: "center" }}>{g.count}</td>
                <td style={{ textAlign: "right" }}>
                  {g.total.toLocaleString()} UZS
                </td>
                <td>{moment(g.paymentMonth, "YYYY-MM").format("MMMM YYYY")}</td>
                <td>
                  {/* Tarix tugmasi — ichida har bir to'lovni edit qilish imkoniyati bor */}
                  <Button
                    style={{ width: "120px" }}
                    onClick={() => openPaymentsModal(g)}
                  >
                    Tarix / Edit
                  </Button>
                </td>
              </tr>
            ))}
            {grouped.rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  Ma'lumot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
