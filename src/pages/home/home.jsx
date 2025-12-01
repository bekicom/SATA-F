import React, { useEffect, useState, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useGetSchoolQuery } from "../../context/service/admin.service";
import { useGetPaymentLogQuery } from "../../context/service/payment.service";
import { useGetHarajatQuery } from "../../context/service/harajat.service";
import moment from "moment";
import "./home.css";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const Home = () => {
  const { data: schoolData = {} } = useGetSchoolQuery();
  const { data: payments = [] } = useGetPaymentLogQuery();
  const { data: harajatlar = [] } = useGetHarajatQuery();

  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [showCalendar, setShowCalendar] = useState(false);

  // Statistikalar
  const [dailyCashIncome, setDailyCashIncome] = useState(0);
  const [dailyCardIncome, setDailyCardIncome] = useState(0);
  const [dailyBankIncome, setDailyBankIncome] = useState(0);
  const [dailyCashExpense, setDailyCashExpense] = useState(0);
  const [dailyCardExpense, setDailyCardExpense] = useState(0);
  const [dailyBankExpense, setDailyBankExpense] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);

  const currentMonthStr = moment(selectedDate).format("MM-YYYY");
  const todayStr = moment(selectedDate).format("YYYY-MM-DD");

  // Barcha hisob-kitoblar useMemo orqali optimallashtirildi
  const calculations = useMemo(() => {
    let monthlyInc = 0;
    let monthlyExp = 0;

    let dayCashInc = 0,
      dayCardInc = 0,
      dayBankInc = 0;
    let dayCashExp = 0,
      dayCardExp = 0,
      dayBankExp = 0;

    // 12 oylik ma'lumotlar (grafik uchun)
    const monthlyIncomeByMonth = Array(12).fill(0);
    const monthlyExpenseByMonth = Array(12).fill(0);

    // Oxirgi 30 kunlik kunlik ma'lumotlar
    const dailyLabels = [];
    const dailyIncomeData = [];
    const dailyExpenseData = [];

    // Har bir payment va harajatni aylantiramiz
    [...payments, ...harajatlar].forEach((item) => {
      const date = moment(item.createdAt);
      const dateStr = date.format("YYYY-MM-DD");
      const monthStr = date.format("MM-YYYY");
      const monthIndex = date.month(); // 0-11

      // Agar payment bo'lsa
      if (item.payment_quantity !== undefined) {
        const amount = item.payment_quantity || 0;

        // Oylik jami
        if (monthStr === currentMonthStr) {
          monthlyInc += amount;
        }

        // Kunlik jami
        if (dateStr === todayStr) {
          if (item.payment_type === "cash") dayCashInc += amount;
          if (item.payment_type === "card") dayCardInc += amount;
          if (item.payment_type === "bankshot") dayBankInc += amount;
        }

        // Oylik grafik uchun
        monthlyIncomeByMonth[monthIndex] += amount;

        // Oxirgi 30 kun grafik
        if (date.isSameOrAfter(moment().subtract(29, "days"))) {
          const dayIndex = 29 - moment().diff(date, "days");
          if (!dailyIncomeData[dayIndex]) {
            dailyIncomeData[dayIndex] = 0;
            dailyExpenseData[dayIndex] = 0;
            dailyLabels[dayIndex] = date.format("DD MMM");
          }
          dailyIncomeData[dayIndex] += amount;
        }
      }

      // Agar harajat bo'lsa
      if (item.summ !== undefined) {
        const amount = item.summ || 0;

        if (monthStr === currentMonthStr) {
          monthlyExp += amount;
        }

        if (dateStr === todayStr) {
          if (item.paymentType === "naqd") dayCashExp += amount;
          if (item.paymentType === "plastik") dayCardExp += amount;
          if (item.paymentType === "bankshot") dayBankExp += amount;
        }

        monthlyExpenseByMonth[monthIndex] += amount;

        if (date.isSameOrAfter(moment().subtract(29, "days"))) {
          const dayIndex = 29 - moment().diff(date, "days");
          if (!dailyExpenseData[dayIndex]) {
            dailyExpenseData[dayIndex] = 0;
            dailyIncomeData[dayIndex] = 0;
            dailyLabels[dayIndex] = date.format("DD MMM");
          }
          dailyExpenseData[dayIndex] += amount;
        }
      }
    });

    // Label va data to'ldirish (agar bo'sh joy bo'lsa)
    for (let i = 0; i < 30; i++) {
      if (!dailyLabels[i]) {
        const d = moment().subtract(29 - i, "days");
        dailyLabels[i] = d.format("DD MMM");
        dailyIncomeData[i] = dailyIncomeData[i] || 0;
        dailyExpenseData[i] = dailyExpenseData[i] || 0;
      }
    }

    // Byudjet hisobi
    const initialBudget =
      schoolData.budgetHistory?.find((b) => b.month === currentMonthStr)
        ?.budget || 0;

    const budget = initialBudget + monthlyInc - monthlyExp;

    return {
      monthlyIncome: monthlyInc,
      monthlyExpense: monthlyExp,
      currentBudget: budget,
      dailyCashIncome: dayCashInc,
      dailyCardIncome: dayCardInc,
      dailyBankIncome: dayBankInc,
      dailyCashExpense: dayCashExp,
      dailyCardExpense: dayCardExp,
      dailyBankExpense: dayBankExp,
      monthlyIncomeByMonth,
      monthlyExpenseByMonth,
      dailyLabels,
      dailyIncomeData,
      dailyExpenseData,
    };
  }, [
    payments,
    harajatlar,
    selectedDate,
    currentMonthStr,
    todayStr,
    schoolData.budgetHistory,
  ]);

  // State'larga yozamiz
  useEffect(() => {
    setMonthlyIncome(calculations.monthlyIncome);
    setMonthlyExpense(calculations.monthlyExpense);
    setCurrentBudget(calculations.currentBudget);

    setDailyCashIncome(calculations.dailyCashIncome);
    setDailyCardIncome(calculations.dailyCardIncome);
    setDailyBankIncome(calculations.dailyBankIncome);

    setDailyCashExpense(calculations.dailyCashExpense);
    setDailyCardExpense(calculations.dailyCardExpense);
    setDailyBankExpense(calculations.dailyBankExpense);
  }, [calculations]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowCalendar(false);
  };

  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyun",
    "Iyul",
    "Avg",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 13, weight: "600" } },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} UZS`,
        },
      },
    },
    scales: { y: { beginAtZero: true } },
  };

  const dailyChartData = {
    labels: calculations.dailyLabels,
    datasets: [
      {
        label: "Kunlik Kirim",
        data: calculations.dailyIncomeData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Kunlik Xarajat",
        data: calculations.dailyExpenseData,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const yearlyChartData = {
    labels: months,
    datasets: [
      {
        label: "Oylik Kirim",
        data: calculations.monthlyIncomeByMonth,
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        fill: true,
      },
      {
        label: "Oylik Xarajat",
        data: calculations.monthlyExpenseByMonth,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Moliyaviy ko'rsatkichlar</p>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Oylik statistika */}
      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <p className="stat-label">Oylik Kirim</p>
            <h3 className="stat-value">{monthlyIncome.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>
        <div className="stat-card stat-expense">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <p className="stat-label">Oylik Xarajat</p>
            <h3 className="stat-value">{monthlyExpense.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>
        <div className="stat-card stat-budget">
          <div className="stat-icon"></div>
          <div className="stat-info">
            <p className="stat-label">Joriy Byudjet</p>
            <h3 className="stat-value">{currentBudget.toLocaleString()}</h3>
            <span className="stat-currency">UZS</span>
          </div>
        </div>
      </div>

      {/* Kunlik kirim/xarajat */}
      <div className="daily-stats">
        <div className="daily-card daily-income">
          <h4>Bugungi Kirim</h4>
          <div className="daily-items">
            <div className="daily-item">
              Naqd: <strong>{dailyCashIncome.toLocaleString()} UZS</strong>
            </div>
            <div className="daily-item">
              Karta: <strong>{dailyCardIncome.toLocaleString()} UZS</strong>
            </div>
            <div className="daily-item">
              Bank: <strong>{dailyBankIncome.toLocaleString()} UZS</strong>
            </div>
          </div>
        </div>
        <div className="daily-card daily-expense">
          <h4>Bugungi Xarajat</h4>
          <div className="daily-items">
            <div className="daily-item">
              Naqd: <strong>{dailyCashExpense.toLocaleString()} UZS</strong>
            </div>
            <div className="daily-item">
              Karta: <strong>{dailyCardExpense.toLocaleString()} UZS</strong>
            </div>
            <div className="daily-item">
              Bank: <strong>{dailyBankExpense.toLocaleString()} UZS</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grafiklar */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Oxirgi 30 kun (Kunlik)</h3>
          <div className="chart-wrapper">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Yillik (Oylik)</h3>
          <div className="chart-wrapper">
            <Line data={yearlyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <h3>Oylik Taqqoslash</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: months,
                datasets: [
                  {
                    label: "Kirim",
                    data: calculations.monthlyIncomeByMonth,
                    backgroundColor: "rgba(16,185,129,0.8)",
                    borderRadius: 8,
                  },
                  {
                    label: "Xarajat",
                    data: calculations.monthlyExpenseByMonth,
                    backgroundColor: "rgba(239,68,68,0.8)",
                    borderRadius: 8,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
