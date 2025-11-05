import React, { useState } from "react";
import { useDeletePaymentMutation, useEditPaymentMutation, useGetPaymentLogQuery } from "../../context/service/payment.service";
import moment from "moment";
import { useGetClassQuery } from "../../context/service/class.service";
import { Button, DatePicker, message, Modal, Select, Table } from "antd";
import { FaChevronLeft, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdEdit, MdDeleteForever } from "react-icons/md";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
const { Option } = Select;


const PaymentLog = () => {
  const { data: payments = [] } = useGetPaymentLogQuery();
  const { data: schoolData = {} } = useGetSchoolQuery();
  const [deletePayment] = useDeletePaymentMutation()
  const [editPayment] = useEditPaymentMutation()
  const { data: groups = [] } = useGetClassQuery();
  const navigate = useNavigate();
  const [editingPayment, setEditingPayment] = useState("")
  const { register, handleSubmit, reset, getValues } = useForm();
  const [editModal, setEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [selectedClass, setSelectedClass] = useState("");
  const filteredPayments = payments.filter((payment) => {
    const paymentDate = moment(payment.createdAt).format("YYYY-MM-DD");
    const paymentGroup = payment.user_group;

    return (
      (selectedDate ? paymentDate === selectedDate : true) &&
      (selectedClass ? paymentGroup === selectedClass : true)
    );
  });
  async function handleDeletePayment(id) {
    const password = prompt("Parolni kiriting");
    if (!password) {
      message.warning("Parolni kiritish shart!");
      return;
    }

    try {
      await deletePayment({ id, password }).unwrap();
      message.success("To'lov o'chirildi!");
    } catch (error) {
      message.error("Parol xato yoki boshqa xatolik yuz berdi!");
    }
  }

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
    "10": "Oktyabr",
    "11": "Noyabr",
    "12": "Dekabr"
  };

  function downloadExcel() {
    const titleRow = [
      "F.I.SH",
      "To'lov summasi",
      "To'lov oyi",
      "To'lov sanasi",
    ];
    const data = filteredPayments
    const worksheetData = data.map((item) => [
      item.user_fullname,
      item.payment_quantity,
      months[moment(item.payment_month, "MM-YYYY").format("MM")],
      moment(item.createdAt).format("DD.MM.YYYY HH:mm")
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([titleRow, ...worksheetData]);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "To'lovlar");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, `to'lovlar.xlsx`);
  }

  async function handleEditPayment(data) {
    try {
      await editPayment({ body: data, id: editingPayment }).unwrap();
      setEditModal(false);
      message.success("To'lov tahrirlandi!");
    } catch (error) {
      message.error("Parol xato yoki boshqa xatolik yuz berdi!");
    }
  }
  const columns = [
    {
      title: "F.I.Sh",
      dataIndex: "user_fullname",
      key: "user_fullname",
    },
    {
      title: "Sinf",
      dataIndex: "user_group",
      key: "user_group",
      render: (text) => {
        const group = groups.find((group) => group._id === text);
        if (!group) return text;
        return text.length > 20 ? group.name : text;
      },
    },
    {
      title: "To'lov miqdori",
      dataIndex: "payment_quantity",
      key: "payment_quantity",
      render: (text) => `${text.toLocaleString()}`,
    },
    {
      title: "To'lov turi",
      dataIndex: "payment_type",
      key: "payment_type",
      render: (text) => {
        if (text === "card") {
          return "Karta";
        } else if (text === "cash") {
          return "Naqd";
        }
        return text;
      },
    },
    {
      title: "To'lov oyi",
      dataIndex: "payment_month"
    },
    {
      title: "Sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => moment(text).format("YYYY-MM-DD"),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (text, record) => (
        <div className="actions">
          <Button
            onClick={() => {
              setEditingPayment(record._id);
              setEditModal(true);
              reset({
                payment_quantity: record.payment_quantity,
                payment_type: record.payment_type,
              });
            }}
            type="primary"
          >
            <MdEdit />
          </Button>
          <Button
            onClick={() => {
              handleDeletePayment(record._id);
            }}
            style={{ marginLeft: "6px" }}
            type="primary"
          >
            <MdDeleteForever />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="page">
      <Modal open={editModal} title="To'lovni tahrirlash" footer={[]} onCancel={() => { setEditingPayment(""); setEditModal(false) }}>
        <form onSubmit={handleSubmit(handleEditPayment)} className="modal_form">
          <label htmlFor="payment_month">To'lov oyi</label>
          <DatePicker
            onChange={(date, dateString) => reset({ ...getValues(), payment_month: dateString })}
            format="MM-YYYY"
            picker="month"
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="Oyni tanlang"
            defaultValue={
              editingPayment
                ? dayjs(payments.find(pt => pt._id === editingPayment)?.payment_month, "MM-YYYY")
                : null
            }
          />
          <label htmlFor="payment_quantity">To'lov summasi</label>
          <input type="number" {...register("payment_quantity")} />
          <label htmlFor="payment_type">To'lov usuli</label>
          <select {...register("payment_type")}>
            <option value="card">Karta</option>
            <option value="cash">Naqd</option>
          </select>
          <input type="password" {...register("password")} placeholder="Parolni kiriting" />
          <button>Tahrirlash</button>
        </form>
      </Modal>
      <div className="page-header">
        <h1>To'lov jurnali</h1>

        <div
          className="header_actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <DatePicker
            onChange={(date, dateString) => setSelectedDate(dateString)}
            placeholder="Sana"
            defaultValue={selectedDate ? dayjs(selectedDate, "YYYY-MM-DD") : null}
            format="YYYY-MM-DD"
          />

          <Select
            onChange={(value) => setSelectedClass(value)}
            style={{ width: 150 }}
            placeholder="Sinf"
          >
            <Option value="">Barcha sinf</Option>
            {groups.map((group) => (
              <Option key={group._id} value={group._id}>
                {group.name}
              </Option>
            ))}
          </Select>
          <Button onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </Button>
          <Button icon={<FaDownload />} onClick={downloadExcel} type="primary">Excel yuklash</Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPayments}
        rowKey="_id"
        pagination={10}
      />
    </div>
  );
};

export default PaymentLog;
