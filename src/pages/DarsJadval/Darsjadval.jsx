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
  const [selectedLesson, setSelectedLesson] = useState(null);

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

  const openModal = (day, lessonNumber) => {
    setSelectedDay(day);
    form.setFieldsValue({ lessonNumber });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

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

  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    editForm.setFieldsValue({
      subjectId: lesson.subjectId?._id,
      teacherId: lesson.teacherId?._id,
      lessonNumber: lesson.lessonNumber,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    editForm.resetFields();
    setIsEditModalOpen(false);
    setSelectedLesson(null);
  };

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

  const days = [
    { key: "dushanba", label: "DUSHANBA" },
    { key: "seshanba", label: "SESHANBA" },
    { key: "chorshanba", label: "CHORSHANBA" },
    { key: "payshanba", label: "PAYSHANBA" },
    { key: "juma", label: "JUMA" },
    { key: "shanba", label: "SHANBA" },
  ];

  const lessons = Array.from({ length: 11 }, (_, i) => i + 1);

  const getLessonForTimeSlot = (lessonNumber) =>
    schedule.find(
      (item) =>
        item.day === selectedDay &&
        item.lessonNumber === lessonNumber &&
        (item.groupId?._id === selectedGroup || item.groupId === selectedGroup)
    );

  return (
    <div style={{ padding: 20, background: "#fff" }}>
      <h2>Dars jadvali</h2>

      <Select
        placeholder="Guruhni tanlang"
        style={{ width: 250, marginBottom: 20 }}
        onChange={setSelectedGroup}
        options={groups.map((g) => ({
          label: g.name || `Sinf-${g.number}`,
          value: g._id,
        }))}
      />

      {selectedGroup && (
        <Tabs activeKey={selectedDay} onChange={setSelectedDay}>
          {days.map((day) => (
            <TabPane tab={day.label} key={day.key}>
              {lessons.map((lessonNumber) => {
                const lesson = getLessonForTimeSlot(lessonNumber);

                return (
                  <div key={lessonNumber} style={{ marginBottom: 8 }}>
                    {lesson ? (
                      <div
                        onClick={() => openEditModal(lesson)}
                        style={{
                          background: "#4096ff",
                          color: "#fff",
                          padding: 10,
                          cursor: "pointer",
                        }}
                      >
                        <b>{lesson.subjectId?.name}</b>
                        <div style={{ fontSize: 12 }}>
                          {lesson.teacherId?.firstName}{" "}
                          {lesson.teacherId?.lastName}
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="dashed"
                        block
                        onClick={() => openModal(selectedDay, lessonNumber)}
                      >
                        + Qo‘shish ({lessonNumber}-soat)
                      </Button>
                    )}
                  </div>
                );
              })}
            </TabPane>
          ))}
        </Tabs>
      )}

      {/* ➕ ADD MODAL */}
      <Modal
        title="Yangi dars qo‘shish"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddLesson}>
          <Form.Item name="subjectId" label="Fan" required>
            <Select
              options={subjects.map((s) => ({
                label: s.name,
                value: s._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="teacherId" label="O‘qituvchi" required>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Ism yoki familiya yozing"
              options={teachers.map((t) => ({
                label: `${t.firstName} ${t.lastName}`,
                value: t._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="lessonNumber" label="Soat">
            <Select disabled />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Saqlash
          </Button>
        </Form>
      </Modal>

      {/* ✏️ EDIT MODAL */}
      <Modal
        title="Darsni tahrirlash"
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditLesson}>
          <Form.Item name="subjectId" label="Fan" required>
            <Select
              options={subjects.map((s) => ({
                label: s.name,
                value: s._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="teacherId" label="O‘qituvchi" required>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Ism yoki familiya yozing"
              options={teachers.map((t) => ({
                label: `${t.firstName} ${t.lastName}`,
                value: t._id,
              }))}
            />
          </Form.Item>

          <Form.Item name="lessonNumber" label="Soat">
            <Select
              options={lessons.map((n) => ({
                label: `${n}-soat`,
                value: n,
              }))}
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
