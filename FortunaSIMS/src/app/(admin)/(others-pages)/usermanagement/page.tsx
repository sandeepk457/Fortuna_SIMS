"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

type Status = "Active" | "Inactive";

type Role =
  | ""
  | "Admin"
  | "Warehouse Manager"
  | "Supervisor"
  | "Operator"
  | "Viewer";

interface User {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: Role;
  status: Status;
}

/* ================= SAMPLE USERS ================= */

const DEFAULT_USERS: User[] = [
  {
    employeeId: "EMP001",
    name: "Ravi Kumar",
    email: "ravi@sims.com",
    phone: "9876543210",
    department: "Warehouse",
    role: "Warehouse Manager",
    status: "Active",
  },
  {
    employeeId: "EMP002",
    name: "Anitha Reddy",
    email: "anitha@sims.com",
    phone: "9988776655",
    department: "Inventory",
    role: "Supervisor",
    status: "Active",
  },
  {
    employeeId: "EMP003",
    name: "Kiran Kumar",
    email: "kiran@sims.com",
    phone: "9123456780",
    department: "Warehouse",
    role: "Operator",
    status: "Inactive",
  },
  {
    employeeId: "EMP004",
    name: "Suresh Babu",
    email: "suresh@sims.com",
    phone: "9090909090",
    department: "Logistics",
    role: "Supervisor",
    status: "Active",
  },
  {
    employeeId: "EMP005",
    name: "Meena Devi",
    email: "meena@sims.com",
    phone: "9012345678",
    department: "Procurement",
    role: "Admin",
    status: "Active",
  },
  {
    employeeId: "EMP006",
    name: "Rajesh Kumar",
    email: "rajesh@sims.com",
    phone: "8887776665",
    department: "Warehouse",
    role: "Operator",
    status: "Active",
  },
];

export default function UserMasterPage() {

  const [data, setData] = useState<User[]>(DEFAULT_USERS);

  /* ===== Filters ===== */

  const [searchName, setSearchName] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchRole, setSearchRole] = useState("");

  /* ===== Pagination ===== */

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  /* ===== Modal ===== */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<User>({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    status: "Active",
  });

  /* ================= FILTER ================= */

  const filteredData = useMemo(() => {

    return data.filter((u) => {

      const byName = u.name
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const byId = u.employeeId
        .toLowerCase()
        .includes(searchId.toLowerCase());

      const byEmail = u.email
        .toLowerCase()
        .includes(searchEmail.toLowerCase());

      const byPhone = u.phone
        .includes(searchPhone);

      const byRole = u.role
        .toLowerCase()
        .includes(searchRole.toLowerCase());

      return byName && byId && byEmail && byPhone && byRole;

    });

  }, [data, searchName, searchId, searchEmail, searchPhone, searchRole]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= FORM ================= */

  const resetForm = () => {

    setForm({
      employeeId: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      role: "",
      status: "Active",
    });

    setEditingId(null);

  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setForm(u);
    setEditingId(u.employeeId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const onSave = () => {

    if (!form.employeeId || !form.name) {
      alert("Employee ID & Name required");
      return;
    }

    if (!form.role) {
      alert("Please select role");
      return;
    }

    if (editingId) {

      setData((prev) =>
        prev.map((u) =>
          u.employeeId === editingId ? form : u
        )
      );

    } else {

      setData((prev) => [form, ...prev]);

    }

    closeModal();

  };

  const onDelete = (id: string) => {

    if (!confirm("Delete user?")) return;

    setData((prev) =>
      prev.filter((u) => u.employeeId !== id)
    );

  };

  return (

    <div>

      <PageBreadcrumb pageTitle="User Master" />

      <div className="rounded-2xl border bg-white p-6">

        <div className="flex justify-between mb-5">

          <div>
            <h2 className="text-2xl font-semibold">
              User Master
            </h2>
            <p className="text-sm text-gray-500">
              Manage SIMS application users
            </p>
          </div>

          <button
            onClick={openAdd}
            className="bg-[#005F99] text-white px-5 py-2 rounded-xl"
          >
            + Add User
          </button>

        </div>

        <table className="w-full text-sm border">

          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left">
                Employee ID
                <input
                  className="w-full border mt-1 px-2 py-1 text-xs"
                  placeholder="Search"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </th>

              <th className="p-3 text-left">
                Name
                <input
                  className="w-full border mt-1 px-2 py-1 text-xs"
                  placeholder="Search"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </th>

              <th className="p-3 text-left">
                Email
                <input
                  className="w-full border mt-1 px-2 py-1 text-xs"
                  placeholder="Search"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </th>

              <th className="p-3 text-left">
                Phone
                <input
                  className="w-full border mt-1 px-2 py-1 text-xs"
                  placeholder="Search"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                />
              </th>

              <th className="p-3 text-left">
                Role
                <input
                  className="w-full border mt-1 px-2 py-1 text-xs"
                  placeholder="Search"
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                />
              </th>

              <th className="p-3 text-left">Status</th>

              <th className="p-3">Actions</th>

            </tr>

          </thead>

          <tbody>

            {paginatedData.map((u) => (

              <tr key={u.employeeId} className="border-t">

                <td className="p-3">{u.employeeId}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.role}</td>

                <td className="p-3">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      u.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {u.status}
                  </span>

                </td>

                <td className="p-3 space-x-3">

                  <button
                    onClick={() => openEdit(u)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(u.employeeId)}
                    className="text-red-600"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}