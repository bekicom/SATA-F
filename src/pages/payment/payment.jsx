import React, { useMemo, useState } from "react";
import "./payment.css";
import { useGetPaymentQuery } from "../../context/service/payment.service";
import { useGetClassQuery } from "../../context/service/class.service";
import { Table } from "../../components/table/table";
import moment from "moment";
import { FaList, FaPlus } from "react-icons/fa";
import { Button, DatePicker, Input, Select, Spin, Empty } from "antd";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const monthName = (month) => {
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
    10: "Oktabr",
    11: "Noyabr",
    12: "Dekabr",
  };
  return months[month] || "Noma'lum oy";
};

export const Payment = () => {
  const { data: payments = [], isLoading, isFetching } = useGetPaymentQuery();
  const { data: groupData = [] } = useGetClassQuery();
  const navigate = useNavigate();

  const currentMonth = moment().format("MM-YYYY");

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [viewType, setViewType] = useState("monthly");
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [dateRange, setDateRange] = useState(null); // ✅ dan-gacha filter

  const groupMap = useMemo(() => {
    const map = {};
    groupData.forEach((g) => {
      if (g?._id) map[g._id] = g;
    });
    return map;
  }, [groupData]);

  const filteredPayments = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    const todayDate = moment().format("YYYY-MM-DD");

    return payments.filter((item) => {
      if (!item) return false;

      // Sinf filter
      if (selectedClass && item.user_groupId !== selectedClass) return false;

      // Ism filter
      if (
        searchValue &&
        !item.user_fullname?.toLowerCase().includes(searchValue.toLowerCase())
      )
        return false;

      // ✅ Dan-gacha filter (createdAt bo'yicha) — range tanlangan bo'lsa
      if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        const createdAt = moment(item.createdAt);
        const start = moment(dateRange[0]).startOf("day");
        const end = moment(dateRange[1]).endOf("day");
        if (!createdAt.isBetween(start, end, null, "[]")) return false;
      } else {
        // ✅ Range yo'q bo'lsa — oylik yoki kunlik filter
        if (viewType === "monthly") {
          if (!selectedMonth) return true;
          const itemMonth = moment(item.payment_month, "MM-YYYY");
          const selected = moment(selectedMonth, "MM-YYYY");
          return itemMonth.isValid() && itemMonth.isSame(selected, "month");
        }

        if (viewType === "daily") {
          const paymentDate = moment(item.createdAt).format("YYYY-MM-DD");
          return paymentDate === todayDate;
        }
      }

      return true;
    });
  }, [
    payments,
    selectedClass,
    searchValue,
    selectedMonth,
    viewType,
    dateRange,
  ]);

  const totalPayment = useMemo(() => {
    return filteredPayments.reduce(
      (sum, item) => sum + (Number(item?.payment_quantity) || 0),
      0,
    );
  }, [filteredPayments]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>To'lovlar</h1>
        <div className="page-header__actions">
          <Search
            placeholder="Ism bo'yicha qidiruv"
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 250, marginRight: 10 }}
          />

          {/* ✅ Dan-gacha sana filter */}
          <RangePicker
            format="DD-MM-YYYY"
            onChange={(dates) => {
              // Range tanlanса — oylik/kunlik filterni o'chirib qo'yamiz
              setDateRange(dates ? [...dates] : null);
            }}
            style={{ marginRight: 10 }}
            placeholder={["Dan", "Gacha"]}
          />

          {/* ✅ Range tanlanmagan bo'lsagina oy va viewType ko'rinadi */}
          {!dateRange && (
            <>
              <DatePicker
                picker="month"
                format="MM-YYYY"
                defaultValue={moment(currentMonth, "MM-YYYY")}
                onChange={(date, dateString) =>
                  setSelectedMonth(dateString || null)
                }
                style={{ marginRight: 10 }}
              />

              <Select
                value={viewType}
                style={{ width: 120, marginRight: 10 }}
                onChange={setViewType}
              >
                <Option value="monthly">Oylik</Option>
                <Option value="daily">Kunlik</Option>
              </Select>
            </>
          )}

          <Select
            allowClear
            placeholder="Sinfni tanlash"
            style={{ width: 180, marginRight: 10 }}
            onChange={setSelectedClass}
          >
            {groupData.map((g) => (
              <Option key={g._id || g.name} value={g._id}>
                {g.name}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            onClick={() => navigate("log")}
            style={{ marginRight: 8 }}
          >
            <FaList />
          </Button>
          <Button type="primary" onClick={() => navigate("create")}>
            <FaPlus />
          </Button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <Empty description="To'lovlar topilmadi" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>№</th>
              <th>To'liq ismi</th>
              <th>Sinfi</th>
              <th>To'lov summasi</th>
              <th>To'lov oyi</th>
              <th>To'lov sanasi</th>
              <th>To'lov turi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((item, index) => {
              const group = groupMap[item?.user_group];
              return (
                <tr key={item?._id || `${item?.user_fullname}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{item?.user_fullname}</td>
                  <td>
                    {group ? `${group.name} ${group.number || ""}` : "Noma'lum"}
                  </td>
                  <td>{Number(item?.payment_quantity).toLocaleString()} UZS</td>
                  <td>
                    {monthName(item?.payment_month?.slice(0, 2))}{" "}
                    {item?.payment_month?.slice(3, 8)}
                  </td>
                  <td>{moment(item?.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                  <td>
                    {item?.payment_type === "cash"
                      ? "Naqd"
                      : item?.payment_type === "card"
                        ? "Karta"
                        : item?.payment_type === "bankshot"
                          ? "BankShot"
                          : "Noma'lum"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <div className="total-payment">
        <h3>Jami to'lov: {totalPayment.toLocaleString()} UZS</h3>
      </div>

      {isFetching && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};
