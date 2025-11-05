import React, { useState } from "react";
import {
  Table,
  Button,
  Switch,
  message,
  Space,
  Modal,
  Form,
  Input,
} from "antd";
import {
  useAddSubjectMutation,
  useGetSubjectsQuery,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} from "../../context/service/fan.service";

export default function Fan() {
  const { data: subjects = [], isLoading, refetch } = useGetSubjectsQuery();
  const [addSubject] = useAddSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const schoolId = localStorage.getItem("school_id");

  // 🔹 Modalni ochish
  const showModal = () => {
    setIsModalOpen(true);
  };

  // 🔹 Modalni yopish
  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  // 🔹 Yangi fan qo‘shish
  const handleAdd = async (values) => {
    try {
      await addSubject({ ...values, schoolId }).unwrap();
      message.success("Fan muvaffaqiyatli qo‘shildi");
      form.resetFields();
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Xatolik yuz berdi");
    }
  };

  // 🔹 Fan statusini o‘zgartirish
  const handleToggle = async (record) => {
    try {
      await updateSubject({
        id: record._id,
        body: { isActive: !record.isActive },
      }).unwrap();
      message.success("Fan holati o‘zgartirildi");
      refetch();
    } catch (err) {
      message.error("Xatolik: holat o‘zgartirilmadi");
    }
  };

  // 🔹 Fan o‘chirish (tasdiq bilan)
  const confirmDelete = (id) => {
    Modal.confirm({
      title: "Tasdiqlash",
      content: "Rosdan ham ushbu fanni o‘chirmoqchimisiz?",
      okText: "Ha, o‘chirish",
      okType: "danger",
      cancelText: "Bekor qilish",
      onOk: async () => {
        try {
          await deleteSubject(id).unwrap();
          message.success("Fan o‘chirildi");
          refetch();
        } catch (err) {
          message.error("Xatolik: fan o‘chmadi");
        }
      },
    });
  };

  const columns = [
    {
      title: "Fan nomi",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Holat",
      dataIndex: "isActive",
      key: "isActive",
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggle(record)}
        />
      ),
    },
    {
      title: "Amallar",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button danger onClick={() => confirmDelete(record._id)}>
            O‘chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        padding: "24px",
        minHeight: "100vh",
        background: "#f5f6fa",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Fanlar boshqaruvi</h2>
        <Button type="primary" onClick={showModal}>
          Yangi fan qo‘shish
        </Button>
      </div>

      {/* 🔹 Fanlar jadvali */}
      <Table
        columns={columns}
        dataSource={subjects}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
        bordered
        size="middle" // 🔹 kichikroq jadval
        style={{ fontSize: "14px" }} // 🔹 font ham kichikroq
      />

      {/* 🔹 Qo‘shish Modal */}
      <Modal
        title="Yangi fan qo‘shish"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="name"
            label="Fan nomi"
            rules={[{ required: true, message: "Fan nomini kiriting" }]}
          >
            <Input placeholder="Masalan: Fizika" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Qo‘shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
