import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ChimpTestGame from "@/games/chimpTest/ChimpTestGame";
import NBackGame from "@/games/nBack/NBackGame";
import NumberMemoryGame from "@/games/numberMemory/NumberMemoryGame";
import SequentialMemoryGame from "@/games/sequentialMemory/SequentialMemoryGame";
import ShapeMemoryGame from "@/games/shapeMemory/ShapeMemoryGame";
import VisualMemoryGame from "@/games/visualMemory/VisualMemoryGame";
import { AuthProvider } from "@/hooks/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/chimp-test" element={<ChimpTestGame />} />
          <Route path="/games/number-memory" element={<NumberMemoryGame />} />
          <Route path="/games/sequential-memory" element={<SequentialMemoryGame />} />
          <Route path="/games/visual-memory" element={<VisualMemoryGame />} />
          <Route path="/games/shape-memory" element={<ShapeMemoryGame />} />
          <Route path="/games/n-back" element={<NBackGame />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
