import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  MessageCircle,
  X,
  Clock,
  PartyPopper,
  Filter,
  Download,
  User,
} from "lucide-react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyzGAhuT63tIIgyKKu_nZz_EjUpUSonMw6fFLjzRdnb_Te7ReYBaV36A89UknMYGRrW/exec";

const NewLeadCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper arrays
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SCRIPT_URL}?sheet=New Lead Calendar`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 1) {
        const headers = result.data[0];
        const rows = result.data.slice(1);

        const newEvents = [];

        rows.forEach((row, rowIndex) => {
          const partyName = row[0];
          const personName = row[1]; // Capture Person Name from 2nd column
          const mobileNumber = row[2]; // Capture Mobile Number from 3rd column
          if (!partyName) return;

          // Start from colIndex 3 because 0 is Party Name, 1 is Person Name, 2 is Mobile Number
          for (let colIndex = 3; colIndex < headers.length; colIndex++) {
            const cellValue = row[colIndex];
            const eventName = headers[colIndex];

            if (cellValue && eventName) {
              let parsedDate = null;
              try {
                if (typeof cellValue === "string" && cellValue.includes("/")) {
                  const parts = cellValue.split("/");
                  if (parts.length === 3) {
                    // Handle DD/MM/YYYY
                    parsedDate = new Date(
                      `${parts[2]}-${parts[1]}-${parts[0]}`,
                    );
                  }
                } else {
                  parsedDate = new Date(cellValue);
                }
              } catch (e) {
                console.warn("Date parse error", e);
              }

              if (parsedDate && !isNaN(parsedDate.getTime())) {
                newEvents.push({
                  id: `${rowIndex}-${colIndex}`,
                  partyName: partyName,
                  personName: personName, // Add person name to event object
                  mobileNumber: mobileNumber, // Add mobile number to event object
                  eventName: eventName,
                  date: parsedDate,
                  originalDate: cellValue,
                });
              }
            }
          }
        });

        setEvents(newEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );

  const isEventOnDate = (event, targetDate) => {
    if (!event.date || !(event.date instanceof Date) || isNaN(event.date))
      return false;

    const isRecurring = /birthday|anniversary/i.test(event.eventName);

    if (isRecurring) {
      return (
        event.date.getDate() === targetDate.getDate() &&
        event.date.getMonth() === targetDate.getMonth()
      );
    }

    return (
      event.date.getDate() === targetDate.getDate() &&
      event.date.getMonth() === targetDate.getMonth() &&
      event.date.getFullYear() === targetDate.getFullYear()
    );
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getEventsForDay = (day) => {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    return events.filter((event) => isEventOnDate(event, targetDate));
  };

  const [selectedFestival, setSelectedFestival] = useState(null); // { name: "Eid", events: [] }

  const getGroupedMonthEvents = () => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter events that happen in the CURRENT VIEW's month AND are not in the past
    const currentMonthEvents = events.filter((event) => {
      if (!event.date || !(event.date instanceof Date) || isNaN(event.date))
        return false;

      const isRecurring = /birthday|anniversary/i.test(event.eventName);

      // Calculate the effective date of the event for the current view
      const effectiveDate = new Date(event.date);
      if (isRecurring) {
        effectiveDate.setFullYear(currentDate.getFullYear());
      }

      // 1. Must be in the month currently being viewed
      if (
        effectiveDate.getMonth() !== currentDate.getMonth() ||
        effectiveDate.getFullYear() !== currentDate.getFullYear()
      ) {
        return false;
      }

      // 2. Must be Today or Upcoming (relative to real time)
      const checkDate = new Date(effectiveDate);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < today) {
        return false;
      }

      return true;
    });

    currentMonthEvents.forEach((event) => {
      if (!groups[event.eventName]) {
        groups[event.eventName] = [];
      }
      groups[event.eventName].push(event);
    });

    return Object.keys(groups)
      .map((name) => ({
        name,
        events: groups[name],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const groupedEvents = getGroupedMonthEvents();

  const handleDateClick = (day) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedDate({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
        events: dayEvents,
      });
      setIsModalOpen(true);
    }
  };

  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="bg-gray-50/20 border-r border-b border-gray-100"
        ></div>,
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = isSameDay(
        new Date(),
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
      );

      // Get unique event names for this day
      const uniqueEventNames = [...new Set(dayEvents.map((e) => e.eventName))];

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`border-r border-b border-gray-100 p-1 relative cursor-pointer hover:bg-gray-50 transition-colors flex flex-col ${isToday ? "bg-indigo-50/40" : "bg-white"}`}
        >
          <div
            className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white" : "text-gray-500"}`}
          >
            {day}
          </div>

          <div className="flex-1 overflow-hidden mt-1 space-y-0.5">
            {uniqueEventNames.slice(0, 3).map((name, idx) => {
              const isShortEvent = /birthday|anniversary/i.test(name);
              return (
                <div
                  key={idx}
                  className={`bg-indigo-100 text-indigo-800 rounded px-1.5 py-0.5 text-[11px] font-bold text-center shadow-sm ${isShortEvent ? "truncate" : "whitespace-normal leading-tight"}`}
                >
                  {name}
                </div>
              );
            })}
            {uniqueEventNames.length > 3 && (
              <div className="text-[10px] text-gray-400 pl-1">
                +{uniqueEventNames.length - 3} more
              </div>
            )}
          </div>
        </div>,
      );
    }
    return days;
  };

  const handleFestivalClick = (festival) => {
    setSelectedFestival(festival);
  };

  const handleDownloadFestival = () => {
    if (!selectedFestival) return;

    // Header row
    const headers = [
      "Party Name",
      "Person Name",
      "Mobile Number",
      "Festival Name",
      "Date",
    ];

    // Data rows
    const rows = selectedFestival.events.map((event) => [
      event.partyName,
      event.personName || "",
      event.mobileNumber || "",
      event.eventName,
      `${event.date.getDate()}/${event.date.getMonth() + 1}/${event.date.getFullYear()}`,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedFestival.name}_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0 bg-gray-50">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-4 text-center">
              <p className="font-semibold mb-2">Error loading calendar</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchCalendarData}
                className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6">
              {renderCalendarDays()}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Greetings List (Grouped) */}
      <div className="w-full md:w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-1 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-emerald-500" />
            Festivals & Events
          </h2>
          <p className="text-xs text-gray-500">
            Summary for {months[currentDate.getMonth()]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {groupedEvents.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No events this month</p>
            </div>
          ) : (
            groupedEvents.map((group, idx) => (
              <div
                key={idx}
                onClick={() => handleFestivalClick(group)}
                className="group cursor-pointer flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600 shadow-sm">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {group.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {group.events.length} Parties celebrating
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Date Details */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">
                    {selectedDate.date.getDate()}{" "}
                    {months[selectedDate.date.getMonth()]}
                  </span>
                  Details
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                {selectedDate.events.map((event, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
                  >
                    <h3 className="font-bold text-gray-900">
                      {event.partyName}
                    </h3>
                    {event.personName && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium my-0.5">
                        <User className="w-3 h-3" />
                        <span>{event.personName}</span>
                      </div>
                    )}
                    {event.mobileNumber && (
                      <p className="text-xs text-gray-500 mb-1">
                        {event.mobileNumber}
                      </p>
                    )}
                    <p className="text-sm text-indigo-600 font-medium mt-1">
                      {event.eventName}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal: Festival Details */}
        {selectedFestival && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-emerald-600" />
                  {selectedFestival.name} List
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadFestival}
                    title="Download CSV"
                    className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedFestival(null)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-2 border-b border-gray-50 bg-gray-50/30">
                <p className="text-xs text-center text-gray-500">
                  Showing all {selectedFestival.events.length} parties
                  celebrating {selectedFestival.name} this month
                </p>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {selectedFestival.events
                  .sort((a, b) => a.date - b.date)
                  .map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {event.partyName}
                        </h3>
                        {event.personName && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mt-0.5">
                            <User className="w-3 h-3" />
                            <span>{event.personName}</span>
                          </div>
                        )}
                        {event.mobileNumber && (
                          <p className="text-xs text-gray-500">
                            {event.mobileNumber}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.date.getDate()} {months[event.date.getMonth()]}
                        </p>
                      </div>
                      <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {event.eventName}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewLeadCalendar;
