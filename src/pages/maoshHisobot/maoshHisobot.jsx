import React, { useEffect, useMemo, useState } from "react";
import "../payment/payment.css";
import { Table } from "../../components/table/table";
import moment from "moment";
import {
  Button,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Pagination,
} from "antd";
import {
  useGetSalaryQuery,
  useUpdateSalaryMutation,
} from "../../context/service/oylikberish.service";
import { MdEdit } from "react-icons/md";
import { FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Search } = Input;
const { Option } = Select;

export const MaoshHisobot = () => {
  const { data: salaryDocs = [] } = useGetSalaryQuery();
  const [updateSalary, { isLoading }] = useUpdateSalaryMutation();

  // Filtrlar
  const [searchValue, setSearchValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MM"));
  const [selectedDate, setSelectedDate] = useState(null);

  // Edit modal (oy bo‘yicha Salary hujjati)
  const [isVisible, setIsVisible] = useState(false);
  const [editingSalaryDoc, setEditingSalaryDoc] = useState(null);
  const [paymentMonth, setPaymentMonth] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");

  // To‘lovlar modal (har bir payment detali)
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [paymentsModalTitle, setPaymentsModalTitle] = useState("");
  const [paymentsList, setPaymentsList] = useState([]); // {amount, date}
  const [paymentsPage, setPaymentsPage] = useState(1);
  const paymentsPageSize = 5;

  // 1) Salary hujjatlaridan manual loglar ro‘yxati
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
            teacher_fullname: doc.teacher_fullname,
            teacherId: String(doc.teacherId),
            amount: Number(log.amount || 0),
            paymentMonth: doc.paymentMonth, // "YYYY-MM"
            date: log.date, // ISO
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          });
        }
      }
    }
    return rows;
  }, [salaryDocs]);

  // 2) Filtrlash (ism, oy, sana) — log.date bo‘yicha
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

  // 3) ASOSIY JADVAL: o‘qituvchi + oy bo‘yicha jamlash
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
      });
      map.set(key, curr);
    });
    const rows = Array.from(map.values())
      .map((g) => ({
        ...g,
        payments: g.payments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
      .sort((a, b) => a.teacher_fullname.localeCompare(b.teacher_fullname));

    const grand = rows.reduce((s, x) => s + x.total, 0);
    return { rows, grand };
  }, [filteredPayments]);

  // 4) Edit (jamlangan qator bo‘yicha Salary hujjati)
  const openEditModalGroup = (groupRow) => {
    const doc = salaryDocs.find(
      (d) =>
        String(d.teacherId) === String(groupRow.teacherId) &&
        d.paymentMonth === groupRow.paymentMonth
    );
    if (!doc) {
      message.warning("Bu o‘qituvchi-oy bo‘yicha Salary hujjati topilmadi.");
      return;
    }
    setEditingSalaryDoc(doc);
    setPaymentMonth(doc.paymentMonth);
    setSalaryAmount(String(doc.salaryAmount || 0));
    setIsVisible(true);
  };

  const saveEdit = async () => {
    if (!editingSalaryDoc) return;
    try {
      await updateSalary({
        salary_id: editingSalaryDoc._id,
        salaryAmount: Number(salaryAmount),
        paymentMonth: paymentMonth, // "YYYY-MM"
      }).unwrap();
      message.success("Maosh hujjati yangilandi");
    } catch {
      message.error("Xatolik yuz berdi");
    } finally {
      setIsVisible(false);
      setEditingSalaryDoc(null);
      setPaymentMonth("");
      setSalaryAmount("");
    }
  };

  // 5) To‘lovlar modalini ochish (bekzod — 30k, 50k ... sana bilan)
  const openPaymentsModal = (groupRow) => {
    const title = `${groupRow.teacher_fullname} — ${moment(
      groupRow.paymentMonth,
      "YYYY-MM"
    ).format("MMMM YYYY")}`;
    setPaymentsModalTitle(title);
    setPaymentsList(groupRow.payments); // all payments (sorted desc)
    setPaymentsPage(1);
    setIsPaymentsOpen(true);
  };

  // 6) Excel eksport (vedomost + jamlangan)
  const exportToExcel = () => {
    const monthTitle = grouped.rows[0]
      ? moment(grouped.rows[0].paymentMonth, "YYYY-MM").format("MMMM YYYY")
      : filteredPayments[0]
      ? moment(filteredPayments[0].paymentMonth, "YYYY-MM").format("MMMM YYYY")
      : moment().format("MMMM YYYY");

    // Sheet 1: Vedomost
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
      0
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

    // Sheet 2: Jamlangan
    const aoa2 = [];
    aoa2.push([`Jamlangan — ${monthTitle}`]);
    aoa2.push([]);
    aoa2.push([
      "№",
      "O'qituvchi",
      "To'lovlar soni",
      "Jami to'lov (UZS)",
      "Oy",
    ]);
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
              `${moment(p.date).format(
                "DD.MM.YYYY HH:mm"
              )}: ${p.amount.toLocaleString()} UZS`
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
    const fname = `Oylik_vedomoti_${moment().format("YYYY-MM-DD_HH-mm")}.xlsx`;
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fname);
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

  return (
    <div className="page">
      {/* Hujjat tahrirlash modali */}
      <Modal
        open={isVisible}
        title="Maosh hujjatini tahrirlash (oy yig'indisi)"
        onCancel={() => {
          setIsVisible(false);
          setEditingSalaryDoc(null);
          setPaymentMonth("");
          setSalaryAmount("");
        }}
        footer={[
          <Button
            key="save"
            type="primary"
            loading={isLoading}
            onClick={saveEdit}
          >
            Saqlash
          </Button>,
        ]}
      >
        <Input
          placeholder="Hujjatning umumiy salaryAmount qiymati"
          value={salaryAmount}
          onChange={(e) => setSalaryAmount(e.target.value)}
        />
        <DatePicker
          value={paymentMonth ? moment(paymentMonth, "YYYY-MM") : null}
          onChange={(date) =>
            setPaymentMonth(date ? date.format("YYYY-MM") : "")
          }
          format="YYYY-MM"
          picker="month"
          style={{ width: "100%", marginTop: 12 }}
          placeholder="Oyni tanlang"
        />
      </Modal>

      {/* To‘lovlar (detal) modali */}
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
        width={420}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "right", padding: 6 }}>Summa</th>
              <th style={{ textAlign: "right", padding: 6 }}>Sana</th>
            </tr>
          </thead>
          <tbody>
            {paymentsList
              .slice(
                (paymentsPage - 1) * paymentsPageSize,
                paymentsPage * paymentsPageSize
              )
              .map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {p.amount.toLocaleString()} UZS
                  </td>
                  <td style={{ textAlign: "right", padding: 6 }}>
                    {moment(p.date).format("YYYY-MM-DD HH:mm")}
                  </td>
                </tr>
              ))}
            {paymentsList.length === 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: "center", padding: 12 }}>
                  To‘lov topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Modal>

      {/* Filtrlar + eksport */}
      <div className="page-header">
        <h1>Berilgan maoshlar — jamlangan ko‘rinish</h1>
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
          <DatePicker
            onChange={(d, ds) => setSelectedDate(ds)}
            format="DD.MM.YYYY"
            style={{ marginRight: 10 }}
            placeholder="Sana"
          />
          <Button onClick={exportToExcel} type="primary" icon={<FaDownload />}>
            Excelga yuklab olish
          </Button>
        </div>
      </div>

      {/* PASTDAGI JADVAL — JAMLANGAN */}
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
                  <Button
                    style={{ marginRight: 8, width:"120px" }}
                    onClick={() => openPaymentsModal(g)}
                  >
                    Tarix
                  </Button>
             
                </td>
              </tr>
            ))}
            {grouped.rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                  Ma’lumot topilmadi
                </td>
              </tr>
            )}
          
          </tbody>
        </Table>
      </div>
    </div>
  );
};
