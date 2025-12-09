import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Overview from "./pages/Overview";
import AddMenu from "./pages/AddMenu";
import UpdateMenu from "./pages/UpdateMenu";
import DeleteMenu from "./pages/DeleteMenu";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/add-menu" element={<AddMenu />} />
        <Route path="/update-menu" element={<UpdateMenu />} />
        <Route path="/delete-menu" element={<DeleteMenu />} />
      </Routes>
    </Router>
  );
}

export default App;
