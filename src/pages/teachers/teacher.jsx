import React, { useEffect, useState } from "react";
import { Table, Button, Popover, message, Modal, Input } from "antd";
import { MdDelete, MdEdit, MdQrCode } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import moment from "moment";
import {
  useDeleteTeacherMutation,
  useGetTeachersQuery,
} from "../../context/service/teacher.service";
import { Loading } from "../../components/loading/loading";
import "./teacher.css";

const Teacher = () => {
  const navigate = useNavigate();
  const {
    data: teachers = [],
    error: fetchError,
    isLoading: fetchLoading,
    refetch,
  } = useGetTeachersQuery();
  const [deleteTeacher] = useDeleteTeacherMutation();
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredTeachers, setFilteredTeachers] = useState(teachers);
  useEffect(() => {
    setFilteredTeachers(teachers);
  }, [teachers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Rostan ham o'qituvchini o'chirmoqchimisiz?")) {
      return;
    }
    try {
      await deleteTeacher(id);
      message.success("O'qituvchi muvaffaqiyatli o'chirildi");
      refetch();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      message.error("O'qituvchini o'chirishda xato yuz berdi");
    }
  };

  const handleShowQRCode = (teacher) => {
    setSelectedTeacherId(teacher._id);
    setSelectedTeacher(teacher);
    setQrModalVisible(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const columns = [
    {
      title: "№",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Ismi",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Familiyasi",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Tug'ilgan sana",
      dataIndex: "birthDate",
      key: "birthDate",
      render: (date) => moment(date).format("DD.MM.YYYY"),
    },
    {
      title: "Telefon raqami",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Fan",
      dataIndex: "science",
      key: "science",
    },
    {
      title: "Amallar",
      key: "actions",
      render: (text, record) => (
        <>
          <Popover placement="bottom" content={"Tahrirlash"}>
            <Button
              type="primary"
              icon={<MdEdit />}
              onClick={() => navigate(`/addteacher/${record._id}`)}
              style={{ marginRight: 8 }}
            />
          </Popover>
         
          <Popover placement="bottom" content={"O'chirish"}>
            <Button
              type="primary"
              danger
              icon={<MdDelete />}
              onClick={() => handleDelete(record._id)}
            />
          </Popover>
        </>
      ),
    },
  ];

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    const filtered = teachers.filter((item) =>
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(value)
    );
    setFilteredTeachers(filtered);
  };

  if (fetchLoading) return <Loading />;
  if (fetchError) return <div>O'qituvchilarni olishda xato yuz berdi</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>O'qituvchilar</h1>

        <div className="page-header__actions">
          <p>
            <i>Umumiy o'qituvchilar:</i> <span>{teachers?.length || 0}</span>
          </p>
          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={() => navigate("/addteacher")}
          >
            Qo'shish
          </Button>
          <Input
            onChange={handleSearch}
            type="text"
            placeholder="Ismi bo'yicha qidirish"
          />
        </div>
      </div>
      <Table
        dataSource={filteredTeachers}
        columns={columns}
        rowKey="_id"
        pagination={{ current: currentPage, pageSize: pageSize }}
        onChange={handleTableChange}
        loading={fetchLoading}
      />
      
    </div>
  );
};

export default Teacher;
