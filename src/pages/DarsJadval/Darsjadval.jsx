import React, { useState } from "react";
import { Tabs, Button, Modal, Form, Select, message } from "antd";
import {
  useGetScheduleByClassQuery,
  useAddLessonMutation,
} from "../../context/service/schedule.service";
import { useGetSubjectsQuery } from "../../context/service/fan.service";
import { useGetTeachersQuery } from "../../context/service/teacher.service";
import { useGetClassQuery } from "../../context/service/class.service";

const { TabPane } = Tabs;

export default function Darsjadval() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("dushanba");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [form] = Form.useForm();
  const [addLesson] = useAddLessonMutation();

  // 🔹 Fanlar, o‘qituvchilar va guruhlarni olish
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const { data: groups = [] } = useGetClassQuery();

  // 🔹 Jadvalni olish (guruh bo‘yicha)
  const { data: scheduleResponse, refetch } = useGetScheduleByClassQuery(
    selectedGroup,
    { skip: !selectedGroup }
  );

  // ✅ Backend qaytaradigan strukturaga moslab massiv qilib olish
  const schedule = Array.isArray(scheduleResponse)
    ? scheduleResponse
    : scheduleResponse?.data || [];

  // 🔹 Modalni ochish
  const openModal = (day, lessonNumber) => {
    setSelectedDay(day);
    form.setFieldsValue({ lessonNumber });
    setIsModalOpen(true);
  };

  // 🔹 Modalni yopish
  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  // 🔹 Yangi dars qo‘shish
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

  // 🔹 Haftalik kunlar
  const days = [
    { key: "dushanba", label: "DUSHANBA" },
    { key: "seshanba", label: "SESHANBA" },
    { key: "chorshanba", label: "CHORSHANBA" },
    { key: "payshanba", label: "PAYSHANBA" },
    { key: "juma", label: "JUMA" },
    { key: "shanba", label: "SHANBA" },
  ];

  // 🔹 1–11 soat
  const lessons = Array.from({ length: 11 }, (_, i) => i + 1);

  // 🔹 Ma’lum vaqtdagi darsni olish
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

      {/* 🔹 Guruh tanlash */}
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

      {/* 🔹 Haftalik tabs */}
      {selectedGroup && (
        <Tabs
          activeKey={selectedDay}
          onChange={(key) => setSelectedDay(key)}
          type="card"
        >
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
                      {/* Soat */}
                      <div style={{ width: "50px", fontWeight: "bold" }}>
                        {lessonNumber}
                      </div>

                      {/* Dars yoki qo‘shish tugmasi */}
                      <div style={{ flex: 1 }}>
                        {lesson ? (
                          <div
                            style={{
                              background: "#4096ff",
                              color: "#fff",
                              padding: "10px",
                              borderRadius: "4px",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ fontWeight: "bold" }}>
                              {lesson.subjectId?.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                marginTop: "4px",
                              }}
                            >
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
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            color: "#999",
            fontSize: "16px",
          }}
        >
          Jadvalni ko‘rish uchun guruhni tanlang
        </div>
      )}

      {/* 🔹 Dars qo‘shish modal */}
      <Modal
        title="Yangi dars qo'shish"
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
            <Select
              options={lessons.map((n) => ({ label: `${n}-soat`, value: n }))}
              disabled
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
