import { useNavigate } from "react-router-dom";
import { MoreVertical, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import styles from './StudyPlanCard.module.css';

const StudyPlanCard = ({ plan, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // ✅ Navigate to roadmap page and pass full plan object as state
  const handleNavigate = () => {
    console.log("Navigating with plan:", plan);
    navigate(`/roadmap/${plan.id}`, { state: { roadmapPlan: plan } }); // Pass full plan
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.card} onClick={handleNavigate}>
      {/* 3-dot menu */}
      <div
        className={styles.menuWrapper}
        ref={menuRef}
        style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 10 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(prev => !prev);
          }}
          className={styles.menuButton}
          title="Options"
        >
          <MoreVertical size={20} />
        </button>

        {menuOpen && (
          <div className={styles.menu}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(plan.id);
                setMenuOpen(false);
              }}
              className={styles.menuItem}
            >
              <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Card content */}
      <div style={{
        padding: '1.25rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {plan.main_topic}
          </h2>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.8 }}>
            Created: {new Date(plan.created_at).toLocaleDateString()}
          </p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.8 }}>
            Available Time: {plan.available_time} hrs
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`${styles.status} ${plan.completed ? styles.completed : styles.inProgress}`}>
        {plan.completed ? "Completed" : "In Progress"}
      </div>
    </div>
  );
};

export default StudyPlanCard;
