import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Play, RotateCcw, Check, X, ArrowLeft, Layers } from 'lucide-react';
import vocabData from './data/vocab.json';
import './App.css';

/* ─────────────────────────────────────────────
   FLASHCARD component
───────────────────────────────────────────── */
const Flashcard = ({ item, onSwipe, studyMode }) => {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleDragStart = () => setDragging(true);

  const handleDrag = (_, info) => {
    setOffset(info.offset.x);
  };

  const handleDragEnd = (_, info) => {
    setDragging(false);
    const x = info.offset.x;
    if (x > 80) {
      onSwipe('right');
    } else if (x < -80) {
      onSwipe('left');
    } else {
      setOffset(0);
    }
  };

  const handleTap = () => {
    setFlipped(!flipped);
  };

  const rotate = dragging ? offset * 0.06 : 0;
  const indicatorOpacity = Math.min(Math.abs(offset) / 80, 1);

  return (
    <motion.div
      className="flashcard"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate }}
      exit={{ x: offset > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{ zIndex: 10, cursor: dragging ? 'grabbing' : 'grab' }}
    >
      {/* Swipe indicators */}
      {dragging && offset > 10 && (
        <div className="swipe-indicator right" style={{ opacity: indicatorOpacity }}>
          <Check size={36} color="#4cd964" />
          <span>Thuộc rồi!</span>
        </div>
      )}
      {dragging && offset < -10 && (
        <div className="swipe-indicator left" style={{ opacity: indicatorOpacity }}>
          <X size={36} color="#ff4b4b" />
          <span>Chưa thuộc</span>
        </div>
      )}

      {/* 3D Flip Container */}
      <motion.div 
        className="card-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card-face card-front">
          <h2 className="kanji">
            {studyMode === 'kanji' ? (item.kanji || item.hiragana) : (item.kanji || item.hiragana)}
          </h2>
          {studyMode === 'vocab' && item.kanji && (
            <p className="hiragana">{item.hiragana}</p>
          )}
          <div className="tap-hint">Chạm để lật</div>
        </div>

        <div className="card-face card-back">
          {studyMode === 'kanji' && (
            <h2 className="kanji" style={{ fontSize: 'clamp(24px, 8vw, 42px)' }}>
              {item.hiragana}
            </h2>
          )}
          <div className="divider" />
          <p className="meaning">{item.meaning_vi}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
const App = () => {
  const [screen, setScreen] = useState('settings');
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [timeLimit, setTimeLimit] = useState(5);
  const [studyMode, setStudyMode] = useState('vocab'); // 'vocab' | 'kanji'

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [studied, setStudied] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const allLessons = vocabData.map(d => d.lesson);

  useEffect(() => {
    if (screen !== 'study') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setScreen('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  const startStudy = () => {
    if (selectedLessons.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài học!');
      return;
    }
    let q = [];
    vocabData.forEach(d => {
      if (selectedLessons.includes(d.lesson)) q = q.concat(d.vocab);
    });
    
    // Shuffle logic
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }

    setQueue(q);
    setIndex(0);
    setScore(0);
    setStudied(0);
    setTimeLeft(timeLimit * 60);
    setScreen('study');
  };

  const handleSwipe = useCallback((direction) => {
    setStudied(prev => prev + 1);

    if (direction === 'right') {
      setScore(prev => prev + 1);
    } else {
      setQueue(prev => {
        const current = prev[index];
        return [...prev, current];
      });
    }

    setIndex(prev => {
      const next = prev + 1;
      setQueue(q => {
        if (next >= q.length) {
          clearInterval(timerRef.current);
          setScreen('result');
        }
        return q;
      });
      return next;
    });
  }, [index]);

  const formatTime = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const toggleLesson = l => {
    setSelectedLessons(prev =>
      prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]
    );
  };

  return (
    <div className="app-container">
      {screen === 'settings' && (
        <div className="settings-screen">
          <div className="header">
            <h1>N5 Flashcards</h1>
            <p>Học từ vựng Minna no Nihongo</p>
          </div>

          <div className="settings-card">
            
            <div className="setting-section">
              <h3><Layers size={18} /> Chế độ học</h3>
              <div className="mode-row">
                <button 
                  className={`mode-btn ${studyMode === 'vocab' ? 'active' : ''}`}
                  onClick={() => setStudyMode('vocab')}
                >
                  Từ Vựng
                </button>
                <button 
                  className={`mode-btn ${studyMode === 'kanji' ? 'active' : ''}`}
                  onClick={() => setStudyMode('kanji')}
                >
                  Kanji
                </button>
              </div>
            </div>

            <div className="setting-section">
              <h3><BookOpen size={18} /> Chọn bài học</h3>
              <div className="lesson-grid">
                {allLessons.map(l => (
                  <button
                    key={l}
                    className={`lesson-btn ${selectedLessons.includes(l) ? 'active' : ''}`}
                    onClick={() => toggleLesson(l)}
                  >
                    Bài {l}
                  </button>
                ))}
              </div>
              <div className="btn-row">
                <button className="select-all-btn" onClick={() => setSelectedLessons(allLessons)}>Chọn tất cả</button>
                <button className="select-all-btn clear" onClick={() => setSelectedLessons([])}>Bỏ chọn</button>
              </div>
            </div>

            <div className="setting-section">
              <h3><Clock size={18} /> Thời gian học</h3>
              <input
                type="range" min="1" max="60"
                value={timeLimit}
                onChange={e => setTimeLimit(parseInt(e.target.value))}
              />
              <div className="time-display">{timeLimit} phút</div>
            </div>

            <button className="start-btn" onClick={startStudy}>
              <Play size={20} /> Bắt đầu học
            </button>
          </div>
        </div>
      )}

      {screen === 'study' && (
        <div className="study-screen">
          <div className="top-bar">
            <button className="back-btn" onClick={() => setScreen('settings')}>
              <ArrowLeft size={22} />
            </button>
            <div className="timer">{formatTime(timeLeft)}</div>
            <div className="progress">{Math.min(index + 1, queue.length)} / {queue.length}</div>
          </div>

          <div className="card-container">
            {index + 1 < queue.length && (
              <div className="flashcard background-card"></div>
            )}

            <AnimatePresence>
              {index < queue.length && (
                <Flashcard
                  key={index}
                  item={queue[index]}
                  onSwipe={handleSwipe}
                  studyMode={studyMode}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="action-hints">
            <div className="hint"><X size={28} color="#ff4b4b" /> Chưa thuộc</div>
            <div className="hint"><Check size={28} color="#4cd964" /> Đã thuộc</div>
          </div>
        </div>
      )}

      {screen === 'result' && (
        <div className="result-screen">
          <h2>Kết quả học tập 🎉</h2>
          <div className="stats-box">
            <div className="stat">
              <span className="label">Đã học:</span>
              <span className="value">{studied} từ</span>
            </div>
            <div className="stat">
              <span className="label">Đã thuộc:</span>
              <span className="value text-green">{score} từ</span>
            </div>
            <div className="stat">
              <span className="label">Tỷ lệ:</span>
              <span className="value">{studied > 0 ? Math.round((score / studied) * 100) : 0}%</span>
            </div>
          </div>
          <button className="restart-btn" onClick={() => setScreen('settings')}>
            <RotateCcw size={18} /> Học lại
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
