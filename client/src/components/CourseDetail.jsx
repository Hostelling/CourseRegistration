import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CourseDetail({ courseId, clickKey, dataKey, onChange }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollError, setEnrollError] = useState(null);

  
    async function fetchCourse() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch(`/api/courses/${courseId}`);
        setCourse(response.course);
      } catch (err) {
        setCourse(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

   
   const handleEnroll = async () => {
    if (!course) {
      return;
    }

    try {
      setEnrollError(null);

      await apiFetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseTitle: course.title }),
      });

      onChange();
    } catch (err) {
      setEnrollError(err.message);
    }
  };


  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchCourse();
  }, [courseId, clickKey, dataKey]);

  if (loading) {
    return <p role="status">Loading course...</p>;
  }

  if (error) {
    return <p className="error" role="alert">{error}</p>;
  }

  if (!course) {
    return <p className="muted">No course selected.</p>;
  }

  
  return (
    <div className="course-detail">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <p>Capacity: {course.capacity}</p>
      <p>Start Time: {course.start_time}</p>
      <p>Day of the Week: {weekdays[course.day_of_week]}</p>
      <p>
        Prerequisites:{' '}
        {course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None'}
      </p>
      {enrollError && (
        <p className="error" role="alert">
          {enrollError}
        </p>
      )}
      <button type="button" onClick={handleEnroll}>Enroll</button>
    </div>
  );
}
