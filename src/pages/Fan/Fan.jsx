import React, { useEffect, useState } from "react";
import { Table, Button, Switch, message, Modal, Form, Input } from "antd";

import {
  useAddSubjectMutation,
  useGetSubjectsQuery,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useSetQuartersMutation,
  useGetQuartersBySchoolQuery,
} from "../../context/service/fan.service";

export default function Fan() {
  const schoolId = localStorage.getItem("school_id");

  // ================= FANLAR =================
  const { data: subjects = [], isLoading, refetch } = useGetSubjectsQuery();
  const [addSubject] = useAddSubjectMutation();
  const [updateSubject] = useUpdateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  // ================= CHORAKLAR =================
  const [saveQuartersMutation] = useSetQuartersMutation(); // ✅ NOM O‘ZGARDI
  const { data: quarterData } = useGetQuartersBySchoolQuery(schoolId);

  const [quarters, setQuarters] = useState([
    { quarter: 1, startDate: "", endDate: "" },
    { quarter: 2, startDate: "", endDate: "" },
    { quarter: 3, startDate: "", endDate: "" },
    { quarter: 4, startDate: "", endDate: "" },
  ]);

  useEffect(() => {
    if (quarterData?.quarters) {
      setQuarters(
        quarterData.quarters.map((q) => ({
          quarter: q.quarter,
          startDate: q.startDate?.slice(0, 10),
          endDate: q.endDate?.slice(0, 10),
        }))
      );
    }
  }, [quarterData]);

  const handleQuarterChange = (index, field, value) => {
    const copy = [...quarters];
    copy[index][field] = value;
    setQuarters(copy);
  };

  const saveQuarters = async () => {
    try {
      await saveQuartersMutation({
        schoolId,
        quarters,
      }).unwrap();

      message.success("Chorak sanalari saqlandi ✅");
    } catch {
      message.error("Xatolik: choraklar saqlanmadi");
    }
  };

  // ================= FAN CRUD =================
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAdd = async (values) => {
    try {
      await addSubject({ ...values, schoolId }).unwrap();
      message.success("Fan qo‘shildi");
      form.resetFields();
      setIsModalOpen(false);
      refetch();
    } catch {
      message.error("Xatolik");
    }
  };

  const handleToggle = async (record) => {
    await updateSubject({
      id: record._id,
      body: { isActive: !record.isActive },
    });
    refetch();
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: "O‘chirishni tasdiqlaysizmi?",
      okType: "danger",
      onOk: async () => {
        await deleteSubject(id);
        refetch();
      },
    });
  };

  const columns = [
    { title: "Fan nomi", dataIndex: "name" },
    {
      title: "Holat",
      render: (_, r) => (
        <Switch checked={r.isActive} onChange={() => handleToggle(r)} />
      ),
    },
    {
      title: "Amallar",
      render: (_, r) => (
        <Button danger onClick={() => confirmDelete(r._id)}>
          O‘chirish
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h2>📘 Fanlar</h2>
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Fan qo‘shish
      </Button>

      <Table
        columns={columns}
        dataSource={subjects}
        rowKey="_id"
        loading={isLoading}
        style={{ marginTop: 16 }}
      />

      <hr style={{ margin: "32px 0" }} />

      <h2>📅 Chorak sanalari</h2>

      {quarters.map((q, index) => (
        <div
          key={q.quarter}
          style={{ display: "flex", gap: 12, marginBottom: 10 }}
        >
          <b style={{ width: 90 }}>{q.quarter}-chorak</b>

          <input
            type="date"
            value={q.startDate}
            onChange={(e) =>
              handleQuarterChange(index, "startDate", e.target.value)
            }
          />

          <span>—</span>

          <input
            type="date"
            value={q.endDate}
            onChange={(e) =>
              handleQuarterChange(index, "endDate", e.target.value)
            }
          />
        </div>
      ))}

      <Button type="primary" onClick={saveQuarters}>
        Choraklarni saqlash
      </Button>

      {/* MODAL */}
      <Modal
        open={isModalOpen}
        title="Yangi fan"
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item name="name" label="Fan nomi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Saqlash
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
