import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Select,
  DatePicker,
  Tag,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
} from "antd";
import { FaPlus } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  useGetHarajatQuery,
  useUpdateHarajatMutation,
} from "../../context/service/harajat.service";
import moment from "moment";
import { Loading } from "../../components/loading/loading";

const { Option } = Select;

const Harajat = () => {
  const navigate = useNavigate();

  const {
    data = [],
    error: fetchError,
    isLoading: fetchLoading,
  } = useGetHarajatQuery();
  const [updateHarajat, { isLoading: updateLoading }] =
    useUpdateHarajatMutation();

  const [filteredHarajat, setFilteredHarajat] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM"),
  ); // ✅ joriy oy

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  // ✅ Oy yoki to'lov turi o'zgarganda filter
  useEffect(() => {
    let filtered = data.filter(
      (item) => moment(item.createdAt).format("YYYY-MM") === selectedMonth,
    );
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.paymentType === filterType);
    }
    setFilteredHarajat(filtered);
    calculateTotal(filtered);
  }, [data, selectedMonth, filterType]);

  const calculateTotal = (list) => {
    const total = list.reduce((acc, item) => acc + (item.summ || 0), 0);
    setTotalAmount(total);
  };

  // Edit modal ochish
  const openEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      comment: record.comment,
      summ: record.summ,
      paymentType: record.paymentType,
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      const values = await form.validateFields();
      await updateHarajat({ id: editingItem._id, ...values }).unwrap();
      message.success("Harajat muvaffaqiyatli yangilandi");
      setIsEditOpen(false);
      setEditingItem(null);
      form.resetFields();
    } catch {
      message.error("Xatolik yuz berdi");
    }
  };

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

  const columns = [
    {
      title: "№",
      key: "index",
      align: "center",
      render: (_, __, index) => index + 1,
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
      title: "To'lov turi",
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
    {
      title: "Amal",
      key: "actions",
      align: "center",
      width: 80,
      render: (_, record) => (
        <Button
          icon={<MdEdit />}
          size="small"
          onClick={() => openEdit(record)}
        />
      ),
    },
  ];

  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>❌ Harajatlarni olishda xato yuz berdi</div>;

  return (
    <div className="page">
      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        title="Harajatni tahrirlash"
        onCancel={() => {
          setIsEditOpen(false);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsEditOpen(false);
              form.resetFields();
            }}
          >
            Bekor qilish
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={updateLoading}
            onClick={saveEdit}
          >
            Saqlash
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nomi"
            rules={[{ required: true, message: "Nomini kiriting" }]}
          >
            <Input placeholder="Harajat nomi" />
          </Form.Item>
          <Form.Item name="comment" label="Sababi / Izoh">
            <Input.TextArea placeholder="Izoh" rows={3} />
          </Form.Item>
          <Form.Item
            name="summ"
            label="Summasi (UZS)"
            rules={[{ required: true, message: "Summani kiriting" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
              parser={(v) => v.replace(/\s/g, "")}
              placeholder="Summa"
            />
          </Form.Item>
          <Form.Item
            name="paymentType"
            label="To'lov turi"
            rules={[{ required: true, message: "Turini tanlang" }]}
          >
            <Select placeholder="To'lov turini tanlang">
              <Option value="naqd">Naqd</Option>
              <Option value="plastik">Plastik</Option>
              <Option value="bankshot">Xisob Raqam</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Header */}
      <div className="page-header">
        <h1>Harajatlar</h1>
        <div
          className="page-header__actions"
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          {/* ✅ Oy tanlash */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          />

          {/* To'lov turi filter */}
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
            <FaPlus /> Harajat qo'shish
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredHarajat}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        bordered
        size="middle"
      />

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
          {totalAmount.toLocaleString("uz-UZ")} so'm
        </span>
      </div>
    </div>
  );
};

export default Harajat;
