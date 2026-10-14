import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


export default function Schedule({dataKey, onChange}) {
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

    async function handleUnregister(courseId) {
        setError(null);

        try {
            await apiFetch(`/api/enrollments/${courseId}`, {
                method: 'DELETE',
            });

            onChange();
        } catch (err) {
            setError(err.message);
        }
    }

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

            <p>Day of the Week: {weekdays[course.day_of_week]}</p>
            <button
  type="button"
  onClick={() => handleUnregister(course.id)}>Unregister</button>
        </li>
        ))}
      </ul>
    )}
  </div>
);
}