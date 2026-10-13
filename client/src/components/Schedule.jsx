import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function Schedule({dataKey}) {
    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSchedule() {
      try {
        const response = await apiFetch('/api/enrollments');
        setSchedule(response.enrollments);
        setError(null);
      } catch (err) {
        setSchedule([]);
        setError(err.message);
      }
    }

    fetchSchedule();
  }, [dataKey])

    return (
  <div className="schedule">
    {error && <p className="error" role="alert">{error}</p>}

    {schedule.length === 0 ? (
      <p className="muted">You are not enrolled in any courses yet.</p>
    ) : (
      <ul>
        {schedule.map((course) => (
          <li key={course.id}>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
);
}