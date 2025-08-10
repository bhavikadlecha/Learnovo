import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './ProgressCalendar.module.css';

const ProgressCalendar = ({ roadmap }) => {
  const [value, setValue] = useState(new Date());

  const topics = roadmap?.roadmap?.flatMap(item => item.subtopics || []) ?? [];

  const assignedDates = topics.map((topic, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toDateString(),
      topic,
    };
  });

  const getTopicForDate = (date) =>
    assignedDates.find(entry => entry.date === date.toDateString());

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>🗓️ Roadmap Study Calendar</h2>
      
      <Calendar
        onChange={setValue}
        value={value}
        tileContent={({ date }) => {
          const topicEntry = getTopicForDate(date);
          if (topicEntry) {
            return <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>📘</span>;
          }
          return null;
        }}
      />

      <div className={styles.selected}>
        <h3>Selected Date: {value.toDateString()}</h3>
        {getTopicForDate(value) ? (
          <p className={styles.topic}>
            {getTopicForDate(value).topic.label}
          </p>
        ) : (
          <p className={styles.noTopic}>No topic assigned</p>
        )}
      </div>
    </div>
  );
};

export default ProgressCalendar;
