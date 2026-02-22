import React, { useMemo, useState } from "react";
import {
  Table,
  Popover,
  Input,
  Button,
  message,
  Select,
  Modal,
  Tag,
} from "antd";
import { MdDelete, MdEdit, MdQrCode } from "react-icons/md";
import { FaDownload, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  useDeleteStudentMutation,
  useGetCoinQuery,
  useUpdateStudentStatusMutation,
} from "../../context/service/students.service";
import moment from "moment";
import { Loading } from "../../components/loading/loading";
import { useGetClassQuery } from "../../context/service/class.service";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";

const { Search } = Input;
const { Option } = Select;

const Student = () => {
  const navigate = useNavigate();
  const { data: classes = [] } = useGetClassQuery();
  const { data: students = [], isLoading, refetch } = useGetCoinQuery();

  const [deleteStudent] = useDeleteStudentMutation();
  const [updateStudentStatus] = useUpdateStudentStatusMutation();

  const [selectedClass, setSelectedClass] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // 🔥 FILTER + SORT
  const filteredStudents = useMemo(() => {
    let data = [...students];

    if (selectedClass) {
      data = data.filter((st) => st.groupId?._id === selectedClass);
    }

    if (searchValue) {
      data = data.filter((st) =>
        `${st.firstName} ${st.lastName}`
          .toLowerCase()
          .includes(searchValue.toLowerCase()),
      );
    }

    return data.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
        "uz",
        { sensitivity: "base" },
      ),
    );
  }, [students, selectedClass, searchValue]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "O‘chirishni tasdiqlaysizmi?",
      onOk: async () => {
        await deleteStudent(id);
        message.success("O‘quvchi o‘chirildi");
        refetch();
      },
    });
  };

  const handleToggleStatus = (record) => {
    Modal.confirm({
      title: record.isActive
        ? "Nofaol qilmoqchimisiz?"
        : "Faollashtirmoqchimisiz?",
      onOk: async () => {
        await updateStudentStatus({
          id: record._id,
          isActive: !record.isActive,
        });
        message.success("Holat yangilandi");
        refetch();
      },
    });
  };

  const columns = [
    {
      title: "№",
      render: (_, __, index) => index + 1,
    },
    {
      title: "FISH",
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: "ID (employeeNo)",
      dataIndex: "employeeNo",
    },
    {
      title: "Sinf",
      render: (_, record) => record.groupId?.name,
    },
    {
      title: "Oylik to'lov",
      render: (_, record) => record.monthlyFee?.toLocaleString() + " so'm",
    },
    {
      title: "Tug'ilgan sana",
      render: (_, record) => moment(record.birthDate).format("DD-MM-YYYY"),
    },
    {
      title: "Telefon",
      dataIndex: "phoneNumber",
    },
    {
      title: "Ota-onasining tel.",
      dataIndex: "guardianPhoneNumber",
    },
    {
      title: "Jinsi",
      dataIndex: "gender",
    },
    {
      title: "Seriya",
      dataIndex: "passportNumber",
    },
    {
      title: "Holati",
      render: (_, record) => (
        <>
          <Button
            onClick={() => handleToggleStatus(record)}
            style={{
              backgroundColor: record.isActive ? "#52c41a" : "#f5222d",
              borderColor: record.isActive ? "#52c41a" : "#f5222d",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {record.isActive ? "Faol" : "Faol emas"}
          </Button>

          {!record.isActive && record.inactiveFrom && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              {record.inactiveFrom} dan nofaol
            </Tag>
          )}
        </>
      ),
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            onClick={() => navigate(`/addstudent/${record._id}`)}
          >
            <MdEdit />
          </Button>

          <Button
            style={{ margin: "0 4px" }}
            onClick={() => {
              setSelectedStudent(record);
              setQrModalVisible(true);
            }}
          >
            <MdQrCode />
          </Button>

          <Button danger onClick={() => handleDelete(record._id)}>
            <MdDelete />
          </Button>
        </>
      ),
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>O'quvchilar</h1>

        <div style={{ display: "flex", gap: 12 }}>
          <Select
            placeholder="Sinf"
            value={selectedClass}
            onChange={setSelectedClass}
            allowClear
            style={{ width: 200 }}
          >
            {classes.map((c) => (
              <Option key={c._id} value={c._id}>
                {c.name}
              </Option>
            ))}
          </Select>

          <Search
            placeholder="Qidirish"
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 300 }}
          />

          <Button type="primary" onClick={() => navigate("/addstudent")}>
            <FaPlus /> Qo‘shish
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="QR Kod"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: "center" }}>
          <QRCodeCanvas value={selectedStudent?._id} size={160} />
          <p style={{ marginTop: 12 }}>
            {selectedStudent?.firstName} {selectedStudent?.lastName}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Student;
