"use client";
import React, { useMemo, useState, useEffect } from "react";
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

/* ================= COMPONENT ================= */

export default function UserMasterPage() {

  const [data, setData] = useState<User[]>([]);

  /* ===== Filters ===== */

  const [searchName, setSearchName] = useState("");
const [searchId, setSearchId] = useState("");
const [searchEmail, setSearchEmail] = useState("");
const [searchPhone, setSearchPhone] = useState("");
const [searchRole, setSearchRole] = useState("");

useEffect(() => {
  fetch("/api/users")
    .then((res) => res.json())
    .then((data) => setData(data));
}, []);

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

    const byId = (u.employeeId || "")
      .toLowerCase()
      .includes(searchId.toLowerCase());

    const byName = (u.name || "")
      .toLowerCase()
      .includes(searchName.toLowerCase());

    const byEmail = (u.email || "")
      .toLowerCase()
      .includes(searchEmail.toLowerCase());

    const byPhone = (u.phone || "")
      .toLowerCase()
      .includes(searchPhone.toLowerCase());

    const byRole = (u.role || "")
      .toLowerCase()
      .includes(searchRole.toLowerCase());

    return byId && byName && byEmail && byPhone && byRole;

  });

}, [data, searchName, searchId, searchEmail, searchPhone, searchRole]);


  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = filteredData.slice(

    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage

  );

  /* ================= QUICK STATS ================= */

const stats = {

  total: data.length,

  active: data.filter(
    (u) => u.status === "Active"
  ).length,

  inactive: data.filter(
    (u) => u.status === "Inactive"
  ).length,

  admins: data.filter(
    (u) => u.role === "Admin"
  ).length,

  departments: new Set(
    data.map((u) => u.department)
  ).size,

  roles: new Set(
    data.map((u) => u.role)
  ).size,

};

  /* ================= FORM FUNCTIONS ================= */

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

  const cleanId = u.employeeId.trim();

  setForm({
    ...u,
    employeeId: cleanId
  });

  setEditingId(cleanId);

  setIsModalOpen(true);

};

  const closeModal = () => {

    setIsModalOpen(false);
    resetForm();

  };

  const onSave = async () => {

  if (!form.employeeId) {
    alert("Employee ID required");
    return;
  }

  if (!form.name) {
    alert("Name required");
    return;
  }

  if (!form.phone) {
    alert("Phone required");
    return;
  }

  try {

    if (editingId) {

 // UPDATE USER

const id = form.employeeId.trim().toUpperCase();

const res = await fetch(`/api/users/${encodeURIComponent(form.employeeId.trim())}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: form.name,
    email: form.email,
    phone: form.phone,
    department: form.department,
    role: form.role,
    status: form.status
  })
});

const result = await res.json();

if (!res.ok) {
  alert(result.error || "Update failed");
  return;
}

const updatedUser: User = result;

setData(prev =>
  prev.map(u =>
    u.employeeId === updatedUser.employeeId ? updatedUser : u
  )
);

alert("User updated successfully");
    }    
    else {

      // CREATE USER
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Save failed");

      const newUser = await res.json();

      /* API snake_case handle */
      const mappedUser: User = {
        employeeId: newUser.employeeId || newUser.employee_id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        department: newUser.department,
        role: newUser.role,
        status: newUser.status,
      };

setData((prev) => [mappedUser, ...prev]);

      alert("User created successfully");

    }

    closeModal();

  } catch (error: any) {
  console.error("Save/Update Error:", error);
  alert(error?.message || "Error saving user");
}

};

  const onDelete = (id: string) => {

    if (!confirm("Delete user?")) return;

    setData((prev) =>
      prev.filter((u) => u.employeeId !== id)
    );

  };

  /* ================= EXPORT ================= */

  const exportCSV = () => {

    const header = [
      "Employee ID",
      "Name",
      "Email",
      "Phone",
      "Department",
      "Role",
      "Status",
    ];

    const rows = filteredData.map((u) =>
      [
        u.employeeId,
        u.name,
        u.email,
        u.phone,
        u.department,
        u.role,
        u.status,
      ].join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "user-master.csv";
    link.click();

  };

  /* ================= UI ================= */

  return (

    <div>

      <PageBreadcrumb pageTitle="User Master" />

      <div className="rounded-2xl border bg-white p-6">

        {/* HEADER */}

        <div className="flex justify-between mb-5">

          <div>

            <h2 className="text-2xl font-semibold">
              User Master
            </h2>

            <p className="text-sm text-gray-500">
              Manage SIMS application users
            </p>

          </div>

          <div className="flex gap-2">

            <button
              onClick={openAdd}
              className="bg-[#005F99] text-white px-5 py-2 rounded-xl"
            >
              + Add User
            </button>

            <button
              onClick={exportCSV}
              className="bg-red-600 text-white px-5 py-2 rounded-xl"
            >
              Export CSV
            </button>

          </div>

        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">

          {/* TABLE */}

          <div>

            <table className="w-full text-sm border">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">

                    Employee ID

                    <input
                      className="w-full border mt-1 px-2 py-1 text-xs"
                      placeholder="Search"
                      value={searchId}
                      onChange={(e) =>
                        setSearchId(e.target.value)
                      }
                    />

                  </th>

                  <th className="p-3 text-left">

                    Name

                    <input
                      className="w-full border mt-1 px-2 py-1 text-xs"
                      placeholder="Search"
                      value={searchName}
                      onChange={(e) =>
                        setSearchName(e.target.value)
                      }
                    />

                  </th>

                  <th className="p-3 text-left">
  Email
  <input
    className="w-full border mt-1 px-2 py-1 text-xs"
    placeholder="Search"
    value={searchEmail}
    onChange={(e) =>
      setSearchEmail(e.target.value)
    }
  />
</th>

                  <th className="p-3 text-left">
  Phone
  <input
    className="w-full border mt-1 px-2 py-1 text-xs"
    placeholder="Search"
    value={searchPhone}
    onChange={(e) =>
      setSearchPhone(e.target.value)
    }
  />
</th>

                  <th className="p-3 text-left">
  Role
  <input
    className="w-full border mt-1 px-2 py-1 text-xs"
    placeholder="Search"
    value={searchRole}
    onChange={(e) =>
      setSearchRole(e.target.value)
    }
  />
</th>

                  <th className="p-3 text-left">Status</th>

                  <th className="p-3">Actions</th>

                </tr>

              </thead>

              <tbody>

                {paginatedData.map((u) => (

                  <tr
                    key={u.employeeId}
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-3 font-medium">
                      {u.employeeId}
                    </td>

                    <td className="p-3">
                      {u.name}
                    </td>

                    <td className="p-3">
                      {u.email}
                    </td>

                    <td className="p-3">
                      {u.phone}
                    </td>

                    <td className="p-3">
                      {u.role}
                    </td>

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
                        onClick={() =>
                          onDelete(u.employeeId)
                        }
                        className="text-red-600"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

            {/* PAGINATION */}

            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">

              <div className="text-sm text-gray-500">

                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} entries

              </div>

              <div className="flex items-center gap-2 text-sm">

                <span>Records per page:</span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm"
                >

                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>

                </select>

              </div>

              <div className="flex gap-2">

                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>

              </div>

            </div>

          </div>

          {/* QUICK STATS */}

{/* ================= QUICK STATS ================= */}

<div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-800">
      Quick Stats
    </h3>

    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
  </div>

  <div className="space-y-3 text-sm">

    <div className="flex justify-between items-center">
      <span>Total Users</span>
      <span className="bg-gray-200 px-3 py-1 rounded-full font-semibold">
        {stats.total}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span>Active</span>
      <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">
        {stats.active}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span>Inactive</span>
      <span className="bg-red-200 text-red-700 px-3 py-1 rounded-full font-semibold">
        {stats.inactive}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span>Admins</span>
      <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-semibold">
        {stats.admins}
      </span>
    </div>

  </div>

  {/* Divider */}

  <div className="border-t my-4"></div>

  {/* Extra Info */}

  <div className="space-y-3 text-sm">

    <div className="flex justify-between items-center">
      <span>Departments</span>
      <span className="bg-gray-200 px-3 py-1 rounded-full font-semibold">
        {stats.departments}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <span>Roles</span>
      <span className="bg-gray-200 px-3 py-1 rounded-full font-semibold">
        {stats.roles}
      </span>
    </div>

  </div>

  {/* Tip Box */}

  <div className="mt-4 bg-gray-100 border rounded-xl p-3 text-xs text-gray-600">
    Tip: Filters apply to stats + export.
  </div>

  {/* Info Box */}

  <div className="mt-3 bg-gray-100 border rounded-xl p-3 text-xs text-gray-600">
    Users: Add → Assign role → Grant module access.
  </div>

</div>

        </div>

      </div>

      {/* MODAL */}

      {isModalOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-2xl w-[420px]">

            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Edit User" : "Add User"}
            </h3>

            <div className="space-y-3">

              <input
  placeholder="Employee ID"
  value={form.employeeId}
  disabled={!!editingId}
  onChange={(e) =>
    setForm({ ...form, employeeId: e.target.valuetoUpperCase() })
  }
  className="w-full border px-3 py-2 rounded"
/>

              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Department"
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <select
  value={form.role || ""}
  onChange={(e) =>
    setForm({
      ...form,
      role: e.target.value as Role,
    })
  }
  className="w-full border px-3 py-2 rounded"
>
  <option value="" disabled>
    --Select--
  </option>
  <option value="Admin">Admin</option>
  <option value="Warehouse Manager">Warehouse Manager</option>
  <option value="Supervisor">Supervisor</option>
  <option value="Operator">Operator</option>
  <option value="Viewer">Viewer</option>
</select>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Status,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

            </div>

            <div className="flex justify-end gap-2 mt-5">

              <button
                onClick={closeModal}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={onSave}
                className="bg-[#005F99] text-white px-4 py-2 rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );
}