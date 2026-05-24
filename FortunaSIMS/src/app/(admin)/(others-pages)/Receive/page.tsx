"use client";

import React, { useMemo, useState } from "react";
import {
  Eye,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  CalendarDays,
  Package,
  X,
} from "lucide-react";

const COLORS = {
  primary: "#005F99",
  secondary: "#C8102E",
  bg: "#ECF5FC",
  card: "#FFFFFF",
  border: "#DCE6F2",
  text: "#0F172A",
  muted: "#64748B",
};

const receiveData = [
  {
    id: "RCV-2026-001",
    transferNo: "ST-2026-101",
    source: "Vizag Central Warehouse",
    destination: "Hyderabad RDC",
    vehicle: "AP31AB4567",
    expectedQty: 200,
    receivedQty: 198,
    status: "Partially Received",
    priority: "High",
    receivedDate: "2026-05-22",
  },

  {
    id: "RCV-2026-002",
    transferNo: "ST-2026-102",
    source: "Chennai Warehouse",
    destination: "Bangalore RDC",
    vehicle: "TN09XZ2201",
    expectedQty: 180,
    receivedQty: 180,
    status: "Completed",
    priority: "Medium",
    receivedDate: "2026-05-21",
  },

  {
    id: "RCV-2026-003",
    transferNo: "ST-2026-103",
    source: "Delhi WH",
    destination: "Mumbai RDC",
    vehicle: "DL22PQ8877",
    expectedQty: 320,
    receivedQty: 0,
    status: "Pending",
    priority: "High",
    receivedDate: "2026-05-23",
  },
];

const warehouseBins = {
  "Vizag WH": ["BIN-A01", "BIN-A02", "BIN-A03", "BIN-B01"],

  "Hyderabad WH": ["HYD-A01", "HYD-A02", "HYD-B01"],

  "Chennai WH": ["CHN-A01", "CHN-A02", "CHN-B01"],
};

const itemData = [
  {
    id: 1,
    item: "Industrial Valve",
    sku: "FG-1001",
    qty: 120,
    warehouse: "Vizag WH",
    bin: "",
    receiveQty: 120,
  },

  {
    id: 2,
    item: "Electrical Motor",
    sku: "FG-1002",
    qty: 80,
    warehouse: "Hyderabad WH",
    bin: "",
    receiveQty: 80,
  },
];

export default function ReceiveManagementPage() {
  const [receiveItems, setReceiveItems] = useState(itemData);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [openModal, setOpenModal] = useState(false);

  const [selectedReceive, setSelectedReceive] = useState<any>(null);

  const [searchId, setSearchId] = useState("");

  const [searchFrom, setSearchFrom] = useState("");

  const [searchTo, setSearchTo] = useState("");

  const [searchDate, setSearchDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [recordsPerPage, setRecordsPerPage] = useState(5);

  const filteredData = useMemo(() => {
    return receiveData.filter((row) => {
      const matchesId = row.id
        .toLowerCase()
        .includes(searchId.toLowerCase());

      const matchesFrom = row.source
        .toLowerCase()
        .includes(searchFrom.toLowerCase());

      const matchesTo = row.destination
        .toLowerCase()
        .includes(searchTo.toLowerCase());

      const matchesDate =
        row.receivedDate.includes(searchDate);

      const matchesStatus =
        statusFilter === "All" ||
        row.status === statusFilter;

      return (
        matchesId &&
        matchesFrom &&
        matchesTo &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    searchId,
    searchFrom,
    searchTo,
    searchDate,
    statusFilter,
  ]);

  const indexOfLastRecord =
    currentPage * recordsPerPage;

  const indexOfFirstRecord =
    indexOfLastRecord - recordsPerPage;

  const currentRecords = filteredData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(
    filteredData.length / recordsPerPage
  );

  const stats = {
    pending: receiveData.filter(
      (x) => x.status === "Pending"
    ).length,

    partial: receiveData.filter(
      (x) => x.status === "Partially Received"
    ).length,

    completed: receiveData.filter(
      (x) => x.status === "Completed"
    ).length,

    damages: 1,
  };

  const handleSelect = (index: number) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(
        selectedRows.filter((x) => x !== index)
      );
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const handleItemSelect = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(
        selectedItems.filter((x) => x !== id)
      );
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";

      case "Partially Received":
        return "bg-blue-100 text-blue-700";

      case "Completed":
        return "bg-green-100 text-green-700";

      default:
        return "bg-red-100 text-red-700";
    }
  };


    const [openDockPopup, setOpenDockPopup] =
  useState(false);

    const [dockLocation, setDockLocation] =
  useState("");

    const [grnType, setGrnType] =
  useState("Normal");

    const [putawayStrategy, setPutawayStrategy] =
  useState("FIFO");


  return (
    <div
      className="min-h-screen overflow-x-hidden p-5 xl:p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* HEADER */}

      <div>
        <h1
          className="text-3xl font-bold xl:text-4xl"
          style={{ color: COLORS.text }}
        >
          Receive Management
        </h1>

        <p
          className="mt-2 text-sm xl:text-base"
          style={{ color: COLORS.muted }}
        >
          Warehouse inward processing,
          shipment verification and receive
          tracking.
        </p>
      </div>

      {/* KPI */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock3 size={16} />}
          bg="linear-gradient(135deg, #C8102E 0%, #D94A63 100%)"
        />

        <StatCard
          title="Partial Receive"
          value={stats.partial}
          icon={<Truck size={16} />}
          bg="linear-gradient(135deg, #005F99 0%, #2C7FB8 100%)"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 size={16} />}
          bg="linear-gradient(135deg, #0F9D58 0%, #34C38F 100%)"
        />

        <StatCard
          title="Damages"
          value={stats.damages}
          icon={<AlertTriangle size={16} />}
          bg="linear-gradient(135deg, #B45309 0%, #F59E0B 100%)"
        />
      </div>

      {/* ACTIONS */}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
        onClick={() => setOpenDockPopup(true)}
        className="rounded-xl bg-[#005F99] px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90"
            >
        Receive Selected
            </button>

        

        <button className="rounded-xl bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90">
          Print GRN
        </button>

        <div className="ml-auto text-sm font-medium text-slate-500">
          Selected Rows : {selectedRows.length}
        </div>
      </div>

      {/* TABLE */}

      <div
        className="mt-6 overflow-hidden rounded-3xl border shadow-sm"
        style={{
          backgroundColor: COLORS.card,
          borderColor: COLORS.border,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead
              className="border-b"
              style={{
                backgroundColor: "#E8114D",
              }}
            >
              <tr>
                {[
                  "SELECT",
                  "RECEIVE",
                  "FROM",
                  "TO",
                  "DATE",
                  "STATUS",
                  "VALUE",
                  "ACTIONS",
                ].map((head) => (
                 <th
  key={head}
  className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-white ${
    head === "SELECT" ? "w-[90px]" : ""
  }`}
    >
                    {head}
                  </th>
                ))}
              </tr>

              {/* FILTERS */}

              <tr className="bg-[#E8114D]">
                <th className="px-5 pb-4">
  <div className="flex items-center gap-2 text-white">
    <input
      type="checkbox"
      checked={
        selectedRows.length === currentRecords.length &&
        currentRecords.length > 0
      }
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedRows(
            currentRecords.map((_, i) => i)
          );
        } else {
          setSelectedRows([]);
        }
      }}
      className="h-4 w-4"
    />

    {/* <span className="text-xs font-semibold">
      All
    </span> */}
  </div>
    </th>

                <th className="px-2 pb-4">
                  <input
                    type="text"
                    placeholder="Search ID"
                    value={searchId}
                    onChange={(e) =>
                      setSearchId(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border-0 px-3 text-sm outline-none"
                  />
                </th>

                <th className="px-2 pb-4">
                  <input
                    type="text"
                    placeholder="From"
                    value={searchFrom}
                    onChange={(e) =>
                      setSearchFrom(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border-0 px-3 text-sm outline-none"
                  />
                </th>

                <th className="px-2 pb-4">
                  <input
                    type="text"
                    placeholder="To"
                    value={searchTo}
                    onChange={(e) =>
                      setSearchTo(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border-0 px-3 text-sm outline-none"
                  />
                </th>

                <th className="px-2 pb-4">
                  <input
                    type="text"
                    placeholder="Date"
                    value={searchDate}
                    onChange={(e) =>
                      setSearchDate(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border-0 px-3 text-sm outline-none"
                  />
                </th>

                <th className="px-2 pb-4">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                    className="h-10 w-full rounded-xl border-0 px-3 text-sm outline-none"
                  >
                    <option>All</option>

                    <option>Pending</option>

                    <option>
                      Partially Received
                    </option>

                    <option>Completed</option>
                  </select>
                </th>

                <th></th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {currentRecords.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b transition hover:bg-slate-50 ${
                    selectedRows.includes(index)
                      ? "bg-blue-50"
                      : index % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/40"
                  }`}
                  style={{
                    borderColor: COLORS.border,
                  }}
                >
                  {/* CHECK */}

                  <td className="w-[90px] px-5 py-5">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(
                        index
                      )}
                      onChange={() =>
                        handleSelect(index)
                      }
                      className="h-4 w-4"
                    />
                  </td>

                  {/* RECEIVE */}

                  <td className="px-5 py-5">
                    <div
                      className="text-xl font-bold"
                      style={{ color: COLORS.text }}
                    >
                      {row.id}
                    </div>

                    <div
                      className="mt-1 text-xs"
                      style={{
                        color: COLORS.muted,
                      }}
                    >
                      {row.transferNo}
                    </div>
                  </td>

                  {/* FROM */}

                  <td className="px-5 py-5 text-sm font-semibold">
                    {row.source}
                  </td>

                  {/* TO */}

                  <td className="px-5 py-5 text-sm font-semibold">
                    {row.destination}
                  </td>

                  {/* DATE */}

                  <td className="whitespace-nowrap px-5 py-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} />

                      {row.receivedDate}
                    </div>
                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-5">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold ${statusBadge(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* VALUE */}

                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2">
                      <Package size={18} />

                      <div>
                        <div className="text-xl font-bold">
                          {row.receivedQty}/
                          {row.expectedQty}
                        </div>

                        <div className="text-xs text-slate-500">
                          Units
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ACTION */}

                  <td className="px-5 py-5">
                    <button
                      onClick={() => {
                        setSelectedReceive(row);

                        setOpenModal(true);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-[#005F99] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
                    >
                      <Eye size={16} />

                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-white px-6 py-4">
          <div className="text-sm text-slate-600">
            Showing {indexOfFirstRecord + 1} -
            {Math.min(
              indexOfLastRecord,
              filteredData.length
            )}{" "}
            of {filteredData.length}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Records per page:
              </span>

              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(
                    Number(e.target.value)
                  );

                  setCurrentPage(1);
                }}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                <option value={5}>5</option>

                <option value={10}>10</option>

                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => prev - 1)
                }
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
              >
                Prev
              </button>

              <button
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP */}

      {openModal && (
        <div className="fixed inset-0 z-[999999] overflow-y-auto bg-[#ECF5FC]">
          <div className="relative min-h-screen w-full bg-[#ECF5FC] p-6">
            {/* HEADER */}

            <div className="sticky top-0 z-50 mb-6 rounded-3xl border border-[#DCE6F2] bg-white px-8 py-6 shadow-sm">
              <div className="flex items-center justify-between">
  <div>
    <h2 className="text-4xl font-bold text-slate-900">
      Receive Details
    </h2>

    <p className="mt-2 text-base text-slate-500">
      Shipment Verification Workspace
    </p>
  </div>

  <button
    onClick={() => setOpenModal(false)}
    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition hover:bg-red-100"
  >
    <X size={24} />
  </button>
</div>

              
            </div>

            {/* BODY */}

            <div className="max-h-[78vh] overflow-y-auto overflow-x-hidden p-6">
              {/* INFO */}

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  label="Receive No"
                  value={selectedReceive?.id}
                />

                <InfoCard
                  label="Vehicle"
                  value={selectedReceive?.vehicle}
                />

                <InfoCard
                  label="Source"
                  value={selectedReceive?.source}
                />

                <InfoCard
                  label="Destination"
                  value={
                    selectedReceive?.destination
                  }
                />
              </div>

              {/* ITEMS */}

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full table-fixed">
                  <thead className="bg-[#E8114D] text-white">
                    <tr>
                      <th className="w-[120px] px-4 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedItems.length ===
                              receiveItems.length
                            }
                            onChange={(e) => {
                              if (
                                e.target.checked
                              ) {
                                setSelectedItems(
                                  receiveItems.map(
                                    (x) => x.id
                                  )
                                );
                              } else {
                                setSelectedItems([]);
                              }
                            }}
                          />

                          Select
                        </div>
                      </th>

                      <th className="w-[140px] px-4 py-4 text-left">
                        SKU
                      </th>

                      <th className="px-4 py-4 text-left">
                        Item
                      </th>

                      <th className="w-[180px] px-4 py-4 text-left">
                        Receive Qty
                      </th>

                      <th className="w-[220px] px-4 py-4 text-left">
                        Bin Location
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {receiveItems.map(
                      (item, index) => (
                        <tr
                          key={item.id}
                          className={`border-b transition ${
                            selectedItems.includes(
                              item.id
                            )
                              ? "bg-blue-50"
                              : "bg-white"
                          }`}
                        >
                          {/* CHECK */}

                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(
                                item.id
                              )}
                              onChange={() =>
                                handleItemSelect(
                                  item.id
                                )
                              }
                            />
                          </td>

                          {/* SKU */}

                          <td className="px-4 py-4 font-bold text-[#005F99]">
                            {item.sku}
                          </td>

                          {/* ITEM */}

                          <td className="px-4 py-4">
                            {item.item}
                          </td>

                          {/* QTY */}

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              value={
                                item.receiveQty
                              }
                              onChange={(e) => {
                                const updated = [
                                  ...receiveItems,
                                ];

                                updated[
                                  index
                                ].receiveQty =
                                  Number(
                                    e.target.value
                                  );

                                setReceiveItems(
                                  updated
                                );
                              }}
                              className="h-10 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#005F99]"
                            />
                          </td>

                          {/* BIN */}

                          <td className="px-4 py-4">
                            <select
                              value={item.bin}
                              onChange={(e) => {
                                const updated = [
                                  ...receiveItems,
                                ];

                                updated[
                                  index
                                ].bin =
                                  e.target.value;

                                setReceiveItems(
                                  updated
                                );
                              }}
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#005F99]"
                            >
                              <option value="">
                                Select Bin
                              </option>

                              {warehouseBins[
                                item.warehouse as keyof typeof warehouseBins
                              ]?.map((bin) => (
                                <option
                                  key={bin}
                                  value={bin}
                                >
                                  {bin}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* SUMMARY */}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-600">
                  Selected Items :{" "}
                  {selectedItems.length}
                </div>

                <div className="text-sm text-slate-500">
                  Total Lines :{" "}
                  {receiveItems.length}
                </div>
              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t bg-white pt-5">
                <button
                  onClick={() =>
                    setOpenModal(false)
                  }
                  className="rounded-2xl border px-5 py-3 font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button className="rounded-2xl bg-[#005F99] px-6 py-3 font-semibold text-white transition hover:bg-[#004f82]">
                  Receive Selected Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCK RECEIVING POPUP */}

{openDockPopup && (
  <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Dock Receiving Allocation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Allocate selected receipts to warehouse receiving dock
          </p>
        </div>

        <button
          onClick={() => setOpenDockPopup(false)}
          className="rounded-xl bg-slate-100 p-3 hover:bg-red-100"
        >
          <X size={18} />
        </button>

      </div>

      {/* BODY */}

      <div className="grid gap-5 p-6 md:grid-cols-2">

        {/* WAREHOUSE */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Warehouse
          </label>

          <input
            value="Hyderabad RDC"
            disabled
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4"
          />
        </div>

        {/* RECEIVING DOCK */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Receiving Dock *
          </label>

          <select
            value={dockLocation}
            onChange={(e) =>
              setDockLocation(e.target.value)
            }
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#005F99]"
          >
            <option value="">
              Select Receiving Dock
            </option>

            <option value="HYD-RECV-01">
              HYD-RECV-01
            </option>

            <option value="HYD-RECV-02">
              HYD-RECV-02
            </option>

            <option value="HYD-STAGE-A01">
              HYD-STAGE-A01
            </option>
          </select>
        </div>

        {/* GRN TYPE */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            GRN Type
          </label>

          <select
            value={grnType}
            onChange={(e) =>
              setGrnType(e.target.value)
            }
            className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          >
            <option>Normal</option>

            <option>QC Hold</option>

            <option>Damage Hold</option>
          </select>
        </div>

        {/* STRATEGY */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Putaway Strategy
          </label>

          <select
            value={putawayStrategy}
            onChange={(e) =>
              setPutawayStrategy(e.target.value)
            }
            className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          >
            <option>FIFO</option>

            <option>FEFO</option>

            <option>Manual</option>
          </select>
        </div>

        {/* RECEIVED BY */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Received By
          </label>

          <input
            value="KKR Warehouse User"
            disabled
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4"
          />
        </div>

        {/* ARRIVAL */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Vehicle Arrival Time
          </label>

          <input
            type="datetime-local"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4"
          />
        </div>

        {/* REMARKS */}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Remarks
          </label>

          <textarea
            rows={4}
            placeholder="Enter remarks..."
            className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-[#005F99]"
          />
        </div>

      </div>

      {/* FOOTER */}

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

        <button
          onClick={() => setOpenDockPopup(false)}
          className="rounded-2xl border px-5 py-3 font-semibold"
        >
          Cancel
        </button>

        <button
          className="rounded-2xl bg-[#005F99] px-6 py-3 font-semibold text-white"
        >
          Allocate to Receiving Dock
        </button>

      </div>

    </div>

  </div>
)}

    </div>
  );
}

/* KPI */

function StatCard({
  title,
  value,
  icon,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div
      className="rounded-2xl px-5 py-4 text-white shadow-md transition hover:shadow-lg"
      style={{
        background: bg,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold leading-none">
            {value}
          </h2>
        </div>

        <div className="rounded-xl bg-white/15 p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* INFO CARD */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-xl font-bold text-slate-900">
        {value}
      </p>



      
    </div>
  );
}