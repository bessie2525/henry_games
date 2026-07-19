import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

const Home = lazy(() => import("@/pages/Home"));
const CognitiveGames = lazy(() => import("@/pages/CognitiveGames"));
const Points = lazy(() => import("@/pages/Points"));
const WordChallenge = lazy(() => import("@/pages/WordChallenge"));
const ChimpTestGame = lazy(() => import("@/games/chimpTest/ChimpTestGame"));
const NBackGame = lazy(() => import("@/games/nBack/NBackGame"));
const NumberMemoryGame = lazy(() => import("@/games/numberMemory/NumberMemoryGame"));
const SequentialMemoryGame = lazy(() => import("@/games/sequentialMemory/SequentialMemoryGame"));
const ShapeMemoryGame = lazy(() => import("@/games/shapeMemory/ShapeMemoryGame"));
const VisualMemoryGame = lazy(() => import("@/games/visualMemory/VisualMemoryGame"));

function RouteFallback() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl rounded-[30px] border border-white/80 bg-white/85 p-5 font-bold text-slate-600 shadow-sm shadow-slate-200">
        页面加载中...
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cognitive-games" element={<CognitiveGames />} />
            <Route path="/points" element={<Points />} />
            <Route path="/word-challenge" element={<WordChallenge />} />
            <Route path="/word-challenge/tasks/:taskId" element={<WordChallenge />} />
            <Route path="/games/chimp-test" element={<ChimpTestGame />} />
            <Route path="/games/number-memory" element={<NumberMemoryGame />} />
            <Route path="/games/sequential-memory" element={<SequentialMemoryGame />} />
            <Route path="/games/visual-memory" element={<VisualMemoryGame />} />
            <Route path="/games/shape-memory" element={<ShapeMemoryGame />} />
            <Route path="/games/n-back" element={<NBackGame />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
