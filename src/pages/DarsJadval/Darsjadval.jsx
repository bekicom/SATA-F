import React, { useState } from "react";
import { Tabs, Button, Modal, Form, Select, message } from "antd";
import {
  useGetScheduleByClassQuery,
  useAddLessonMutation,
  useUpdateLessonMutation,
} from "../../context/service/schedule.service";
import { useGetSubjectsQuery } from "../../context/service/fan.service";
import { useGetTeachersQuery } from "../../context/service/teacher.service";
import { useGetClassQuery } from "../../context/service/class.service";

const { TabPane } = Tabs;

export default function Darsjadval() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState("dushanba");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [selectedLesson, setSelectedLesson] = useState(null); // EDIT uchun

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [addLesson] = useAddLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();

  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: groups = [] } = useGetClassQuery();

  const { data: scheduleResponse, refetch } = useGetScheduleByClassQuery(
    selectedGroup,
    { skip: !selectedGroup }
  );

  const schedule = Array.isArray(scheduleResponse)
    ? scheduleResponse
    : scheduleResponse?.data || [];

  // Dars qo'shish modalini ochish
  const openModal = (day, lessonNumber) => {
    setSelectedDay(day);
    form.setFieldsValue({ lessonNumber });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  // 🎯 Dars qo'shish
  const handleAddLesson = async (values) => {
    try {
      await addLesson({
        ...values,
        day: selectedDay,
        groupId: selectedGroup,
      }).unwrap();
      message.success("Dars qo‘shildi");
      refetch();
      handleCancel();
    } catch (err) {
      message.error(err?.data?.message || "Xatolik yuz berdi");
    }
  };

  // 🎯 EDIT Modalni ochish
  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    editForm.setFieldsValue({
      subjectId: lesson.subjectId?._id,
      teacherId: lesson.teacherId?._id,
      lessonNumber: lesson.lessonNumber,
    });
    setIsEditModalOpen(true);
  };

  // EDIT modalni yopish
  const closeEditModal = () => {
    editForm.resetFields();
    setIsEditModalOpen(false);
    setSelectedLesson(null);
  };

  // 🎯 Darsni yangilash
  const handleEditLesson = async (values) => {
    try {
      await updateLesson({
        id: selectedLesson._id,
        body: values,
      }).unwrap();

      message.success("Dars yangilandi!");
      closeEditModal();
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Xatolik yuz berdi");
    }
  };

  // Haftalik kunlar
  const days = [
    { key: "dushanba", label: "DUSHANBA" },
    { key: "seshanba", label: "SESHANBA" },
    { key: "chorshanba", label: "CHORSHANBA" },
    { key: "payshanba", label: "PAYSHANBA" },
    { key: "juma", label: "JUMA" },
    { key: "shanba", label: "SHANBA" },
  ];

  const lessons = Array.from({ length: 11 }, (_, i) => i + 1);

  const getLessonForTimeSlot = (lessonNumber) => {
    return schedule.find(
      (item) =>
        item.day === selectedDay &&
        item.lessonNumber === lessonNumber &&
        (item.groupId?._id === selectedGroup || item.groupId === selectedGroup)
    );
  };

  return (
    <div style={{ width: "100%", padding: "20px", background: "#fff" }}>
      <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "500" }}>
        Dars jadvali
      </h2>

      {/* Guruh tanlash */}
      <div style={{ marginBottom: "20px" }}>
        <Select
          placeholder="Guruhni tanlang"
          style={{ width: 250 }}
          onChange={(val) => setSelectedGroup(val)}
          options={groups?.map((g) => ({
            label: g.name || `Sinf-${g.number}`,
            value: g._id,
          }))}
        />
      </div>

      {selectedGroup && (
        <Tabs activeKey={selectedDay} onChange={(key) => setSelectedDay(key)}>
          {days.map((day) => (
            <TabPane tab={day.label} key={day.key}>
              <div style={{ border: "1px solid #f0f0f0", borderRadius: 4 }}>
                {lessons.map((lessonNumber) => {
                  const lesson = getLessonForTimeSlot(lessonNumber);

                  return (
                    <div
                      key={lessonNumber}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid #f0f0f0",
                        padding: "10px",
                      }}
                    >
                      <div style={{ width: "50px", fontWeight: "bold" }}>
                        {lessonNumber}
                      </div>

                      <div style={{ flex: 1 }}>
                        {lesson ? (
                          <div
                            onClick={() => openEditModal(lesson)}
                            style={{
                              background: "#4096ff",
                              color: "#fff",
                              padding: "10px",
                              borderRadius: "4px",
                              textAlign: "center",
                              cursor: "pointer",
                              border: "2px solid transparent",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.border =
                                "2px solid #0050b3")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.border =
                                "2px solid transparent")
                            }
                          >
                            <div style={{ fontWeight: "bold" }}>
                              {lesson.subjectId?.name}
                            </div>
                            <div style={{ fontSize: "12px", marginTop: "4px" }}>
                              {lesson.teacherId?.firstName}{" "}
                              {lesson.teacherId?.lastName}
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="dashed"
                            onClick={() => openModal(selectedDay, lessonNumber)}
                            style={{ width: "100%" }}
                          >
                            + Qo‘shish
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabPane>
          ))}
        </Tabs>
      )}

      {!selectedGroup && (
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
          Jadvalni ko‘rish uchun guruhni tanlang
        </div>
      )}

      {/* Yangi dars qo‘shish modal */}
      <Modal
        title="Yangi dars qo‘shish"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAddLesson}>
          <Form.Item name="subjectId" label="Fan" rules={[{ required: true }]}>
            <Select
              placeholder="Fan tanlang"
              options={subjects.map((s) => ({ label: s.name, value: s._id }))}
            />
          </Form.Item>

          <Form.Item
            name="teacherId"
            label="O‘qituvchi"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="O‘qituvchini tanlang"
              options={teachers.map((t) => ({
                label: `${t.firstName} ${t.lastName}`,
                value: t._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="lessonNumber" label="Soat">
            <Select disabled />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 📌 EDIT DARS MODALI */}
      <Modal
        title="Darsni tahrirlash"
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditLesson}>
          <Form.Item name="subjectId" label="Fan" rules={[{ required: true }]}>
            <Select
              options={subjects.map((s) => ({ label: s.name, value: s._id }))}
            />
          </Form.Item>

          <Form.Item
            name="teacherId"
            label="O‘qituvchi"
            rules={[{ required: true }]}
          >
            <Select
              options={teachers.map((t) => ({
                label: `${t.firstName} ${t.lastName}`,
                value: t._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="lessonNumber" label="Soat">
            <Select
              options={lessons.map((n) => ({ label: `${n}-soat`, value: n }))}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Yangilash
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
