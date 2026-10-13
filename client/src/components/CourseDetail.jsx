import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function CourseDetail({ courseId, clickKey, dataKey }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setError(null);
      setLoading(false);
      return;
    }

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
      <p>Time: {course.time}</p>
    </div>
  );
}
