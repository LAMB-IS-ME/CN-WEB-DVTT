// Bài 1 – React CRUD: Quản lý người dùng
// Component: App (giữ state chung) -> SearchForm, AddUser, ResultTable
const { useState, useEffect } = React;

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Các trường của form Thêm / Sửa. nested = true: nằm trong user.address
const FIELDS = [
  { key: "name", label: "Họ tên (Name)" },
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  { key: "street", label: "Street", nested: true },
  { key: "suite", label: "Suite", nested: true },
  { key: "city", label: "City", nested: true },
  { key: "phone", label: "Số điện thoại" },
  { key: "website", label: "Website" },
];

const EMPTY_USER = {
  name: "", username: "", email: "",
  address: { street: "", suite: "", city: "" },
  phone: "", website: "",
};

// Cập nhật một trường của user, dùng spread để copy cả object address lồng nhau
function updateField(user, key, value) {
  if (["street", "suite", "city"].includes(key)) {
    return { ...user, address: { ...user.address, [key]: value } };
  }
  return { ...user, [key]: value };
}

function fieldValue(user, f) {
  return f.nested ? user.address[f.key] : user[f.key];
}

// ---------------- SearchForm ----------------
function SearchForm({ onChangeValue }) {
  return (
    <input
      type="text"
      className="search-input"
      placeholder="Tìm theo name, username"
      onChange={(e) => onChangeValue(e.target.value)}
    />
  );
}

// ---------------- AddUser ----------------
function AddUser({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [user, setUser] = useState(EMPTY_USER);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(updateField(user, name, value));
  };

  const handleAdd = () => {
    if (user.name.trim() === "" || user.username.trim() === "") {
      alert("Vui lòng nhập Name và Username!");
      return;
    }
    onAdd(user);          // gửi user mới lên App
    setUser(EMPTY_USER);  // reset form
    setAdding(false);     // đóng modal
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Thêm</button>
      {adding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Thêm người dùng</h4>
            {FIELDS.map((f) => (
              <div className="form-row" key={f.key}>
                <label htmlFor={"add-" + f.key}>{f.label}</label>
                <input
                  id={"add-" + f.key}
                  name={f.key}
                  value={fieldValue(user, f)}
                  onChange={handleChange}
                />
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleAdd}>Thêm</button>
              <button className="btn" onClick={() => setAdding(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- ResultTable ----------------
function ResultTable({ keyword, user, onAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  // Tải danh sách người dùng một lần khi component mount
  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Khi App truyền xuống user mới: thêm vào danh sách với id = max id + 1
  useEffect(() => {
    if (user) {
      setUsers((prev) => {
        const nextId = prev.length > 0 ? Math.max(...prev.map((u) => u.id)) + 1 : 1;
        return [...prev, { ...user, id: nextId }];
      });
      onAdded(); // báo App reset newUser về null
    }
  }, [user]);

  const kw = keyword.toLowerCase();
  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw)
  );

  // Sửa: deep copy để chỉnh trên bản sao, không đụng vào users cho tới khi Lưu
  function editUser(u) {
    setEditing({ ...u, address: { ...u.address } });
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditing(updateField(editing, name, value));
  };

  function saveUser() {
    if (editing.name.trim() === "" || editing.username.trim() === "") {
      alert("Vui lòng nhập Name và Username!");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === editing.id ? editing : u)));
    setEditing(null);
  }

  function removeUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  if (loading) {
    return (
      <div className="loading">
        <span className="spinner"></span> Đang tải dữ liệu...
      </div>
    );
  }
  if (error) {
    return <p className="error">Không tải được dữ liệu: {error}</p>;
  }

  return (
    <div>
      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Username</th>
            <th>Email</th>
            <th>Địa chỉ</th>
            <th>Số điện thoại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.address.street}, {u.address.suite}, {u.address.city}</td>
              <td>{u.phone}</td>
              <td className="actions">
                <button className="btn btn-edit" onClick={() => editUser(u)}>Sửa</button>
                <button className="btn btn-delete" onClick={() => removeUser(u.id)}>Xóa</button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="7" className="empty">Không có người dùng phù hợp.</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Sửa người dùng #{editing.id}</h4>
            {FIELDS.map((f) => (
              <div className="form-row" key={f.key}>
                <label htmlFor={"edit-" + f.key}>{f.label}</label>
                <input
                  id={"edit-" + f.key}
                  name={f.key}
                  value={fieldValue(editing, f)}
                  onChange={handleEditChange}
                />
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={saveUser}>Lưu</button>
              <button className="btn" onClick={() => setEditing(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- App ----------------
function App() {
  const [kw, setKeyword] = useState("");
  const [newUser, setNewUser] = useState(null);

  return (
    <div className="container">
      <h1>Quản lý người dùng</h1>
      <div className="toolbar">
        <SearchForm onChangeValue={setKeyword} />
        <AddUser onAdd={setNewUser} />
      </div>
      <ResultTable keyword={kw} user={newUser} onAdded={() => setNewUser(null)} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
