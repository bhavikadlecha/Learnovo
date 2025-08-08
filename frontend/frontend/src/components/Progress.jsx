import React from 'react';
import ProgressCalendar from './ProgressCalendar';
import { useUserStore } from '../store/userStore';
import styles from './Progress.module.css';

const Progress = () => {
  const { studyPlans } = useUserStore();
  const firstRoadmap = studyPlans[0]?.roadmap ? studyPlans[0] : null;

  return (
    <div className={styles.wrapper}>
      {firstRoadmap ? (
        <ProgressCalendar roadmap={firstRoadmap} />
      ) : (
        <p className={styles.noRoadmap}>No roadmap selected or created yet.</p>
      )}
    </div>
  );
};

export default Progress;
