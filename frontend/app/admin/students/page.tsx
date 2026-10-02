"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import Guard from "@/components/Guard";
import Shell from "@/components/Shell";
import { Plus, Search, Filter, Edit2, Trash2, X } from "lucide-react";

interface ClassInfo {
  name: string;
  minAge: number;
  maxAge: number;
}

const initialForm = {
  name: "",
  email: "",
  password: "Student@123",
  mobile: "",
  className: "",
  city: "Kasganj",
  state: "Uttar Pradesh",
  fatherName: "",
  dob: "",
  address: "",
  pincode: "",
};

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filters, setFilters] = useState<any>({ classes: [], cities: [] });
  const [classOptions, setClassOptions] = useState<ClassInfo[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  function cleanText(value: string) {
    return value.trim().replace(/\s+/g, " ");
  }

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function load() {
    API.get("/admin/students", {
      params: {
        page,
        limit: 15,
        search: search.trim(),
        className: classFilter,
        city: cityFilter,
      },
    })
      .then((r) => {
        setStudents(r.data.students || []);
        setTotal(r.data.total || 0);
        setPages(r.data.pages || 1);
      })
      .catch(() => {
        alert("Failed to load students");
      });
  }

  useEffect(() => {
    API.get("/admin/filter-options")
      .then((r) => setFilters(r.data))
      .catch(() => {});

    API.get("/classes")
      .then((r) => {
        const classes = r.data.classes || [];
        setClassOptions(classes);

        if (classes.length > 0) {
          setForm((f) => ({
            ...f,
            className: f.className || classes[0].name,
          }));
        }
      })
      .catch(() => {
        alert("Failed to load class list");
      });
  }, []);

  useEffect(() => {
    load();
  }, [page, classFilter, cityFilter]);

  function validateForm(payload: typeof initialForm) {
    const errors: string[] = [];

    if (!payload.name || payload.name.length < 2) {
      errors.push("Full Name is required and must be at least 2 characters.");
    }

    if (!payload.fatherName || payload.fatherName.length < 2) {
      errors.push("Father Name is required and must be at least 2 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!payload.email || !emailRegex.test(payload.email)) {
      errors.push("Valid Email is required.");
    }

    if (!payload.password && !editing) {
      errors.push("Password is required.");
    }

    if (payload.password && payload.password.length < 6) {
      errors.push("Password must be at least 6 characters.");
    }

    if (!payload.mobile || !/^[6-9]\d{9}$/.test(payload.mobile)) {
      errors.push(
        "Mobile number is required and must be valid 10 digits starting with 6, 7, 8, or 9.",
      );
    }

    if (!payload.className) {
      errors.push("Class / Course is required.");
    }

    if (!payload.dob) {
      errors.push("Date of Birth is required.");
    }

    if (!payload.city || payload.city.length < 2) {
      errors.push("City is required.");
    }

    if (!payload.state || payload.state.length < 2) {
      errors.push("State is required.");
    }

    if (!payload.pincode || !/^\d{6}$/.test(payload.pincode)) {
      errors.push("Pincode is required and must be exactly 6 digits.");
    }

    if (!payload.address || payload.address.length < 5) {
      errors.push("Address is required and must be at least 5 characters.");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }

    return true;
  }

  function getCleanPayload() {
    return {
      name: cleanText(form.name),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      mobile: onlyDigits(form.mobile),
      className: form.className.trim(),
      city: cleanText(form.city),
      state: cleanText(form.state),
      fatherName: cleanText(form.fatherName),
      dob: form.dob,
      address: cleanText(form.address),
      pincode: onlyDigits(form.pincode),
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const payload = getCleanPayload();

    if (!validateForm(payload)) return;

    try {
      setSaving(true);

      if (editing) {
        const updatePayload: any = { ...payload };

        if (!updatePayload.password) {
          delete updatePayload.password;
        }

        await API.put(`/admin/students/${editing.id}`, updatePayload);
        alert("Student updated successfully ✅");
      } else {
        await API.post("/admin/students", payload);
        alert("Student created successfully ✅");
      }

      setShowForm(false);
      setEditing(null);
      setForm({
        ...initialForm,
        className: classOptions[0]?.name || "",
      });

      load();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Something went wrong. Please try again.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(student: any) {
    setEditing(student);
    setForm({
      name: student.name || "",
      email: student.email || "",
      password: "",
      mobile: student.mobile || "",
      className: student.className || classOptions[0]?.name || "",
      city: student.city || "",
      state: student.state || "",
      fatherName: student.fatherName || "",
      dob: student.dob || "",
      address: student.address || "",
      pincode: student.pincode || "",
    });
    setShowForm(true);
  }

  async function deleteStudent(id: number) {
    if (!confirm("Delete this student?")) return;

    try {
      await API.delete(`/admin/students/${id}`);
      alert("Student deleted successfully ✅");
      load();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to delete student");
    }
  }

  async function toggleStatus(student: any) {
    try {
      await API.put(`/admin/students/${student.id}`, {
        isActive: !student.isActive,
      });
      load();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update status");
    }
  }

  function openAddForm() {
    setEditing(null);
    setForm({
      ...initialForm,
      className: classOptions[0]?.name || "",
    });
    setShowForm(true);
  }

  function updateField(key: string, value: string) {
    if (key === "mobile") {
      setForm({ ...form, mobile: onlyDigits(value).slice(0, 10) });
      return;
    }

    if (key === "pincode") {
      setForm({ ...form, pincode: onlyDigits(value).slice(0, 6) });
      return;
    }

    if (key === "email") {
      setForm({ ...form, email: value.trim().toLowerCase() });
      return;
    }

    setForm({ ...form, [key]: value });
  }

  return (
    <Guard role="ADMIN">
      <Shell>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Student Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {total} students registered
            </p>
          </div>

          <button onClick={openAddForm} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>

        <div className="card p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>

            <select
              className="select"
              value={classFilter}
              onChange={(e) => {
                setPage(1);
                setClassFilter(e.target.value);
              }}
            >
              <option value="">All Classes</option>
              {filters.classes?.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={cityFilter}
              onChange={(e) => {
                setPage(1);
                setCityFilter(e.target.value);
              }}
            >
              <option value="">All Cities</option>
              {filters.cities?.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button onClick={load} className="btn btn-secondary">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Reg. ID</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-blue-700 font-bold">
                      {s.registrationId || `#${s.id}`}
                    </td>

                    <td>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>

                    <td>
                      <span className="badge bg-blue-50 text-blue-700">
                        {s.className}
                      </span>
                    </td>

                    <td className="text-slate-600">{s.city}</td>

                    <td>
                      <button
                        onClick={() => toggleStatus(s)}
                        className={`badge cursor-pointer ${
                          s.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.isActive ? "Active" : "Blocked"}
                      </button>
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(s)}
                          className="btn btn-ghost btn-sm"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => deleteStudent(s.id)}
                          className="btn btn-ghost btn-sm text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400"
                    >
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Page {page} of {pages} • {total} total
              </p>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-outline btn-sm"
                >
                  Prev
                </button>

                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-outline btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div
              className="modal-content p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editing ? "Edit Student" : "Add New Student"}
                </h2>

                <button
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost btn-icon"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Email *
                    </label>
                    <input
                      className="input"
                      type="email"
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {editing
                        ? "New Password (leave blank to keep old)"
                        : "Password *"}
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      required={!editing}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Mobile *
                    </label>
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10 digit mobile number"
                      value={form.mobile}
                      onChange={(e) => updateField("mobile", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Father Name *
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Father Name"
                      value={form.fatherName}
                      onChange={(e) =>
                        updateField("fatherName", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={form.dob}
                      onChange={(e) => updateField("dob", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      City *
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      State *
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Pincode *
                    </label>
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6 digit pincode"
                      value={form.pincode}
                      onChange={(e) => updateField("pincode", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Class / Course *
                    </label>
                    <select
                      className="select"
                      value={form.className}
                      onChange={(e) => updateField("className", e.target.value)}
                      required
                    >
                      <option value="">Select Class / Course</option>
                      {classOptions.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} (Age: {c.minAge}-{c.maxAge})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Address *
                  </label>
                  <textarea
                    className="input min-h-[70px]"
                    placeholder="Full address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-outline"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Update Student"
                        : "Create Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Shell>
    </Guard>
  );
}
